from django.urls import path

from . import views

app_name = 'recommender'

urlpatterns = [
    path('', views.home, name='home'),
    path('discover/', views.discover, name='discover'),
    path('catalog/', views.catalog, name='catalog'),
    path('lab/', views.lab, name='lab'),
    path('insights/', views.insights, name='insights'),
    path('api/recommend/', views.api_recommend, name='api_recommend'),
    path('api/predict/', views.api_predict, name='api_predict'),
    path('api/movies/', views.api_movies, name='api_movies'),
    path('health/', views.health, name='health'),
]
