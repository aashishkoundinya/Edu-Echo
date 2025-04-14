from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('chat/', views.chat, name='chat'),
    path('api/chat/', views.chat_api, name='chat_api'),
    path('api/start_session/', views.start_session, name='start_session'),
    path('api/sessions/', views.get_sessions, name='get_sessions'),
    path('api/sessions/<str:session_id>/messages/', views.get_session_messages, name='get_session_messages'),
    path('chat/', views.chat, name='chat'),
    path('chats/', views.chats, name='chats'),
]