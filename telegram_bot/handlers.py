"""
Message handlers for the Telegram bot
"""
import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler
from .states import ConversationState
from .keyboards import get_proficiency_keyboard
from common.session_service import SessionService
from common.ai_service import AIService
from asgiref.sync import sync_to_async

load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Initialize AI service
api_key = os.getenv("HP_API_KEY")
ai_service = AIService(api_key=api_key)

# Create async wrappers for database operations
create_session_async = sync_to_async(SessionService.create_session)
get_session_async = sync_to_async(SessionService.get_session)
add_message_async = sync_to_async(SessionService.add_message)
get_session_messages_async = sync_to_async(SessionService.get_session_messages)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start the conversation when /start command is issued"""
    user = update.effective_user
    await update.message.reply_html(
        f"Hi {user.mention_html()}! I'm ShikshaGPT bot. 🤖\n\n"
        f"I'm here to help you learn by teaching me concepts!\n\n"
        f"Let's get started. What topic would you like to teach me about today?"
    )
    return ConversationState.TOPIC

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message when the command /help is issued"""
    await update.message.reply_text(
        "Here's how to use ShikshaGPT bot:\n\n"
        "1. Start a new session with /start\n"
        "2. Tell me the topic you want to teach\n"
        "3. Select your proficiency level\n"
        "4. Start explaining the concept to me\n"
        "5. I'll ask questions to help you reinforce your understanding\n\n"
        "You can end the conversation anytime with /cancel"
    )

async def topic_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the topic input from the user"""
    topic = update.message.text
    context.user_data['topic'] = topic
    
    await update.message.reply_text(
        f"Great! You want to teach me about '{topic}'.\n\n"
        f"How would you rate your knowledge on this topic?",
        reply_markup=get_proficiency_keyboard()
    )
    return ConversationState.PROFICIENCY

async def proficiency_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the proficiency selection"""
    query = update.callback_query
    await query.answer()
    
    proficiency = query.data
    context.user_data['proficiency'] = proficiency
    
    # Create a new session
    user_id = str(update.effective_user.id)
    session = await create_session_async(
        topic=context.user_data['topic'],
        proficiency=proficiency,
        platform="telegram",
        platform_user_id=user_id
    )
    
    # Store session ID
    context.user_data['session_id'] = session.session_id
    
    # Send welcome message
    await query.edit_message_text(
        f"Perfect! I'm ready to learn about {context.user_data['topic']} from you.\n\n"
        f"Please start explaining the concept to me, and I'll ask questions to help "
        f"reinforce your understanding. You can end the session anytime with /cancel."
    )
    
    # Send an initial prompt
    await query.message.reply_text(
        f"I'm excited to learn about {context.user_data['topic']}! What can you tell me about it?"
    )
    
    return ConversationState.LEARNING

async def learning_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the learning interaction"""
    user_message = update.message.text
    session_id = context.user_data.get('session_id')
    
    try:
        # Get the session (using async wrapper)
        session = await get_session_async(session_id=session_id)
        
        if not session:
            await update.message.reply_text(
                "I'm sorry, but I couldn't find your learning session. "
                "Let's start a new one with /start."
            )
            return ConversationState.TOPIC
        
        # Save user message (using async wrapper)
        await add_message_async(session, user_message, is_user=True)
        
        # Get conversation history (using async wrapper)
        messages = await get_session_messages_async(session)
        conversation_history = [
            {'is_user': msg.is_user, 'content': msg.content} 
            for msg in messages
        ]
        
        # Create session dict for AI service
        session_dict = {
            'topic': session.topic,
            'proficiency': session.proficiency
        }
        
        # Generate AI response - make sure this doesn't access the database
        prompt = ai_service.create_prompt(session_dict, user_message, conversation_history)
        ai_response = ai_service.generate_response(prompt, session.topic)
        
        # Save AI response (using async wrapper)
        await add_message_async(session, ai_response, is_user=False)
        
        # Send AI response
        await update.message.reply_text(ai_response)
        
        return ConversationState.LEARNING
    except Exception as e:
        # Log the full error
        logger.error(f"Error in learning_handler: {str(e)}", exc_info=True)
        await update.message.reply_text(
            "Sorry, something went wrong. Please try again later or restart with /start."
        )
        return ConversationState.TOPIC

async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel the conversation"""
    await update.message.reply_text(
        "Learning session ended. I hope it was helpful!\n\n"
        "You can start a new session anytime with /start."
    )
    return ConversationHandler.END

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "cancel_session":
        await query.edit_message_text(
            "Learning session ended. I hope it was helpful!\n\n"
            "You can start a new session anytime with /start."
        )
        return ConversationHandler.END
    
    return ConversationState.LEARNING

async def unknown_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle unknown commands"""
    await update.message.reply_text(
        "Sorry, I didn't understand that command. Try /help to see available commands."
    )

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors caused by updates"""
    logger.error(f"Update {update} caused error {context.error}")
    
    # Notify user of error
    if update and update.effective_message:
        await update.effective_message.reply_text(
            "Sorry, something went wrong. Please try again later or restart with /start."
        )