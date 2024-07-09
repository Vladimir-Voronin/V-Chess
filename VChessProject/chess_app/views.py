import json
import logging

from pathlib import Path
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.urls import reverse, reverse_lazy
from django.views.generic import TemplateView, FormView

from .forms import SignUpForm, LoginForm
from .models import Game, Rating, ChessUser
from .tasks import add_player_to_search_queue, delete_player_from_search_queue, start_global_search

logger = logging.getLogger(__name__)


def base_page(request):
    return render(request, Path("chess_app/base/base.html"))


class DefaultLayoutView(TemplateView):
    template_name = "chess_app/default_layout.html"


class SignUpView(FormView):
    form_class = SignUpForm
    template_name = Path("chess_app/sign_up.html")

    def get_success_url(self):
        return reverse('chess_app:log-in')

    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        user = form.save()
        return super().form_valid(form)


class LogInView(FormView):
    form_class = LoginForm
    template_name = Path("chess_app/log_in.html")

    def get_success_url(self):
        logger.info("You successfully logged in")
        return reverse('chess_app:home_page')

    def form_valid(self, form):
        form.errors['check1'] = ['Check Error']
        user = authenticate(self.request, username=self.request.POST['username'],
                            password=self.request.POST['password'])
        if not user:
            form.errors['sender'] = ["Can't authenticate this user. Please, try again."]
            return render(self.request, Path('chess_app/log_in.html'), {'form': form})
        login(self.request, user)
        return super().form_valid(form)


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('chess_app:home_page'))


class BoardView(TemplateView):
    template_name = Path("chess_app/board.html")


def ajax_start_search(request):
    # clear_redis()
    logger.info("Start search")
    start_global_search.delay()
    data = json.loads(tuple(request.GET)[0])
    user = User.objects.get(username=request.user)
    r = add_player_to_search_queue.delay(user.id, data["full_time"], data["additional_time"], 1200)
    return JsonResponse({"How": "Long"})


def ajax_cancel_search(request):
    logger.info("Cancel search")
    user = User.objects.get(username=request.user)
    delete_player_from_search_queue.delay(user.id)
    return JsonResponse({"Cancel": "Search"})


def ajax_get_match_if_found(request):
    logger.info("Getting match")


def ajax_return_new_html_test(request):
    html = render_to_string("chess_app/online_game.html")
    return JsonResponse({"success": True, "new_right_container_html": html})


class OnlineGameView(LoginRequiredMixin, TemplateView):
    login_url = reverse_lazy('chess_app:log-in')
    template_name = "chess_app/online_game.html"

    def get(self, request, game_id):
        self.game = Game.objects.filter(id=game_id).first()
        if not self.game:
            return HttpResponseRedirect(self.login_url)
        return super().get(request, game_id)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({'full_time': self.game.game_search_settings.full_time,
                        'additional_time_per_move': self.game.game_search_settings.time_per_move})
        if self.game:
            game_type = self.game.game_search_settings.game_type.name
            player_white = self.game.chess_user_white
            player_black = self.game.chess_user_black
            rating_white_obj = Rating.objects.filter(chess_user=player_white, game_type=game_type)
            rating_black_obj = Rating.objects.filter(chess_user=player_black, game_type=game_type)
            rating_white = int(rating_white_obj[0].rating) if rating_white_obj else "-"
            rating_black = int(rating_black_obj[0].rating) if rating_black_obj else "-"

            context.update({
                "player_white_name": player_white.user.username,
                "player_black_name": player_black.user.username,
                "player_white_rating": rating_white,
                "player_black_rating": rating_black
            })
        return context


class PlayView(LoginRequiredMixin, TemplateView):
    login_url = reverse_lazy('chess_app:log-in')
    template_name = "chess_app/play_page.html"

    def get(self, request):
        print(f"YO: {request}")
        user = User.objects.get(username=request.user)
        chess_user = ChessUser.objects.get(user=user)
        active_game_list = Game.objects.filter(Q(chess_user_white=chess_user) | Q(chess_user_black=chess_user),
                                               is_active=True)
        if active_game_list:
            active_game = active_game_list[0]
            return HttpResponseRedirect(reverse('chess_app:online_game', kwargs={"game_id": active_game.pk}))
        return super().get(request)
