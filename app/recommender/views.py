from django.shortcuts import redirect
from django.contrib.auth import login as auth_login, logout as auth_logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from inertia import render as inertia_render
from .services import registry, MODEL_LABELS, MODEL_HINTS, COMMUNITY_PROFILES, CLUSTER_COLORS
from .models import Movie, MovieRating
import json

def _shell(request, active: str):
    return {
        'navigation': [
            {'href': '/', 'label': 'Inicio', 'key': 'home'},
            {'href': '/discover/', 'label': 'Descubrir', 'key': 'discover'},
            {'href': '/catalog/', 'label': 'Catálogo', 'key': 'catalog'},
            {'href': '/lab/', 'label': 'Laboratorio', 'key': 'lab'},
            {'href': '/profile/', 'label': 'Mi Perfil', 'key': 'profile'},
        ],
        'active': active,
        'auth': {
            'user': {
                'id': request.user.id,
                'username': request.user.username,
            } if request.user.is_authenticated else None
        }
    }

@ensure_csrf_cookie
def home(request):
    featured = registry.get_top_popular(n=12)
    user_ratings = []
    if request.user.is_authenticated:
        user_ratings = list(MovieRating.objects.filter(user=request.user).values('movie_id', 'rating'))

    return inertia_render(request, 'Home', props={
        **_shell(request, 'home'),
        'featured': featured,
        'userRatings': user_ratings, # <--- Enviamos los ratings a Inicio
        'stats': {
            'movies': 5915,
            'ratings': 1150000,
            'communities': 6
        }
    })

@login_required
def profile(request):
    user_profile = registry.get_user_profile(request.user)
    user_ratings = list(MovieRating.objects.filter(user=request.user)
                       .select_related('movie')
                       .order_by('-created_at')[:10]
                       .values('movie__title', 'rating', 'created_at'))
    
    # Preparamos la lista de todas las comunidades para el modal
    all_communities = [
        {**info, 'id': cid, 'color': CLUSTER_COLORS[cid % len(CLUSTER_COLORS)]} 
        for cid, info in COMMUNITY_PROFILES.items()
    ]
    
    return inertia_render(request, 'Profile', props={
        **_shell(request, 'profile'),
        'profile': user_profile,
        'recentRatings': user_ratings,
        'allCommunities': all_communities, # <--- Enviamos todas las comunidades
    })

@login_required
def discover(request):
    model_key = request.GET.get('model', 'svd')
    recommendations = registry.get_recommendations(request.user, model_key=model_key)
    user_ratings = list(MovieRating.objects.filter(user=request.user).values('movie_id', 'rating'))
    
    return inertia_render(request, 'Discover', props={
        **_shell(request, 'discover'),
        'recommendations': recommendations,
        'userRatings': user_ratings,
        'models': [{'key': k, 'label': v, 'hint': MODEL_HINTS.get(k, '')} for k, v in MODEL_LABELS.items()],
        'currentModel': model_key
    })

def catalog(request):
    movies = registry.get_top_popular(n=24)
    user_ratings = []
    if request.user.is_authenticated:
        user_ratings = list(MovieRating.objects.filter(user=request.user).values('movie_id', 'rating'))

    return inertia_render(request, 'Catalog', props={
        **_shell(request, 'catalog'),
        'featured': movies,
        'userRatings': user_ratings,
        'genres': registry.available_genres(), # <--- Enviamos los géneros reales
    })

@ensure_csrf_cookie
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = authenticate(username=data.get('username'), password=data.get('password'))
        if user:
            auth_login(request, user)
            return redirect('/')
        return JsonResponse({'error': 'Credenciales inválidas'}, status=400)
    if request.user.is_authenticated: return redirect('/')
    return inertia_render(request, 'Login', props=_shell(request, 'login'))

@ensure_csrf_cookie
def register_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username, password = data.get('username'), data.get('password')
        if not username or not password: return JsonResponse({'error': 'Datos incompletos'}, status=400)
        if User.objects.filter(username=username).exists(): return JsonResponse({'error': 'El usuario ya existe'}, status=400)
        user = User.objects.create_user(username=username, password=password)
        auth_login(request, user)
        registry.sync_catalog()
        return redirect('/')
    if request.user.is_authenticated: return redirect('/')
    return inertia_render(request, 'Register', props=_shell(request, 'register'))

def logout_view(request):
    auth_logout(request)
    return redirect('/')

@login_required
def rate_movie(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            movie = Movie.objects.get(movie_id=data.get('movie_id'))
            MovieRating.objects.update_or_create(user=request.user, movie=movie, defaults={'rating': float(data.get('rating'))})
            return JsonResponse({'status': 'ok'})
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

def api_movies(request):
    """Endpoint para búsqueda y filtrado dinámico."""
    query = request.GET.get('q', '')
    genre = request.GET.get('genre') # Este debe ser el nombre en inglés (raw)
    sort = request.GET.get('sort', 'score')
    limit = int(request.GET.get('limit', 18))
    
    hits = registry.movie_lookup(query=query, genre=genre, limit=limit, sort=sort)
    return JsonResponse({'hits': hits})

def lab(request):
    return inertia_render(request, 'Lab', props={**_shell(request, 'lab'), 'metrics': registry.metrics()})
