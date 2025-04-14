"""
Conversation states for the Telegram bot
"""
from enum import Enum, auto

class ConversationState(Enum):
    """States for the conversation with the bot"""
    TOPIC = auto()
    PROFICIENCY = auto()
    LEARNING = auto()