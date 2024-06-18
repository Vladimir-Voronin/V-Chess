import importlib
import json
import logging
import sys
import importlib.util
from channels.generic.websocket import AsyncWebsocketConsumer
from .support_modules.json_func import json_exception
from .support_modules.maintain import import_non_local
from importlib.machinery import SourceFileLoader

chess_lib = SourceFileLoader("chess", r'D:\PyProjects\V-Chess\env\lib\site-packages\chess\__init__.py').load_module()
import chess.pgn

logger = logging.getLogger(__name__)


def game_imitation(board):
    board.push_san("e4")
    board.push_san("d5")
    board.push_san("exd5")
    board.push_san("e5")
    board.push_san("dxe6")
    board.push_san("a6")
    board.push_san("exf7")
    board.push_san("Ke7")
    board.push_san("fxg8=N")
    print(board)
    print(board.move_stack)


game_imitation(chess_lib.Board())


def get_all_moves_uci(board):
    return [move.uci() for move in board.move_stack]


class OnlineGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["game_id"]
        self.room_group_name = f"online_game_{self.room_name}"

        self.player_white_id = 1
        self.player_black_id = 2
        self.board = chess_lib.Board()
        game_imitation(self.board)
        all_moves = get_all_moves_uci(self.board)
        update_position_data = {
            "type": "update_position",
            "all_moves": all_moves
        }
        # 1. getting game from db
        # 2. getting id of player_white and player_black
        # 3. getting current_position
        # 4. send json with all this info and change position on client side

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

        await self.send(text_data=json.dumps(update_position_data))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json["type"]

        match message_type:
            case "new_move":
                await self.new_move(text_data_json)
            case _:
                raise Exception(f"This message type ({message_type}) is not existing")

        # # Send message to room group
        # await self.channel_layer.group_send(
        #     self.room_group_name, {"type": "chat.message", "message": message_type}
        # )

    # Receive message from room group
    async def move_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message}))

    async def new_move(self, json_data):
        player_made_move_id = int(json_data["player_id"])
        if player_made_move_id != self.player_white_id and player_made_move_id != self.player_black_id:
            await self.send(
                json_exception("id_not_matching", "Id of player that made a move is not matching game players id"))
            return

        move_notation_uci = json_data["move_notation_uci"]
        color = json_data['color_is_white']
        logger.info(color)
        self.board.push_uci(move_notation_uci)
        logger.info(move_notation_uci)
