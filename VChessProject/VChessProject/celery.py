import os
from celery import Celery
import warnings

warnings.filterwarnings("ignore", "No hostname was supplied")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VChessProject.settings')

app = Celery("VChessProject")
app.config_from_object('django.conf:settings', namespace="CELERY")
app.conf.broker_connection_retry_on_startup = True
app.autodiscover_tasks()
