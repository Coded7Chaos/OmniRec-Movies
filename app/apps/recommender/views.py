from __future__ import annotations

import time

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_http_methods

from .forms import PredictForm, TopNForm
from .services import MODEL_HINTS, MODEL_LABELS, registry


def _nav(active: str) -> dict:
    return {
        'active': active,
        'models': MODEL_LABELS,
        'model_hints': MODEL_HINTS,
    }


@require_GET
def home(request):
    metrics = registry.metrics()
    best_by_rmse = min(metrics, key=lambda r: r['RMSE']) if metrics else None
    best_by_ndcg = max(metrics, key=lambda r: r['NDCG@10']) if metrics else None

    n_users = len(registry.user_ids())
    n_movies = int(len(registry.movies()))
    n_ratings = int(len(registry.ratings()))
    n_personas = len(registry.personas())

    ctx = _nav('home') | {
        'metrics': metrics,
        'best_by_rmse': best_by_rmse,
        'best_by_ndcg': best_by_ndcg,
        'stats': {
            'users': n_users,
            'movies': n_movies,
            'ratings': n_ratings,
            'personas': n_personas,
        },
    }
    return render(request, 'recommender/home.html', ctx)


@require_GET
def recommend(request):
    form = TopNForm()
    ctx = _nav('recommend') | {'form': form}
    return render(request, 'recommender/recommend.html', ctx)


@require_http_methods(['GET', 'POST'])
def recommend_run(request):
    data = request.POST if request.method == 'POST' else request.GET
    form = TopNForm(data)
    if not form.is_valid():
        return render(request, 'recommender/partials/recommendations.html', {
            'error': 'Revisa las opciones seleccionadas.',
        })

    user_id = form.cleaned_data['user_id']
    model_key = form.cleaned_data['model_key']
    n = form.cleaned_data['n']

    persona = registry.persona(user_id)
    if persona is None:
        return render(
            request,
            'recommender/partials/recommendations.html',
            {'error': 'La persona seleccionada ya no está disponible.'},
        )

    started = time.perf_counter()
    try:
        recs = registry.top_n_for_user(user_id, model_key, n=n)
    except Exception as exc:
        return render(
            request,
            'recommender/partials/recommendations.html',
            {'error': f'{type(exc).__name__}: {exc}'},
        )
    elapsed_ms = (time.perf_counter() - started) * 1000

    ctx = {
        'recs': recs,
        'persona': persona,
        'model_label': MODEL_LABELS.get(model_key, model_key),
        'elapsed_ms': elapsed_ms,
        'n': n,
    }
    return render(request, 'recommender/partials/recommendations.html', ctx)


@require_GET
def predict(request):
    form = PredictForm()
    ctx = _nav('predict') | {'form': form}
    return render(request, 'recommender/predict.html', ctx)


@require_http_methods(['GET', 'POST'])
def predict_run(request):
    data = request.POST if request.method == 'POST' else request.GET
    form = PredictForm(data)
    if not form.is_valid():
        return render(request, 'recommender/partials/prediction_row.html', {
            'error': 'Selecciona una persona y una película antes de continuar.',
        })

    user_id = form.cleaned_data['user_id']
    movie_id = form.cleaned_data['movie_id']

    persona = registry.persona(user_id)
    movie = registry.movie_by_id(movie_id)
    if persona is None:
        return render(request, 'recommender/partials/prediction_row.html', {'error': 'Persona no disponible.'})
    if movie is None:
        return render(
            request,
            'recommender/partials/prediction_row.html',
            {'error': 'La película seleccionada no está en el catálogo (cold-start ≥ 20 votos).'},
        )

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
        elapsed_ms = (time.perf_counter() - started) * 1000
        rows.append({
            'key': key,
            'label': label,
            'hint': MODEL_HINTS.get(key, ''),
            'score': score,
            'elapsed_ms': elapsed_ms,
            'error': error,
        })

    best = max((r for r in rows if r['score'] is not None), key=lambda r: r['score'], default=None)
    if best is not None:
        best['is_best'] = True

    ctx = {
        'rows': rows,
        'persona': persona,
        'movie': movie,
    }
    return render(request, 'recommender/partials/prediction_row.html', ctx)


@require_GET
def search(request):
    ctx = _nav('search')
    return render(request, 'recommender/search.html', ctx)


@require_GET
def search_results(request):
    query = request.GET.get('q', '')
    hits = registry.movie_lookup(query, limit=15)
    return render(
        request,
        'recommender/partials/movie_hits.html',
        {'hits': hits, 'query': query},
    )


@require_GET
def movie_autocomplete(request):
    query = request.GET.get('q', '')
    hits = registry.movie_lookup(query, limit=8) if query.strip() else []
    return render(
        request,
        'recommender/partials/movie_picker_results.html',
        {'hits': hits, 'query': query},
    )


@require_GET
def clusters(request):
    summary = registry.cluster_summary()
    ctx = _nav('clusters') | {'clusters': summary}
    return render(request, 'recommender/clusters.html', ctx)


@require_GET
def health(request):
    try:
        n_models_loaded = len(registry._models)
        n_users = len(registry.user_ids())
        return JsonResponse({
            'status': 'ok',
            'models_loaded': n_models_loaded,
            'sample_users': n_users,
            'sample_movies': int(len(registry.movies())),
            'personas': len(registry.personas()),
        })
    except Exception as exc:
        return JsonResponse({'status': 'error', 'detail': f'{type(exc).__name__}: {exc}'}, status=500)
