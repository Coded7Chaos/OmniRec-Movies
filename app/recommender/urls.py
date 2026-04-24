from django.urls import path
from . import views

app_name = 'recommender'

urlpatterns = [
    path('', views.home, name='home'),
    path('discover/', views.discover, name='discover'),
    path('catalog/', views.catalog, name='catalog'),
    path('lab/', views.lab, name='lab'),
    path('profile/', views.profile, name='profile'),
    
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    
    path('api/rate/', views.rate_movie, name='rate_movie'),
    path('api/movies/', views.api_movies, name='api_movies'),
]
