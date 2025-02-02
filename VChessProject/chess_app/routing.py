from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/game/(?P<game_id>\w+)/$", consumers.OnlineGameConsumer.as_asgi()),
    re_path(r"ws/search_game/$", consumers.SearchGameConsumer.as_asgi()),
]
