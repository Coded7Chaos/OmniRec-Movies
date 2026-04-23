from django.apps import AppConfig
from django.conf import settings


class RecommenderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.recommender'
    label = 'recommender'
    verbose_name = 'OmniRec testbench'

    def ready(self):
        if getattr(settings, 'OMNIREC_EAGER_LOAD', False):
            from . import services
            services.registry.warmup()
