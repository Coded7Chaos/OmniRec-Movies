from django.db import models
from django.contrib.auth.models import User

class Movie(models.Model):
    """
    Catalog of movies filtered from MovieLens (those with >= 20 ratings in the sample).
    """
    movie_id = models.IntegerField(unique=True, primary_key=True)
    title = models.CharField(max_length=500)
    genres = models.CharField(max_length=500, null=True, blank=True)
    
    def __str__(self):
        return self.title

class MovieRating(models.Model):
    """
    Ratings given by real users within the application.
    Used for real-time recommendations.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='ratings')
    rating = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'movie')

    def __str__(self):
        return f"{self.user.username} - {self.movie.title}: {self.rating}"
