from django.db import models

class Session(models.Model):
    session_id = models.CharField(max_length=100, unique=True)
    topic = models.CharField(max_length=255)
    proficiency = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    platform = models.CharField(max_length=20, default="web")  # "web" or "telegram"
    platform_user_id = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"{self.topic} ({self.session_id})"

class Message(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='messages')
    is_user = models.BooleanField(default=True)  # True if message is from user, False if from AI
    content = models.TextField()
    confidence_score = models.FloatField(null=True, blank=True)  # Only for AI messages
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{'User' if self.is_user else 'AI'} - {self.content[:50]}..."