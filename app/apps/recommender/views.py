"""
Vistas Inertia + endpoints JSON del sitio.

Estructura del sitio:
- `/`          → Home (landing con películas destacadas)
- `/discover/` → Recomendaciones personalizadas (el usuario elige un perfil)
- `/catalog/`  → Explorador con filtros por género y ordenamiento
- `/lab/`      → Laboratorio de modelos (testbench pulido con tabs)
- `/insights/` → Comunidades de gustos (clusters renombrados)
- `/health/`   → JSON para probes

Acciones dinámicas (Top-N, predicción, búsqueda): endpoints JSON
`/api/*` consumidos desde React con fetch.
"""

from __future__ import annotations

import json
import time

from django.http import HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from inertia import render as inertia_render

from .services import MODEL_HINTS, MODEL_LABELS, registry


# ---------- helpers ----------

NAV_ITEMS = [
    {'href': '/', 'label': 'Inicio', 'key': 'home'},
    {'href': '/discover/', 'label': 'Descubrir', 'key': 'discover'},
    {'href': '/catalog/', 'label': 'Catálogo', 'key': 'catalog'},
    {'href': '/lab/', 'label': 'Laboratorio', 'key': 'lab'},
    {'href': '/insights/', 'label': 'Comunidades', 'key': 'insights'},
]


def _model_options() -> list[dict]:
    return [
        {'key': key, 'label': MODEL_LABELS[key], 'hint': MODEL_HINTS.get(key, '')}
        for key in MODEL_LABELS
    ]


def _shell(active: str) -> dict:
    return {'navigation': NAV_ITEMS, 'active': active}


def _parse_body(request):
    if request.content_type and 'application/json' in request.content_type:
        try:
            return json.loads(request.body or b'{}')
        except json.JSONDecodeError:
            return None
    return request.POST.dict()


# ---------- páginas ----------

@require_GET
def home(request):
    metrics = registry.metrics()
    best_by_rmse = min(metrics, key=lambda r: r['RMSE']) if metrics else None
    best_by_ndcg = max(metrics, key=lambda r: r['NDCG@10']) if metrics else None

    communities = registry.communities()
    featured = registry.top_movies(limit=12)

    stats = {
        'movies': int(len(registry.movies())),
        'ratings': int(len(registry.ratings())),
        'personas': len(registry.personas()),
        'communities': len(communities),
    }

    return inertia_render(request, 'Home', props={
        **_shell('home'),
        'featured': featured,
        'stats': stats,
        'communities': communities[:3],
        'bestByRmse': best_by_rmse,
        'bestByNdcg': best_by_ndcg,
    })


@require_GET
def discover(request):
    return inertia_render(request, 'Discover', props={
        **_shell('discover'),
        'personas': registry.personas(),
        'models': _model_options(),
        'communities': registry.communities(),
        'genres': registry.available_genres(),
    })


@require_GET
def catalog(request):
    return inertia_render(request, 'Catalog', props={
        **_shell('catalog'),
        'genres': registry.available_genres(),
        'featured': registry.top_movies(limit=24),
    })


@require_GET
def lab(request):
    return inertia_render(request, 'Lab', props={
        **_shell('lab'),
        'personas': registry.personas(),
        'models': _model_options(),
        'communities': registry.communities(),
        'genres': registry.available_genres(),
        'metrics': registry.metrics(),
    })


@require_GET
def insights(request):
    return inertia_render(request, 'Insights', props={
        **_shell('insights'),
        'communities': registry.communities(),
        'metrics': registry.metrics(),
    })


# ---------- endpoints JSON ----------

@csrf_exempt
@require_POST
def api_recommend(request):
    payload = _parse_body(request)
    if payload is None:
        return HttpResponseBadRequest('Invalid JSON')

    try:
        user_id = int(payload.get('user_id'))
        model_key = str(payload.get('model_key') or 'svd')
        n = int(payload.get('n', 10))
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Parámetros inválidos.'}, status=400)

    if model_key not in MODEL_LABELS:
        return JsonResponse({'error': 'Modelo desconocido.'}, status=400)

    persona = registry.persona(user_id)
    if persona is None:
        return JsonResponse({'error': 'El perfil seleccionado ya no está disponible.'}, status=404)

    n = max(1, min(n, 30))
    started = time.perf_counter()
    try:
        recs = registry.top_n_for_user(user_id, model_key, n=n)
    except FileNotFoundError as exc:
        return JsonResponse({'error': f'Artefacto ausente: {exc.filename}'}, status=503)
    except Exception as exc:
        return JsonResponse({'error': f'{type(exc).__name__}: {exc}'}, status=500)
    elapsed_ms = (time.perf_counter() - started) * 1000

    return JsonResponse({
        'recs': recs,
        'persona': persona,
        'model_key': model_key,
        'model_label': MODEL_LABELS.get(model_key, model_key),
        'elapsed_ms': round(elapsed_ms, 1),
        'n': n,
    })


@csrf_exempt
@require_POST
def api_predict(request):
    payload = _parse_body(request)
    if payload is None:
        return HttpResponseBadRequest('Invalid JSON')

    try:
        user_id = int(payload.get('user_id'))
        movie_id = int(payload.get('movie_id'))
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Parámetros inválidos.'}, status=400)

    persona = registry.persona(user_id)
    if persona is None:
        return JsonResponse({'error': 'Perfil no disponible.'}, status=404)

    movie = registry.movie_by_id(movie_id)
    if movie is None:
        return JsonResponse({'error': 'La película no está en el catálogo (necesita ≥ 20 votos).'}, status=404)

    rows = []
    for key, label in MODEL_LABELS.items():
        started = time.perf_counter()
        try:
            score = registry.predict_rating(key, user_id, movie_id)
            error = None
        except FileNotFoundError as exc:
            score, error = None, f'Artefacto ausente: {exc.filename}'
        except Exception as exc:
            score, error = None, f'{type(exc).__name__}: {exc}'
        rows.append({
            'key': key,
            'label': label,
            'hint': MODEL_HINTS.get(key, ''),
            'score': round(score, 3) if score is not None else None,
            'elapsed_ms': round((time.perf_counter() - started) * 1000, 1),
            'error': error,
        })

    scored = [r for r in rows if r['score'] is not None]
    best_key = max(scored, key=lambda r: r['score'])['key'] if scored else None

    return JsonResponse({
        'persona': persona,
        'movie': movie,
        'rows': rows,
        'best_key': best_key,
    })


@require_GET
def api_movies(request):
    query = request.GET.get('q', '')
    genre = request.GET.get('genre') or None
    sort = request.GET.get('sort', 'score')
    try:
        limit = min(int(request.GET.get('limit', 18) or 18), 60)
    except ValueError:
        limit = 18
    hits = registry.movie_lookup(query, limit=limit, genre_es=genre, sort=sort)
    return JsonResponse({'query': query, 'hits': hits})


@require_GET
def health(request):
    try:
        return JsonResponse({
            'status': 'ok',
            'models_loaded': len(registry._models),
            'movies': int(len(registry.movies())),
            'personas': len(registry.personas()),
            'communities': len(registry.communities()),
        })
    except Exception as exc:
        return JsonResponse(
            {'status': 'error', 'detail': f'{type(exc).__name__}: {exc}'},
            status=500,
        )
