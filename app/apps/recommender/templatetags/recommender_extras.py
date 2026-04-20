from django import template

register = template.Library()


@register.filter(name='get')
def dict_get(mapping, key):
    """`{{ row|get:'P@10' }}` — access keys containing characters @, :, etc."""
    if mapping is None:
        return ''
    try:
        return mapping.get(key, '')
    except AttributeError:
        return ''


@register.filter
def star_rating(value):
    """Return a UTF-8 star bar for a rating in [0, 5]."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        return ''
    full = int(v)
    half = 1 if (v - full) >= 0.5 else 0
    return '★' * full + ('½' if half else '') + '☆' * (5 - full - half)
