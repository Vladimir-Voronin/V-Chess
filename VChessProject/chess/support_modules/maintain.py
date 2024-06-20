import collections
import json

from VChessProject import settings
from chess import config

PlayerInSearch = collections.namedtuple("PlayerInSearch",
                                        ("id", "full_time_timer", "additional_time_timer", "player_rating"))

ChessGameMatching = collections.namedtuple("ChessGameMatching", ("rival_playerinsearch, is_white"))

import redis


class Singleton(type):
    """
    An metaclass for singleton purpose. Every singleton class should inherit from this class by 'metaclass=Singleton'.
    """
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class RedisClient(metaclass=Singleton):

    def __init__(self):
        self.pool = redis.ConnectionPool(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

    @property
    def conn(self):
        if not hasattr(self, '_conn'):
            self.getConnection()
        return self._conn

    def getConnection(self):
        self._conn = redis.Redis(connection_pool=self.pool)

    def redis_delete_from_pairs_both(self, player_id):
        chess_game = self.redis_get_pair_info(player_id)
        if chess_game:
            rival = chess_game.rival_playerinsearch
            self.conn.hdel(config.REDIS_GAME_PAIRS_NAME, player_id)
            self.conn.hdel(config.REDIS_GAME_PAIRS_NAME, rival.id)

    def redis_get_pair_info(self, player_id):
        game_info = self.conn.hget(config.REDIS_GAME_PAIRS_NAME, player_id)
        if game_info:
            chess_game = json_chess_game_matching_load(game_info)
            return chess_game


def json_chess_game_matching_load(byte_string_object):
    json_info = json.loads(byte_string_object)
    rival = PlayerInSearch(json_info[0][0], json_info[0][1], json_info[0][2], json_info[0][3])
    print(json_info[1])
    print(type(json_info[1]))
    chess_game = ChessGameMatching(rival, json_info[1])
    return chess_game


def json_player_in_search_load(byte_string_object):
    json_info = json.loads(byte_string_object)
    print(json_info)
    return PlayerInSearch(json_info[0], json_info[1], json_info[2], json_info[3])


def import_non_local(name, custom_name=None):
    import importlib, sys
    print(sys.path)
    module = importlib.import_module(name, sys.path[-1])
    print(module)
    return module
