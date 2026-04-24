from django.core.management.base import BaseCommand
from recommender.services import registry

class Command(BaseCommand):
    help = 'Imports movies from movies_sample.parquet into the database'

    def handle(self, *args, **options):
        self.stdout.write('Sincronizando catálogo...')
        count = registry.sync_catalog()
        self.stdout.write(self.style.SUCCESS(f'Sincronización completada. Se crearon {count} películas.'))
