"""
Session management service shared between web and Telegram interfaces
"""
import uuid
from shikshagpt_app.models import Session, Message

class SessionService:
    @staticmethod
    def create_session(topic, proficiency, platform="web", platform_user_id=None):
        """Create a new learning session"""
        session_id = str(uuid.uuid4())
        session = Session.objects.create(
            session_id=session_id,
            topic=topic,
            proficiency=proficiency,
            platform=platform,
            platform_user_id=platform_user_id
        )
        return session
    
    @staticmethod
    def get_session(session_id=None, platform_user_id=None, platform="telegram"):
        """Get a session by ID or platform user ID"""
        if session_id:
            try:
                return Session.objects.get(session_id=session_id)
            except Session.DoesNotExist:
                return None
        
        if platform_user_id and platform:
            try:
                # Get the most recent session for this user on this platform
                return Session.objects.filter(
                    platform=platform, 
                    platform_user_id=platform_user_id
                ).order_by('-created_at').first()
            except Session.DoesNotExist:
                return None
        
        return None
    
    @staticmethod
    def add_message(session, content, is_user=True, confidence_score=None):
        """Add a message to a session"""
        message = Message.objects.create(
            session=session,
            is_user=is_user,
            content=content,
            confidence_score=confidence_score
        )
        return message

    @staticmethod
    def get_session_messages(session, limit=10):
        """Get recent messages for a session"""
        return list(Message.objects.filter(session=session).order_by('timestamp')[:limit])