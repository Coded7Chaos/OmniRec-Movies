from django import forms

from .services import MODEL_LABELS, registry


INPUT_CLS = (
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm '
    'text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-600 '
    'focus:outline-none focus:ring-2 focus:ring-indigo-200'
)
SELECT_CLS = INPUT_CLS + ' appearance-none pr-8'


def _persona_choices() -> list[tuple[int, str]]:
    return [(p['userId'], p['label']) for p in registry.personas()]


class TopNForm(forms.Form):
    user_id = forms.TypedChoiceField(
        label='Persona',
        coerce=int,
        choices=[],
        widget=forms.Select(attrs={'class': SELECT_CLS}),
    )
    model_key = forms.ChoiceField(
        label='Algoritmo',
        choices=[(k, v) for k, v in MODEL_LABELS.items() if k != 'baseline']
                + [('baseline', MODEL_LABELS['baseline'])],
        initial='svd',
        widget=forms.Select(attrs={'class': SELECT_CLS}),
    )
    n = forms.IntegerField(
        label='Cuántas películas',
        min_value=1,
        max_value=50,
        initial=10,
        widget=forms.NumberInput(attrs={'class': INPUT_CLS}),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['user_id'].choices = _persona_choices()


class PredictForm(forms.Form):
    user_id = forms.TypedChoiceField(
        label='Persona',
        coerce=int,
        choices=[],
        widget=forms.Select(attrs={'class': SELECT_CLS}),
    )
    movie_id = forms.IntegerField(
        min_value=1,
        widget=forms.HiddenInput(),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['user_id'].choices = _persona_choices()
