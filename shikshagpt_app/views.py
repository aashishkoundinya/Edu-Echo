import json
import uuid
import requests
import re
from common.ai_service import AIService
from dotenv import load_dotenv
import os
from collections import Counter
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Session, Message
from huggingface_hub import InferenceClient
from django.utils.timezone import localtime
from django.conf import settings
from django.shortcuts import render, get_object_or_404

load_dotenv()

api_key = os.getenv("HF_API_KEY")
ai_service = AIService(api_key=api_key)

def index(request):
    # Serve the landing page
    return render(request, 'shikshagpt_app/index.html')

def chat(request):
    # Serve the chat page
    return render(request, 'shikshagpt_app/chat.html')

def chats(request):
    """View for the chat history page"""
    return render(request, 'shikshagpt_app/chats.html')

client = InferenceClient(
    provider="hf-inference",
    api_key="ENTER_API_KEY",
)

@csrf_exempt
def start_session(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            topic = data.get('topic')
            proficiency = data.get('proficiency')
            
            # Create a new session
            session_id = str(uuid.uuid4())
            session = Session.objects.create(
                session_id=session_id,
                topic=topic,
                proficiency=proficiency
            )
            
            # Return the session ID
            return JsonResponse({
                'session_id': session_id,
                'topic': topic,
                'proficiency': proficiency
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def chat_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            session_id = data.get('session_id')
            message = data.get('message')
            hf_token = data.get('hf_token')
            
            # Get the session
            try:
                session = Session.objects.get(session_id=session_id)
            except Session.DoesNotExist:
                return JsonResponse({'error': 'Session not found'}, status=404)
            
            # Save user message
            user_message = Message.objects.create(
                session=session,
                is_user=True,
                content=message
            )
            
            # Create the AI prompt based on the session and message
            prompt = create_ai_prompt(session, message)
            
            # Call Hugging Face API for AI response
            ai_response = get_ai_response(prompt, hf_token)
            
            # Calculate confidence score based on response
            confidence_score = calculate_confidence(ai_response, session.topic)
            
            # Save AI message
            ai_message = Message.objects.create(
                session=session,
                is_user=False,
                content=ai_response,
                confidence_score=confidence_score
            )
            
            return JsonResponse({
                'response': ai_response,
                'confidence_score': confidence_score
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def get_sessions(request):
    try:
        sessions = Session.objects.all().order_by('-created_at')
        seen_topics = set()
        unique_sessions = []

        for session in sessions:
            if session.topic.lower() not in seen_topics:
                unique_sessions.append(session)
                seen_topics.add(session.topic.lower())

        sessions_data = [
            {
                'id': s.session_id,
                'topic': s.topic,
                'proficiency': s.proficiency,
                'created_at': localtime(s.created_at).isoformat()
            }
            for s in unique_sessions
        ]

        return JsonResponse({'sessions': sessions_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_session_messages(request, session_id):
    """
    Retrieve all messages for a specific session.
    """
    try:
        session = Session.objects.get(session_id=session_id)
        messages = Message.objects.filter(session=session).order_by('timestamp')
        
        messages_data = []
        for msg in messages:
            messages_data.append({
                'content': msg.content,
                'is_user': msg.is_user,
                'confidence_score': msg.confidence_score,
                'timestamp': msg.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })
        
        return JsonResponse({
            'session': {
                'id': session.session_id,
                'topic': session.topic,
                'proficiency': session.proficiency
            },
            'messages': messages_data
        })
    except Session.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def create_ai_prompt(session, message):
    """
    Create a prompt for the AI based on the session and message.
    """
    # Get previous messages for context
    previous_messages = Message.objects.filter(session=session).order_by('timestamp')[:10]
    
    # Create a context string
    context = f"Topic: {session.topic}\n"
    context += f"User proficiency: {session.proficiency}\n\n"
    
    # Add previous messages
    for msg in previous_messages:
        if msg.is_user:
            context += f"Human teacher: {msg.content}\n"
        else:
            context += f"AI student: {msg.content}\n"
    
    # Create the final prompt
    prompt = f'''
    You are an AI student learning from a human teacher about {session.topic}.
    The human teacher has {session.proficiency} knowledge about this topic.
    
    Your goal is to learn from them while asking insightful questions that help them reinforce their knowledge.
    
    If they explain something correctly, ask follow-up questions that help them elaborate further.
    
    If they explain something incorrectly, don't correct them directly, but ask strategic questions
    that help them realize their misunderstanding. For example, if they say plants use oxygen instead
    of CO2 for photosynthesis, ask "That's interesting - if plants use oxygen, what do they release
    during photosynthesis?"
    
    Here's the conversation so far:
    {context}
    
    Human teacher: {message}
    
    AI student:
    '''
    
    return prompt

def get_ai_response(prompt, hf_token=None):
    """
    Get a response from the Hugging Face `InferenceClient` chat completion.
    """
    # Use the shared service but maintain the same behavior
    return ai_service.generate_response(
        prompt=prompt, 
        topic="",  # This parameter is mainly for the Telegram bot
        max_tokens=300,
        temperature=0.5,
        top_p=0.9,
        model="mistralai/Mistral-7B-Instruct-v0.3"
    )

def calculate_confidence(ai_response, topic):
    """
    Calculate a confidence score based on the AI response quality and engagement.
    This analyzes questions, insight, and topic relevance.
    """
    # Base confidence starts at 70%
    confidence = 70
    
    # Check question quality
    questions = re.findall(r'\?', ai_response)
    question_count = len(questions)
    
    # Simple question analysis (more sophisticated in production)
    deep_questions = 0
    for q in re.findall(r'[^.!?]*\?', ai_response):
        # Questions that encourage deeper thinking
        if any(term in q.lower() for term in ['why', 'how would', 'what if', 'explain', 'compare', 'analyze']):
            deep_questions += 1
    
    # Analyze if the AI is asking about misconceptions
    correction_indicators = ['interesting', 'curious', 'wonder', 'puzzled', 'confused', 
                            'consider', 'think about', 'reconcile', 'square with']
    correction_score = sum(1 for term in correction_indicators if term in ai_response.lower())
    
    # Check for topic relevance
    topic_words = [word.lower() for word in topic.split()]
    topic_word_count = sum(1 for word in topic_words if word in ai_response.lower())
    
    # Adjust confidence score
    confidence += min(deep_questions * 3, 12)  # Up to +12% for thoughtful questions
    confidence += min(question_count, 5)  # Up to +5% for asking questions
    confidence += min(correction_score * 2, 10)  # Up to +10% for gentle corrections
    confidence += min(topic_word_count * 2, 8)  # Up to +8% for staying on topic
    
    # Response length shows engagement (but not too much)
    if 100 <= len(ai_response) <= 400:
        confidence += 5
    elif len(ai_response) > 400:
        confidence += 2  # Too verbose might be less effective
    
    # Check if response is generic (adjust downward if so)
    generic_phrases = ['I understand', 'that\'s interesting', 'tell me more', 'I see', 'good point']
    generic_count = sum(1 for phrase in generic_phrases if phrase in ai_response.lower())
    if generic_count >= 3 and len(ai_response) < 150:
        confidence -= 10  # Generic responses reduce confidence
    
    # Cap confidence between 0-100%
    confidence = max(0, min(confidence, 100))
    
    return confidence