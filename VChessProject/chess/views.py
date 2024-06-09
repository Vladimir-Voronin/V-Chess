import json
import time
from pathlib import Path

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views import View
from django.views.generic import TemplateView, FormView

from . import config
from .forms import SignUpForm, LoginForm
import logging

from .tasks import add_player_to_search_queue, delete_player_from_search_queue, start_global_search, \
    PlayerSearchTaskRedis

logger = logging.getLogger(__name__)


def base_page(request):
    return render(request, Path("chess/base/base.html"))


class DefaultLayoutView(TemplateView):
    template_name = "chess/default_layout.html"


class SignUpView(FormView):
    form_class = SignUpForm
    template_name = Path("chess/sign_up.html")

    def get_success_url(self):
        return reverse('chess:log-in')

    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        user = form.save()
        return super().form_valid(form)


class LogInView(FormView):
    form_class = LoginForm
    template_name = Path("chess/log_in.html")

    def get_success_url(self):
        logger.info("You successfully logged in")
        return reverse('chess:home_page')

    def form_valid(self, form):
        form.errors['check1'] = ['Check Error']
        user = authenticate(self.request, username=self.request.POST['username'],
                            password=self.request.POST['password'])
        if not user:
            form.errors['sender'] = ["Can't authenticate this user. Please, try again."]
            return render(self.request, Path('chess/log_in.html'), {'form': form})
        login(self.request, user)
        return super().form_valid(form)


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('chess:home_page'))


class BoardView(TemplateView):
    template_name = Path("chess/board.html")


def simulation():
    for i in range(2, 7):
        add_player_to_search_queue.delay(i, 180, None, 1200)


def clear_redis():
    a = PlayerSearchTaskRedis()
    a.redis_clear()


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
