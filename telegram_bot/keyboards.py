"""
Custom keyboards for the Telegram bot
"""
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

def get_proficiency_keyboard():
    """Create keyboard for proficiency selection"""
    keyboard = [
        [
            InlineKeyboardButton("Beginner", callback_data="beginner"),
            InlineKeyboardButton("Intermediate", callback_data="intermediate"),
            InlineKeyboardButton("Advanced", callback_data="advanced"),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_cancel_keyboard():
    """Create keyboard with cancel button"""
    keyboard = [
        [InlineKeyboardButton("Cancel Learning Session", callback_data="cancel_session")]
    ]
    return InlineKeyboardMarkup(keyboard)