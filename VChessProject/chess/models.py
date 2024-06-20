import random

from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class FideTitle(models.Model):
    short_name = models.CharField(max_length=50)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('short_name', 'name',)


class ChessUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    fide_title = models.ForeignKey(FideTitle, on_delete=models.DO_NOTHING, null=True)
    blitz_rating = models.FloatField(null=True)
    rapid_rating = models.FloatField(null=True)
    classic_rating = models.FloatField(null=True)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        ChessUser.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.chessuser.save()


class GameType(models.Model):
    name = models.CharField(max_length=40, primary_key=True)


class GameSearchSettings(models.Model):
    game_type = models.ForeignKey(GameType, on_delete=models.CASCADE)
    full_time = models.IntegerField(null=True)
    time_per_move = models.IntegerField(null=True)


class GameResult(models.Model):
    result = models.CharField(max_length=30, primary_key=True)


class Game(models.Model):
    chess_user_white = models.ForeignKey(ChessUser, on_delete=models.DO_NOTHING, related_name="chess_user_white")
    chess_user_black = models.ForeignKey(ChessUser, on_delete=models.DO_NOTHING, related_name="chess_user_black")
    game_result = models.ForeignKey(GameResult, on_delete=models.CASCADE, null=True)
    game_search_settings = models.ForeignKey(GameSearchSettings, on_delete=models.DO_NOTHING)
    is_active = models.BooleanField(default=False)
    white_rating = models.FloatField(null=True)
    black_rating = models.FloatField(null=True)
    start_time = models.DateTimeField(null=True, auto_now_add=True)
    end_time = models.DateTimeField(null=True)
    pgn_file = models.TextField(null=True)


class MoveUCI(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    move_number = models.IntegerField(null=False, blank=False)
    is_white = models.BooleanField(null=False, blank=False)
    uci = models.CharField(max_length=5)
