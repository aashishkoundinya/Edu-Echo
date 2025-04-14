# EduEcho

## Overview

EduEcho is an educational web application designed to help students learn by teaching concepts to an AI student. It follows the powerful pedagogical principle that explaining concepts to others is one of the most effective ways to reinforce your own understanding.

## Team Members

Team Number - E28

- Aashish A Koundinya
- Bharadwaj Balaji
- Bhuvan G S
- Rahul Rajasekharan Menon

## Tech Stack

Last run on these versions

- Frontend
    - HTML5
    - CSS3
    - JavaScript (ES6+)

- Backend
    - Python (v3.11.3)
    - Django (v5.2)
    - SQLite 3

- AI Integration
    - Hugging face Inference API
    - Mistral-7B-Instruct-v0.3
    - Web Speech API (for voice-to-text)

- Telegram Bot
    - python-telegram-bot (v20.7)
    - python-dotenv (v1.0.0)

## Features

1. Multi-Platform Learning

    * Web Interface: A modern, responsive web application
    * Telegram Bot: Access the same functionality via Telegram for rural areas with limited connectivity

2. Interactive Teaching Sessions

    * Topic-Based Learning: Create sessions for any topic of interest
    * Proficiency Levels: Customize the experience based on your knowledge level (Beginner/Intermediate/Advanced)
    * Confidence Meter: Dynamic visual feedback of your understanding
    * Voice-to-Text: Explain concepts verbally without typing

3. Intelligent AI Student

    * Adaptive Questions: The AI asks relevant questions that challenge your understanding
    * Misconception Detection: If you explain something incorrectly, the AI will ask strategic questions to help you realize and correct your misunderstanding
    * Educational Dialogue: Conversational experience that builds deeper knowledge

4. Assessment Tools

    * Immediate Feedback: Get explanations for correct answers
    * Confidence Meter: Given answers affects your confidence score

5. Progress Tracking

    * Session History: Return to previous learning sessions
    * Message History: Review past conversations and explanations
    * Search Functionality: Find specific topics and conversations

## How it Works

1. Start a Learning Session:

    * Enter a topic you want to learn/teach
    * Select your proficiency level in that topic


2. Teach the AI Student:

    * Explain concepts in your own words (text or voice)
    * The AI will ask questions to:
        * Help reinforce correct knowledge
        * Gently identify misconceptions
        * Deepen your understanding

3. Assess Your Knowledge:

    * See your confidence score change based on your explanations and quiz performance


4. Review and Continue:

    * Return to previous sessions at any time
    * Pick up where you left off

## Run

1. Clone the repository:

    ```bash
    git clone https://github.com/AdvayaHackathon/114.Cypher

2. Setup Environment:

    ```bash
    python -m venv shikshagpt_env

    shikshagpt_env\Scripts\activate

    pip install -r requirements.txt

3. Configure Environement variables `.env file`:

    ```bash
    `HF_API_KEY=your_huggingface_api_key`
    `TELEGRAM_BOT_TOKEN=your_telegram_bot_token`

4. Setup Database:

    ```bash
    cd shikshagpt_project

    python manage.py makemigrations

    python manage.py migrate

5. Run Development Server:

    ```bash
    python manage.py runserver

    python bot_runner.py

6. Access the application: Open your browser and navigate to `http://127.0.0.1:8000/`

## Telegram Bot

1. Create a Bot using BotFather:

    * Open Telegram and search for "BotFather"
    * Send `/newbot` and follow instructions
    * Copy the provided token to your `.env file`

2. Run the Bot:

    ```bash
    python shikshagpt_project/bot_runner.py

3. Start chatting:

    * Open Telegram and search for your bot by username
    * Send `/start` to begin a learning session
