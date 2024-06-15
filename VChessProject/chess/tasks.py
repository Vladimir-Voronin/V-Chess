import collections
import json
import random
import time
from collections import deque

from VChessProject.celery import app
from celery import Task
from django.core.cache import cache
import redis

from . import config
from .maintain import PlayerInSearch, ChessGameMatching, json_chess_game_matching_load, json_player_in_search_load
from VChessProject import settings


class PlayerSearchTaskRedis(Task):
    def __init__(self):
        self._is_starting = False
        self.redis = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
        self.sleep_between_iterations = 5

    def redis_is_player_in_set(self, player_id):
        return self.redis.sismember(config.REDIS_PLAYER_IN_SEARCH_SET_NAME, player_id)

    def redis_get_and_delete_player_in_set(self, player_id):
        return self.redis.srem(config.REDIS_PLAYER_IN_SEARCH_SET_NAME, player_id)

    def redis_delete_player_in_set(self, player_id):
        self.redis.srem(config.REDIS_PLAYER_IN_SEARCH_SET_NAME, player_id)

    def redis_add_player_to_set(self, player_id):
        self.redis.sadd(config.REDIS_PLAYER_IN_SEARCH_SET_NAME, player_id)

    def redis_save_to_pairs(self, player_1_id, game_info):
        json_game_info = json.dumps(game_info)
        self.redis.hset(config.REDIS_GAME_PAIRS_NAME, player_1_id, json_game_info)

    def redis_delete_from_pairs_both(self, player_id):
        chess_game = self.redis_get_pair_info(player_id)
        if chess_game:
            rival = chess_game.rival_playerinsearch
            self.redis.hdel(config.REDIS_GAME_PAIRS_NAME, player_id)
            self.redis.hdel(config.REDIS_GAME_PAIRS_NAME, rival.id)
            self.add_player(rival.id, rival.full_time_timer, rival.additional_time_timer,
                            rival.additional_time_timer)  # return rival to queue

    def redis_get_pair_info(self, player_id):
        game_info = self.redis.hget(config.REDIS_GAME_PAIRS_NAME, player_id)
        if game_info:
            chess_game = json_chess_game_matching_load(game_info)
            return chess_game

    def redis_is_player_in_pairs(self, player_id):
        game_info = self.redis.hget(config.REDIS_GAME_PAIRS_NAME, player_id)
        return True if game_info else False

    def redis_add_to_queue(self, player):
        json_player = json.dumps(player)
        self.redis.rpush(config.REDIS_PLAYER_SEARCH_QUEUE_NAME, json_player)

    def redis_popleft_queue(self):
        data = self.redis.lpop(config.REDIS_PLAYER_SEARCH_QUEUE_NAME)
        player = json_player_in_search_load(data)
        return player

    def redis_get_queue_len(self):
        return self.redis.llen(config.REDIS_PLAYER_SEARCH_QUEUE_NAME)

    def redis_clear(self):
        self.redis.delete(config.REDIS_PLAYER_IN_SEARCH_SET_NAME)
        self.redis.delete(config.REDIS_GAME_PAIRS_NAME)
        self.redis.delete(config.REDIS_PLAYER_SEARCH_QUEUE_NAME)
        self.redis.delete('players_in_queue_set')
        print("Redis has been cleaned")

    def search_pares(self):
        if self._is_starting:
            return None
        self._is_starting = True
        time.sleep(1)
        i = 0
        while True:
            time.sleep(3)
            i += 1
            self.print_debug_info()
            if self.redis_get_queue_len() < 2:
                time.sleep(self.sleep_between_iterations)
                print("too few players")
                continue

            potential_player = self.redis_popleft_queue()
            if not self.redis_is_player_in_set(potential_player.id):
                continue
            rival = None
            for player_data in self.redis.lrange(config.REDIS_PLAYER_SEARCH_QUEUE_NAME, 0, -1):
                player = json_player_in_search_load(player_data)
                if not self.redis_is_player_in_set(player.id):
                    continue
                if self.is_good_rival(potential_player, player):
                    rival = player
                    break

            if not rival:
                self.redis_add_to_queue(potential_player)
                continue

            self.make_pair(potential_player, rival)

    def print_debug_info(self):
        print(f"all pairs = {self.redis.hgetall(config.REDIS_GAME_PAIRS_NAME)}")
        print(f"queue = {[player for player in self.redis.lrange(config.REDIS_PLAYER_SEARCH_QUEUE_NAME, 0, -1)]}")
        print(f"set = {self.redis.smembers(config.REDIS_PLAYER_IN_SEARCH_SET_NAME)}")

        # implement better algorithm [FUTURE]

    def is_good_rival(self, player_1, player_2):
        return True

    def make_pair(self, player_1, player_2):
        assert player_1.id != player_2.id
        self.redis_delete_player_in_set(player_1.id)
        self.redis_delete_player_in_set(player_2.id)
        player_1_is_white = True if random.randint(0, 1) else False
        game_info_1 = ChessGameMatching(player_2, not player_1_is_white)
        game_info_2 = ChessGameMatching(player_1, player_1_is_white)
        self.redis_save_to_pairs(player_1.id, game_info_1)
        self.redis_save_to_pairs(player_2.id, game_info_2)
        assert not self.redis_is_player_in_set(player_1.id)
        assert not self.redis_is_player_in_set(player_2.id)

    def add_player(self, player_id, full_time_timer, additional_time_timer, player_rating):
        self.print_debug_info()
        player = PlayerInSearch(player_id, full_time_timer, additional_time_timer, player_rating)
        print(f"ADDING player = {player_id}")
        if not self.redis_is_player_in_set(player.id) and not self.redis_is_player_in_pairs(player_id):
            self.redis_add_player_to_set(player_id)
            self.redis_add_to_queue(player)
            print(f"Player {player_id} was added")

    def delete_player(self, player_id):
        self.redis_delete_player_in_set(player_id)
        self.redis_delete_from_pairs_both(player_id)
        print(f"Player {player_id} was deleted")

    def game_is_found(self, player_id):
        result = self.redis_get_pair_info(player_id)
        return result


def clear_redis():
    a = PlayerSearchTaskRedis()
    a.redis_clear()


@app.task(base=PlayerSearchTaskRedis, bind=True)
def start_global_search(self):
    self.search_pares()


@app.task(base=PlayerSearchTaskRedis, bind=True)
def add_player_to_search_queue(self, player_id, full_time_timer, additional_time_timer, player_rating):
    self.add_player(player_id, full_time_timer, additional_time_timer, player_rating)


@app.task(base=PlayerSearchTaskRedis, bind=True)
def delete_player_from_search_queue(self, player_id):
    self.delete_player(player_id)


@app.task(base=PlayerSearchTaskRedis, bind=True)
def check_if_the_game_has_been_found(self, player_id):
    result = self.game_is_found(player_id)
    return result
