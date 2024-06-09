import collections
import json

PlayerInSearch = collections.namedtuple("PlayerInSearch",
                                        ("id", "full_time_timer", "additional_time_timer", "player_rating"))

ChessGameMatching = collections.namedtuple("ChessGameMatching", ("rival_playerinsearch, is_white"))


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
