"""
Script to run the Telegram bot independently
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shikshagpt_project.settings')
django.setup()

# Import after Django setup
from telegram_bot.bot import run_bot

if __name__ == "__main__":
    run_bot()