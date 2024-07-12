from django.urls import path, re_path
from . import views

urlpatterns = [
    path("", views.DefaultLayoutView.as_view(), name="home_page"),
    path("base", views.base_page, name="base_page"),
    path("signup", views.SignUpView.as_view(), name="sign_up"),
    path("login", views.LogInView.as_view(), name="log-in"),
    path("logout", views.logout_view, name="log-out"),
    path("board", views.BoardView.as_view(), name="board"),
    path("play", views.PlayView.as_view(), name="play"),
    path("live/<int:game_id>", views.OnlineGameView.as_view(), name="online_game"),
]

ajax_patterns = [
    path("ajax_start_search", views.ajax_start_search, name="ajax_start_search"),
    path("ajax_cancel_search", views.ajax_cancel_search, name="ajax_cancel_search"),
    path("ajax_return_new_html_test", views.ajax_return_new_html_test, name="ajax_return_new_html_test")
    # path("get_ajax", views.get_ajax, name="get_ajax")
]

urlpatterns.extend(ajax_patterns)
