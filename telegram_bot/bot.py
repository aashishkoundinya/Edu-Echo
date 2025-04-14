"""
Main Telegram bot setup
"""
import os
import logging
from dotenv import load_dotenv
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ConversationHandler, CallbackQueryHandler
from .handlers import (
    start, help_command, unknown_command, error_handler,
    topic_handler, proficiency_handler, learning_handler,
    button_callback, cancel_command
)
from .states import ConversationState

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def setup_bot():
    """Setup and return the bot application"""
    # Get token from environment variable
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token:
        raise ValueError("No TELEGRAM_BOT_TOKEN found in environment variables")
    
    # Create application
    application = ApplicationBuilder().token(token).build()
    
    # Add conversation handler
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            ConversationState.TOPIC: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, topic_handler)
            ],
            ConversationState.PROFICIENCY: [
                CallbackQueryHandler(proficiency_handler)
            ],
            ConversationState.LEARNING: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, learning_handler),
                CommandHandler('cancel', cancel_command)
            ],
        },
        fallbacks=[CommandHandler('cancel', cancel_command)],
    )
    
    application.add_handler(conv_handler)
    
    # Add other handlers
    application.add_handler(CommandHandler('help', help_command))
    application.add_handler(MessageHandler(filters.COMMAND, unknown_command))
    
    # Register error handler
    application.add_error_handler(error_handler)
    
    return application

def run_bot():
    """Run the bot"""
    application = setup_bot()
    logger.info("Starting bot...")
    application.run_polling()