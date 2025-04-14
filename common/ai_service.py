"""
Shared AI service used by both web and Telegram interfaces
"""
from huggingface_hub import InferenceClient

class AIService:
    def __init__(self, api_key):
        self.client = InferenceClient(
            provider="hf-inference",
            api_key=api_key,
        )
    
    def generate_response(self, prompt, topic, max_tokens=300, temperature=0.5, top_p=0.9, model="mistralai/Mistral-7B-Instruct-v0.3"):
        """Generate a response using Mistral AI with the same parameters as the original function"""
        try:
            completion = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p
            )
            
            response_text = completion.choices[0].message.content.strip()
            return response_text if response_text else "I'm trying to understand. Could you explain that again in a different way?"

        except Exception as e:
            print(f"Error generating AI response: {e}")
            return "I'm sorry, I'm having trouble connecting. Could you try again later."
    
    def create_prompt(self, session, message, conversation_history=None):
        """Create a prompt for the AI based on the session and message"""
        
        # Create context from conversation history
        context = f"Topic: {session['topic']}\n"
        context += f"User proficiency: {session['proficiency']}\n\n"
        
        # Add conversation history if available
        if conversation_history:
            for item in conversation_history:
                if item['is_user']:
                    context += f"Human teacher: {item['content']}\n"
                else:
                    context += f"AI student: {item['content']}\n"
        
        # Create the final prompt
        prompt = f'''
        You are an AI student learning from a human teacher about {session['topic']}.
        The human teacher has {session['proficiency']} knowledge about this topic.
        
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