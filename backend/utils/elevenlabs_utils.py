"""
ElevenLabs integration for generating audio feedback based on classification results.
"""
import os
import base64
from dotenv import load_dotenv
from elevenlabs import generate, set_api_key

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# Voice configuration - directly set in code
# Available voices in your account: ['Clyde', 'Roger', 'Sarah', 'Laura', 'Charlie', 'George', 'Callum', 'River', 'Harry', 'Liam']
ELEVENLABS_VOICE = "Clyde"  # Set to your preferred voice name

if ELEVENLABS_API_KEY:
    set_api_key(ELEVENLABS_API_KEY)
else:
    print("Warning: ELEVENLABS_API_KEY not set. Audio generation will fail.")


def generate_feedback_message(label: str, confidence: float) -> str:
    """
    Generate context-aware text feedback message with variations and improvement suggestions.
    
    Args:
        label: Classification label ("High" or "Not High")
        confidence: Confidence score (0.0 to 1.0)
    
    Returns:
        Feedback message text with coaching tips
    """
    import random
    
    if label == "High":
        if confidence > 0.85:
            # Excellent performance - multiple variations
            messages = [
                "Outstanding shot! That's world class technique! Keep this up and you'll master it in no time.",
                "Brilliant execution! Your form is exceptional. Maintain this consistency for better results.",
                "Excellent shot! That's top-tier technique. Focus on repeating this motion for muscle memory.",
                "Perfect execution! Your timing and balance are spot on. Try to replicate this shot every time.",
                "Fantastic shot! World class form right there. Remember to keep your head still and follow through consistently."
            ]
            return random.choice(messages)
        
        elif confidence > 0.7:
            # Very good performance - multiple variations
            messages = [
                "Great shot! Very well executed. To improve further, focus on maintaining balance throughout the shot.",
                "Solid shot! Good technique there. Next time, try to keep your front foot steady and extend your arms more.",
                "Well done! That was a clean shot. Work on keeping your head position consistent for even better results.",
                "Nice shot! Your form is improving. Focus on transferring weight smoothly from back foot to front foot.",
                "Good execution! Keep it up. To enhance your shot, maintain a stable base and follow through completely."
            ]
            return random.choice(messages)
        
        elif confidence > 0.6:
            # Good performance - multiple variations with improvement tips
            messages = [
                "Good attempt! You're showing excellent form. Next time, work on timing your shot better and keep your eyes on the ball longer.",
                "Decent shot! Your technique is coming along. Try to keep your back straight and balance centered for more power.",
                "Not bad! There's potential here. Focus on keeping your front leg steady and transferring your weight forward smoothly.",
                "Good effort! You're getting the basics right. Improve by maintaining balance and following through with your swing.",
                "Nice try! Your form is developing. Next time, keep your head still and ensure a complete follow-through for better control."
            ]
            return random.choice(messages)
        
        else:
            # Lower confidence but still classified as High - encouragement with tips
            messages = [
                "Good attempt! You're on the right track. Focus on maintaining balance and keeping your front foot planted for better stability.",
                "Keep practicing! Your technique is improving. Try to keep your head still and extend your arms fully during the shot.",
                "Not bad! You're showing promise. Work on timing and ensure you're transferring your weight correctly from back to front.",
                "Good effort! With more practice, you'll improve. Focus on keeping your eyes on the ball and following through completely.",
                "You're getting there! Maintain a steady base and work on your follow-through to make this shot even better next time."
            ]
            return random.choice(messages)
    
    else:  # "Not High"
        if confidence > 0.6:
            # Close but not quite - specific improvement suggestions
            messages = [
                "Almost there! Your timing needs work. Try to keep your front foot steady and transfer weight more smoothly next time.",
                "Close one! Focus on balance and timing. Keep your head still and maintain a stable base throughout the shot.",
                "Good effort, but timing is off! Next time, work on keeping your eyes on the ball and ensuring a complete follow-through.",
                "Almost got it! Improve by keeping your front leg stable and transferring weight from back foot to front foot more effectively.",
                "Not quite! Your balance needs improvement. Focus on maintaining a steady base and keeping your head position consistent."
            ]
            return random.choice(messages)
        
        elif confidence > 0.4:
            # Needs work - detailed improvement suggestions
            messages = [
                "That was decent, but could be smoother. Focus on maintaining balance throughout the shot and keeping your front foot planted.",
                "Needs improvement. Work on your timing and ensure you're transferring weight correctly. Keep your head still and eyes on the ball.",
                "Room for improvement here. Try to maintain a stable base and follow through completely. Keep practicing your balance.",
                "Could be better! Focus on keeping your front leg steady and transferring weight smoothly. Work on your follow-through technique.",
                "Not quite there yet. Improve by maintaining balance, keeping your head position consistent, and ensuring a complete swing follow-through."
            ]
            return random.choice(messages)
        
        else:
            # Needs significant improvement - constructive feedback
            messages = [
                "Needs improvement. Focus on balance and follow through. Keep your front foot steady and transfer weight smoothly from back to front.",
                "Work on your technique. Maintain a stable base, keep your head still, and ensure you're following through completely with your shot.",
                "Practice makes perfect! Focus on keeping your balance centered, maintaining a steady front leg, and completing your follow-through.",
                "Keep practicing! Improve by maintaining balance throughout the shot, keeping your eyes on the ball, and ensuring a smooth weight transfer.",
                "Needs work. Focus on balance first, then work on keeping your front foot planted and transferring weight from back to front smoothly."
            ]
            return random.choice(messages)


def generate_audio(message: str, voice: str = None) -> str:
    """
    Generate audio from text using ElevenLabs TTS.
    
    Args:
        message: Text message to convert to speech
        voice: Voice name to use (defaults to ELEVENLABS_VOICE configured in code)
    
    Returns:
        Base64-encoded audio string
    
    Raises:
        Exception: If ElevenLabs API call fails
    """
    # Use provided voice, or use the configured voice from code
    voice_name = voice or ELEVENLABS_VOICE
    
    try:
        audio = generate(
            text=message,
            voice=voice_name,
            model="eleven_multilingual_v2"
        )
        
        # Convert audio bytes to base64
        audio_base64 = base64.b64encode(audio).decode('utf-8')
        
        return audio_base64
    
    except Exception as e:
        # Log error and re-raise for proper error handling in the endpoint
        print(f"ElevenLabs API error: {e}")
        raise Exception(f"Failed to generate audio: {str(e)}")

