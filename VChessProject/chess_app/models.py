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


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        ChessUser.objects.create(user=instance)


@receiver(post_save, sender=ChessUser)
def save_user_profile(sender, instance, **kwargs):
    game_types = GameType.objects.all()
    for game_type in game_types:
        r = Rating(chess_user=instance, game_type=game_type, degree_of_confidence=100)
        r.save()


class GameType(models.Model):
    name = models.CharField(max_length=40, primary_key=True)


class Rating(models.Model):
    chess_user = models.ForeignKey(ChessUser, on_delete=models.CASCADE)
    game_type = models.ForeignKey(GameType, on_delete=models.CASCADE)
    rating = models.FloatField(default=1200, null=True)
    last_update = models.DateTimeField(null=True, auto_now=True)
    degree_of_confidence = models.FloatField(default=100, null=False)

    class Meta:
        unique_together = ('chess_user', 'game_type',)


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
    last_update = models.DateTimeField(null=True)
    time_on_clock = models.FloatField(null=True)
    is_white = models.BooleanField(null=False, blank=False)
    uci = models.CharField(max_length=5)

    def __str__(self):
        return f"MoveUCI move_number={self.move_number}, is_white={self.is_white}, uci={self.uci}, " \
               f"clock={self.time_on_clock}, update_time={self.last_update}"
