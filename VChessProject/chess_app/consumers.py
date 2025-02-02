import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

from .models import Game, MoveUCI, ChessUser, GameSearchSettings, Rating, GameResult
from .support_modules.json_func import json_exception
from .support_modules.maintain import RedisClient, change_elo
from importlib.machinery import SourceFileLoader
from .tasks import add_player_to_search_queue, delete_player_from_search_queue, start_global_search

from django.db.models import Q
import chess

logger = logging.getLogger(__name__)


def get_all_moves_uci(board):
    return [move.uci() for move in board.move_stack]


class OnlineGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["game_id"]
        self.room_group_name = f"online_game_{self.room_name}"
        self.game_id = int(self.room_name)
        self.chess_user = await self.get_chess_player(self.scope["user"])
        logger.info(f"Game ID: {self.game_id}")
        self.player_black_id = 2
        self.board = chess.Board()

        # 1. getting game from db
        self.current_game = await self.get_current_game()
        self.game_search_settings = await self.get_game_search_settings()
        # 2. getting id of player_white and player_black
        self.player_white = await self.get_white_player()
        self.player_black = await self.get_black_player()
        self.game_type = await self.get_game_type()
        self.player_white_rating = await self.get_player_rating(self.player_white, self.game_type)
        self.player_black_rating = await self.get_player_rating(self.player_black, self.game_type)

        self.block_white = True if self.player_black.id == self.chess_user.id else False
        self.block_black = True if self.player_white.id == self.chess_user.id else False

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

        await self.flip_board_if_black()
        await self.update_position_client()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        current_time = timezone.now()
        text_data_json = json.loads(text_data)
        message_type = text_data_json["type"]

        match message_type:
            case "new_move":
                await self.new_move(text_data_json, current_time)
            case _:
                raise Exception(f"This message type ({message_type}) is not existing")

    async def new_move(self, json_data, current_time):
        if self.chess_user.id != self.player_white.id and self.chess_user.id != self.player_black.id:
            await self.send(
                json_exception("id_not_matching", "Id of player that made a move is not matching game players id"))
            return

        move_number = json_data["move_number"]
        move_notation_uci = json_data["move_notation_uci"]
        is_white = json_data['color_is_white']
        if is_white:
            if self.player_white.id != self.chess_user.id:
                await self.send(
                    json_exception("not_right_color", "Trying to push move, but color is not matching"))
                return
        else:
            if self.player_black.id != self.chess_user.id:
                await self.send(
                    json_exception("not_right_color", "Trying to push move, but color is not matching"))
                return

        logger.info(f"NEW MOVE: move_number={move_number}, is_white={is_white}, uci={move_notation_uci}")
        time_on_clock = self.game_search_settings.full_time
        if move_number > 1:
            last_move_with_same_color = await self.get_last_move_with_color(is_white)
            last_move_in_game = await self.get_last_move_in_game()
            logger.info(f"last_move_in_game == {last_move_in_game}")
            time_difference = current_time - last_move_in_game.last_update
            time_difference_in_seconds = time_difference.total_seconds()
            time_on_clock = last_move_with_same_color.time_on_clock - time_difference_in_seconds
            time_on_clock += self.game_search_settings.time_per_move

        new_move = await self.create_new_move(move_number, is_white, move_notation_uci, time_on_clock, current_time)
        await self.update_position_room()

    async def update_position_from_db(self):
        # 3. getting current_position
        all_moves_obj = await self.get_all_moves_of_game(self.current_game)
        all_moves_uci = [move.uci for move in all_moves_obj]
        current_moves = self.board.move_stack

        move_number = len(current_moves) // 2
        for i in range(len(current_moves), len(all_moves_uci)):
            self.board.push_uci(all_moves_uci[i])

        last_move_white = await self.get_last_move_with_color(True)
        last_move_black = await self.get_last_move_with_color(False)
        if not last_move_white or not last_move_black:
            move_number = 1
            is_last_move_white = True if last_move_white else False
        else:
            move_number = max(last_move_white.move_number, last_move_black.move_number)
            is_last_move_white = True if last_move_white.move_number > last_move_black.move_number else False
        game_has_ended = False
        is_white_won = None
        is_draw = False
        change_elo_white = None
        change_elo_black = None
        new_white_rating = None
        new_black_rating = None

        game_outcome = self.board.outcome()

        # FUTURE: implement tracking the reason of game ending to provide more info on client side
        draw_reason = None
        win_reason = None
        if not game_outcome:
            logger.info("Game is still going on")
        else:
            game_has_ended = True
            result = 0.5
            if game_outcome.winner:
                is_white_won = True
                result = 1
            elif not game_outcome.winner:
                is_white_won = False
                result = 0

            if result == 0.5:
                is_draw = True
            change_elo_white = change_elo(self.player_white_rating.rating, self.player_black_rating.rating, result)
            change_elo_black = -change_elo_white
            end_game_data = {
                "is_draw": is_draw,
                "draw_reason": draw_reason,
                "is_white_won": is_white_won,
                "win_reason": win_reason,
                "white_rating_change": change_elo_white,
                "black_rating_change": change_elo_black,
            }
            if self.current_game.is_active:
                await self.update_game_result(False, is_draw, is_white_won)
                await self.update_player_rating(self.player_white, self.game_type,
                                                change_elo_white)

                await self.update_player_rating(self.player_black, self.game_type,
                                                change_elo_black)

                await self.send_end_game_info(end_game_data)
            else:
                print("HERE")
                await self.game_end(end_game_data)

        time_white_left = self.game_search_settings.full_time
        time_black_left = self.game_search_settings.full_time
        if last_move_white and last_move_black:
            if move_number > 1:
                time_black_left = last_move_black.time_on_clock
                time_white_left = last_move_white.time_on_clock

        last_move_datetime = None
        if is_last_move_white:
            if last_move_white:
                logger.info(f"last move white update time == {last_move_white.last_update}")
                logger.info(f"last move white update time == {last_move_white.last_update.timestamp() * 1000}")
                last_move_datetime = int(last_move_white.last_update.timestamp() * 1000)
        else:
            if last_move_black:
                logger.info(f"last move black update time == {last_move_black.last_update}")
                logger.info(f"last move black update time == {last_move_black.last_update.timestamp() * 1000}")
                last_move_datetime = int(last_move_black.last_update.timestamp() * 1000)

        logger.info(f"last move was white == {is_last_move_white}")
        logger.info(f"last move datetime == {last_move_datetime}")

        # 4. send json with all this info and change position on client side
        update_position_data = {
            "type": "update_position",
            "all_moves": all_moves_uci,
            "block_white": self.block_white,
            "block_black": self.block_black,
            "full_time_seconds": self.game_search_settings.full_time,
            "additional_time_seconds": self.game_search_settings.time_per_move,
            "is_last_move_white": is_last_move_white,
            "time_white_left": time_white_left,
            "time_black_left": time_black_left,
            "last_move_datetime": last_move_datetime,
            "game_has_ended": game_has_ended,
            "white_rating_change": change_elo_white,
            "black_rating_change": change_elo_black,
        }
        return update_position_data

    async def update_position_client(self):
        update_position_data = await self.update_position_from_db()
        await self.send(text_data=json.dumps(update_position_data))

    async def update_position_room(self):
        update_position_data = await self.update_position_from_db()
        update_position_data["type"] = "online_game_room_update_position"
        await self.channel_layer.group_send(
            self.room_group_name, update_position_data
        )

    async def send_end_game_info(self, end_game_data):
        end_game_data["type"] = "game_end"

        await self.channel_layer.group_send(
            self.room_group_name, end_game_data
        )

    async def game_end(self, end_game_data):
        end_game_data["type"] = "game_end"
        new_white_rating_obj = await self.get_player_rating(self.player_white, self.game_type)
        new_black_rating_obj = await self.get_player_rating(self.player_black, self.game_type)
        new_white_rating = new_white_rating_obj.rating
        new_black_rating = new_black_rating_obj.rating
        print(f"NEW RATING WHITE: {new_white_rating}")
        end_game_data["new_white_rating"] = new_white_rating
        end_game_data["new_black_rating"] = new_black_rating
        # Send message to WebSocket
        await self.send(text_data=json.dumps(end_game_data))

    async def online_game_room_update_position(self, text_data):
        message_type = text_data["type"]
        await self.update_position_client()

    async def flip_board_if_black(self):
        flip_board = False
        if self.chess_user.id == self.current_game.chess_user_black_id:
            flip_board = True
        flip_board_data = {
            "type": "flip_board_check",
            "flip_board": flip_board
        }
        await self.send(text_data=json.dumps(flip_board_data))

    @database_sync_to_async
    def get_current_game(self):
        return Game.objects.get(id=self.game_id)

    @database_sync_to_async
    def get_game_search_settings(self):
        return self.current_game.game_search_settings

    @database_sync_to_async
    def get_white_player(self):
        return ChessUser.objects.get(id=self.current_game.chess_user_white_id)

    @database_sync_to_async
    def get_black_player(self):
        return ChessUser.objects.get(id=self.current_game.chess_user_black_id)

    @database_sync_to_async
    def get_chess_player(self, user):
        return ChessUser.objects.get(user=user)

    @database_sync_to_async
    def get_all_moves_of_game(self, game):
        return list(MoveUCI.objects.filter(game=game).order_by("move_number", "-is_white"))

    @database_sync_to_async
    def create_new_move(self, move_number, is_white, uci, time_on_clock, current_time):
        new_move = MoveUCI(game=self.current_game, move_number=move_number, is_white=is_white, uci=uci,
                           time_on_clock=time_on_clock, last_update=current_time)
        new_move.save()
        logger.info(f"New move was created: {new_move}")
        return new_move

    @database_sync_to_async
    def get_game_type(self):
        return self.current_game.game_search_settings.game_type

    @database_sync_to_async
    def get_player_rating(self, chess_user, game_type):
        return Rating.objects.get(chess_user=chess_user, game_type=game_type)

    @database_sync_to_async
    def update_player_rating(self, player, game_type, change_points):
        r = Rating.objects.get(chess_user=player, game_type=game_type)
        r.rating = r.rating + change_points
        r.save()
        return r

    @database_sync_to_async
    def get_player_rating(self, player, game_type):
        r = Rating.objects.get(chess_user=player, game_type=game_type)
        return r

    @database_sync_to_async
    def update_game_result(self, is_canceled, is_draw, is_white_won):
        self.current_game.is_active = False
        game_result = None
        if is_canceled:
            game_result = GameResult.objects.get(pk="Canceled")
        elif is_draw:
            game_result = GameResult.objects.get(pk="Draw")
        else:
            if is_white_won:
                game_result = GameResult.objects.get(pk="White won")
            else:
                game_result = GameResult.objects.get(pk="Black won")
        self.current_game.game_result = game_result
        self.current_game.save()

    @database_sync_to_async
    def get_last_move_with_color(self, is_white):
        moves = list(MoveUCI.objects.filter(game=self.current_game, is_white=is_white).order_by("-move_number"))
        return moves[0] if moves else None

    @database_sync_to_async
    def get_last_move_in_game(self):
        moves = list(MoveUCI.objects.filter(game=self.current_game).order_by("-last_update"))
        return moves[0] if moves else None


class SearchGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        user = self.scope["user"]
        if not user.id:
            logger.info("User not logged in -> no search game functionality is provided")
            return
        self.chess_user = await self.get_chess_player(user)
        await self.accept()

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        message_type = text_data_json["type"]

        match message_type:
            case "add_new_player_to_queue":
                await self.add_new_player_to_queue(text_data_json)
            case "cancel":
                await self.delete_player_from_queue(text_data_json)
            case "get_game_url_if_exists":
                await self.get_game_url_if_exists(text_data_json)
            case _:
                raise Exception(f"This message type ({message_type}) is not existing")

    async def add_new_player_to_queue(self, text_data_json):
        start_global_search.delay()
        add_player_to_search_queue.delay(self.chess_user.id, text_data_json["full_time"],
                                         text_data_json["additional_time"],
                                         1200)

    async def delete_player_from_queue(self, text_data_json):
        print("start deleting")
        delete_player_from_search_queue.delay(self.chess_user.id)

    async def get_game_url_if_exists(self, text_data_json):
        active_game = await self.get_active_game()
        redis = RedisClient()
        if active_game:
            await self.game_is_found(active_game.id)
            redis.redis_delete_from_pairs_both(self.chess_user.id)
        else:
            game = redis.redis_get_pair_info(self.chess_user.id)

            if not game:
                error_data = {
                    "type": "game_not_found"
                }
                await self.send(text_data=json.dumps(error_data))
                return
            rival = game.rival_playerinsearch
            redis.redis_delete_from_pairs_both(self.chess_user.id)
            game_settings = await self.get_game_settings(rival.full_time_timer, rival.additional_time_timer)
            rival_chess_user = await self.get_chess_player_by_id(rival.id)
            white_user, black_user = (self.chess_user, rival_chess_user) if game.is_white else (
                rival_chess_user, self.chess_user)
            new_game = await self.create_game(white_user, black_user, game_settings)
            await self.game_is_found(new_game.id)

    async def game_is_found(self, game_id):
        success_data = {
            "type": "game_has_found",
            "game_id": game_id
        }
        await self.send(text_data=json.dumps(success_data))

    async def disconnect(self, code):
        pass

    @database_sync_to_async
    def get_chess_player(self, user):
        return ChessUser.objects.get(user=user)

    @database_sync_to_async
    def get_chess_player_by_id(self, id):
        return ChessUser.objects.get(id=id)

    @database_sync_to_async
    def get_game_settings(self, full_time, additional_time):
        additional_time = 0 if not additional_time else additional_time
        return GameSearchSettings.objects.filter(full_time=full_time, time_per_move=additional_time).first()

    @database_sync_to_async
    def get_active_game(self):
        return Game.objects.filter(Q(chess_user_white=self.chess_user) | Q(chess_user_black=self.chess_user),
                                   is_active=True).first()

    @database_sync_to_async
    def create_game(self, white_user, black_user, game_settings):
        game_type = game_settings.game_type
        white_user_rating = Rating.objects.get(chess_user=white_user, game_type=game_type).rating
        black_user_rating = Rating.objects.get(chess_user=black_user, game_type=game_type).rating
        new_game = Game(chess_user_white=white_user, chess_user_black=black_user,
                        game_search_settings=game_settings, is_active=True, white_rating=white_user_rating,
                        black_rating=black_user_rating)
        new_game.save()
        return new_game
