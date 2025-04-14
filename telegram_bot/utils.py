"""
Utility functions for the Telegram bot
"""
import re

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    return text

def format_message(text, max_length=4000):
    """Format a message to ensure it doesn't exceed Telegram's limits"""
    if len(text) <= max_length:
        return text
    
    # Split into chunks
    return text[:max_length-100] + "...\n\n(Message truncated due to length)"