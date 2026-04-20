from django.urls import path

from . import views

app_name = 'recommender'

urlpatterns = [
    path('', views.home, name='home'),
    path('recommend/', views.recommend, name='recommend'),
    path('recommend/run/', views.recommend_run, name='recommend_run'),
    path('predict/', views.predict, name='predict'),
    path('predict/run/', views.predict_run, name='predict_run'),
    path('catalog/', views.search, name='search'),
    path('catalog/results/', views.search_results, name='search_results'),
    path('movies/autocomplete/', views.movie_autocomplete, name='movie_autocomplete'),
    path('clusters/', views.clusters, name='clusters'),
    path('health/', views.health, name='health'),
]
