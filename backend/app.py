"""
FastAPI application for CricVision's multitask cricket shot analysis model.
"""
import asyncio
import os
import ssl
import tempfile
import base64
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

# Setup SSL context FIRST, before any imports that might trigger downloads
# This handles SSL certificate verification issues on macOS and other systems
#
# WARNING: This disables SSL verification - only use in development!
# For production, fix SSL certificates:
#   - macOS: Run 'Install Certificates.command' from Python folder
#   - Or: pip install --upgrade certifi
#   - Or: Set ENABLE_SSL_VERIFY=1 to enable SSL verification
#
# By default, we disable SSL verification for development to avoid certificate issues
if os.getenv("ENABLE_SSL_VERIFY", "0") != "1":
    # Development mode: disable SSL verification to avoid certificate issues
    ssl._create_default_https_context = ssl._create_unverified_context
    print("Note: SSL verification disabled for development (to enable, set ENABLE_SSL_VERIFY=1)")
else:
    print("SSL verification enabled (production mode)")

import numpy as np
import cv2
import keras
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables from .env file
load_dotenv()

from utils.video_utils import extract_frames
from utils.preprocessing import preprocess_frames, SEQUENCE_LENGTH
from utils.elevenlabs_utils import generate_feedback_message, generate_audio
from pydantic import BaseModel


# Initialize FastAPI app
app = FastAPI(
    title="Pitch-Perfect AI Backend",
    version="2.0"
)

# Configure CORS - allow frontend to access the API
# In production, replace "*" with your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins - adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and inference
model: Optional[keras.Model] = None
inference_function = None

SHOT_LABELS = ["drive", "sweep", "pullshot", "legglance_flick"]
FORM_THRESHOLD = 0.5


# Pydantic models for request/response validation
class AudioRequest(BaseModel):
    prediction: str
    confidence: float
    shot_type: Optional[str] = None
    shot_confidence: Optional[float] = None
    form_confidence: Optional[float] = None
    message: Optional[str] = None


class FrameRequest(BaseModel):
    frames: List[str]  # List of base64-encoded images


def _build_feedback_message(
    shot_label: str,
    form_label: str,
    form_confidence: float,
    shot_confidence: Optional[float] = None
) -> str:
    """
    Compose a player-facing feedback string using both predictions.
    """
    base_message = generate_feedback_message(form_label, form_confidence)
    shot_text = shot_label.replace("_", " ").title()
    if shot_confidence is not None:
        shot_percent = int(round(np.clip(shot_confidence, 0.0, 1.0) * 100))
        return f"{shot_text} ({shot_percent}% confidence) — {base_message}"
    return f"{shot_text} — {base_message}"


def _extract_outputs(
    raw_outputs: Any
) -> Tuple[str, float, str, float]:
    """
    Convert raw model outputs into human-friendly labels and confidences.
    """

    if isinstance(raw_outputs, dict):
        shot_probs = raw_outputs.get("shot_type")
        form_probs = raw_outputs.get("form_quality")
        if shot_probs is None or form_probs is None:
            raise ValueError("Model outputs must include 'shot_type' and 'form_quality'")
    elif isinstance(raw_outputs, (list, tuple)):
        if len(raw_outputs) != 2:
            raise ValueError("Expected two outputs from model: shot_type and form_quality")
        shot_probs, form_probs = raw_outputs
    else:
        raise ValueError("Unexpected model output type")

    shot_array = np.array(shot_probs)
    if shot_array.ndim == 2:
        shot_array = shot_array[0]
    if shot_array.shape[-1] != len(SHOT_LABELS):
        raise ValueError(
            f"Shot prediction expected {len(SHOT_LABELS)} classes, received shape {shot_array.shape}"
        )
    shot_index = int(np.argmax(shot_array))
    shot_label = SHOT_LABELS[shot_index]
    shot_confidence = float(np.clip(shot_array[shot_index], 0.0, 1.0))

    form_array = np.array(form_probs)
    if form_array.ndim > 2:
        form_array = np.squeeze(form_array, axis=tuple(range(form_array.ndim - 2)))
    if form_array.ndim == 2 and form_array.shape[-1] == 2:
        # Softmax for two classes -> take probability of "High"
        form_probability = float(form_array[0][1])
    elif form_array.ndim == 2 and form_array.shape[-1] == 1:
        form_probability = float(form_array[0][0])
    elif form_array.ndim == 1 and form_array.size == 2:
        form_probability = float(form_array[1])
    elif form_array.ndim == 1 and form_array.size == 1:
        form_probability = float(form_array[0])
    else:
        raise ValueError(f"Unexpected form output shape: {form_array.shape}")

    form_probability = float(np.clip(form_probability, 0.0, 1.0))
    form_label = "High" if form_probability >= FORM_THRESHOLD else "Not High"
    form_confidence = form_probability if form_label == "High" else 1.0 - form_probability

    return shot_label, shot_confidence, form_label, form_confidence


async def _run_inference(inputs: np.ndarray) -> Tuple[str, float, str, float]:
    """
    Execute the multitask model asynchronously and parse outputs.
    """
    if model is None:
        raise HTTPException(
            status_code=503, 
            detail="Model not loaded. The server started but the model failed to load. Please check the server startup logs for details. Common issues: model file missing, incompatible TensorFlow/Keras version, or corrupted model file."
        )

    loop = asyncio.get_running_loop()

    def _predict() -> Tuple[str, float, str, float]:
        # Keras 3 model inference
        outputs = model(inputs, training=False)

        # Convert to numpy if needed
        if isinstance(outputs, dict):
            outputs_np = {k: np.array(v) if hasattr(v, 'numpy') else v for k, v in outputs.items()}
        elif isinstance(outputs, (list, tuple)):
            outputs_np = [np.array(v) if hasattr(v, 'numpy') else v for v in outputs]
        else:
            outputs_np = np.array(outputs) if hasattr(outputs, 'numpy') else outputs

        return _extract_outputs(outputs_np)

    try:
        return await loop.run_in_executor(None, _predict)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference error: {exc}") from exc


def _build_response_payload(
    shot_label: str,
    shot_confidence: float,
    form_label: str,
    form_confidence: float,
) -> Dict[str, Any]:
    """
    Construct the API response with backward-compatible keys.
    """
    message = _build_feedback_message(shot_label, form_label, form_confidence, shot_confidence)
    return {
        "shot_type": shot_label,
        "shot_confidence": round(shot_confidence, 3),
        "form_quality": form_label,
        "form_confidence": round(form_confidence, 3),
        # Backward-compatible keys expected by current frontend
        "prediction": form_label,
        "confidence": round(form_confidence, 3),
        "message": message,
    }


@app.on_event("startup")
async def load_model():
    """
    Load the Keras multitask model on application startup.
    Allows server to start even if model loading fails (for debugging).
    """
    global model
    global inference_function

    app_dir = Path(__file__).parent
    models_dir = app_dir / "models"
    
    # Try multiple model file options
    model_candidates = [
        models_dir / "cricvision_v2_multitask_tf.keras",
        models_dir / "cricvision_v2_multitask.keras",
        models_dir / "cnn_bilstm_binary_classifier.keras",
    ]
    
    model_path = None
    for candidate in model_candidates:
        if candidate.exists():
            model_path = candidate
            break
    
    if model_path is None:
        print(f"WARNING: No model file found in {models_dir}")
        print("Server will start but /predict endpoints will return errors.")
        print("Please ensure a model file is placed in the models/ directory.")
        return

    try:
        print(f"Attempting to load model from {model_path}...")
        # Suppress verbose output during model loading
        import logging
        logging.getLogger("tensorflow").setLevel(logging.ERROR)
        
        # Load model with Keras 3
        model = keras.models.load_model(str(model_path), compile=False)
        
        print(f"✓ Model loaded successfully from {model_path}")
        
        # Keras 3 doesn't need inference function compilation
        print("✓ Model ready for inference")
            
    except Exception as e:
        print(f"ERROR: Failed to load model: {str(e)}")
        print("Server will start but /predict endpoints will return errors.")
        print("You may need to check:")
        print("  1. Model file format compatibility")
        print("  2. TensorFlow/Keras version compatibility")
        print("  3. Model file integrity")
        model = None
        inference_function = None


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        JSON response with status and model loading state
    """
    model_status = "loaded" if model is not None else "not_loaded"
    inference_status = "ready" if inference_function is not None else "not_ready"
    
    return {
        "status": "ok",
        "model": model_status,
        "inference": inference_status,
        "ready_for_predictions": model is not None
    }

@app.get("/model-status")
async def model_status():
    """
    Get detailed model loading status.
    
    Returns:
        JSON response with detailed model status information
    """
    app_dir = Path(__file__).parent
    models_dir = app_dir / "models"
    
    model_candidates = [
        "cricvision_v2_multitask_tf.keras",
        "cricvision_v2_multitask.keras",
        "cnn_bilstm_binary_classifier.keras",
    ]
    
    found_models = []
    for candidate in model_candidates:
        candidate_path = models_dir / candidate
        if candidate_path.exists():
            found_models.append({
                "name": candidate,
                "path": str(candidate_path),
                "exists": True,
                "size_mb": round(candidate_path.stat().st_size / (1024 * 1024), 2) if candidate_path.exists() else 0
            })
        else:
            found_models.append({
                "name": candidate,
                "path": str(candidate_path),
                "exists": False
            })
    
    return {
        "model_loaded": model is not None,
        "inference_ready": inference_function is not None,
        "models_directory": str(models_dir),
        "available_models": found_models,
        "message": "Model loaded and ready" if model is not None else "Model not loaded - check server startup logs"
    }


@app.post("/predict")
async def predict(video: UploadFile = File(...)):
    """
    Predict cricket shot type and form quality from an uploaded video clip.

    Example response payload mirrors /predict-live and includes both shots and form scores.
    """
    # Validate file format
    allowed_formats = [".mp4", ".avi", ".mov"]
    file_extension = Path(video.filename).suffix.lower()
    
    if file_extension not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed formats: {', '.join(allowed_formats)}"
        )
    
    # Create temporary file to save uploaded video
    temp_file = None
    temp_file_path = None
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await video.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Extract frames from video
        try:
            frames = extract_frames(temp_file_path, frame_count=SEQUENCE_LENGTH)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Video processing error: {str(e)}")

        # Preprocess frames for model
        preprocessed_frames = preprocess_frames(frames, sequence_length=SEQUENCE_LENGTH)

        # Run model inference
        shot_label, shot_confidence, form_label, form_confidence = await _run_inference(preprocessed_frames)

        response_payload = _build_response_payload(
            shot_label, shot_confidence, form_label, form_confidence
        )

        return JSONResponse(content=response_payload)
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        # Handle general exceptions
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print(f"Warning: Failed to delete temporary file: {e}")


@app.post("/generate-audio")
async def generate_audio_endpoint(request: AudioRequest):
    """
    Generate audio feedback from prediction and confidence.
    
    Args:
        request: AudioRequest with prediction and confidence
    
    Returns:
        JSON response with message and audio_base64
    """
    # Validate prediction label
    if request.prediction not in ["High", "Not High"]:
        raise HTTPException(
            status_code=400,
            detail="Prediction must be either 'High' or 'Not High'"
        )
    
    # Validate confidence range
    if not 0.0 <= request.confidence <= 1.0:
        raise HTTPException(
            status_code=400,
            detail="Confidence must be between 0.0 and 1.0"
        )

    shot_label = None
    if request.shot_type:
        candidate = request.shot_type.lower()
        if candidate not in SHOT_LABELS:
            raise HTTPException(
                status_code=400,
                detail=f"shot_type must be one of {SHOT_LABELS}"
            )
        shot_label = candidate

    shot_confidence = request.shot_confidence
    if shot_confidence is not None and not 0.0 <= shot_confidence <= 1.0:
        raise HTTPException(
            status_code=400,
            detail="shot_confidence must be between 0.0 and 1.0"
        )

    form_confidence = request.form_confidence
    if form_confidence is not None and not 0.0 <= form_confidence <= 1.0:
        raise HTTPException(
            status_code=400,
            detail="form_confidence must be between 0.0 and 1.0"
        )
    
    try:
        if request.message:
            message = request.message
        elif shot_label:
            message = _build_feedback_message(
                shot_label,
                request.prediction,
                form_confidence if form_confidence is not None else request.confidence,
                shot_confidence,
            )
        else:
            message = generate_feedback_message(request.prediction, request.confidence)
        
        # Generate audio
        audio_base64 = generate_audio(message)
        
        # Return response
        return JSONResponse(content={
            "message": message,
            "audio_base64": audio_base64
        })
    
    except Exception as e:
        # Handle ElevenLabs API errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate audio: {str(e)}"
        )


def decode_base64_image(image_base64: str) -> np.ndarray:
    """
    Decode a base64-encoded image to a numpy array.
    
    Args:
        image_base64: Base64-encoded image string (with or without data URL prefix)
    
    Returns:
        NumPy array of the image in RGB format (224x224x3)
    """
    try:
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_base64)
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image using OpenCV
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to 224x224
        img_resized = cv2.resize(img_rgb, (224, 224))
        
        return img_resized
    
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")


@app.post("/predict-live")
async def predict_live(request: FrameRequest):
    """
    Predict cricket shot type and form quality from live camera frames.

    Example request payload:
        {
            "frames": ["<base64-encoded-frame>", "..."]
        }

    Example response payload:
        {
            "shot_type": "drive",
            "shot_confidence": 0.82,
            "form_quality": "High",
            "form_confidence": 0.91,
            "prediction": "High",
            "confidence": 0.91,
            "message": "Drive — Great shot! Very well executed."
        }
    """
    # Validate that we have at least one frame
    if not request.frames:
        raise HTTPException(
            status_code=400,
            detail="At least one frame is required"
        )

    decoded_frames = []
    for index, frame_base64 in enumerate(request.frames):
        try:
            frame = decode_base64_image(frame_base64)
            decoded_frames.append(frame)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to decode frame {index + 1}: {exc}"
            ) from exc

    try:
        preprocessed_frames = preprocess_frames(decoded_frames, sequence_length=SEQUENCE_LENGTH)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Frame preprocessing error: {exc}"
        ) from exc

    shot_label, shot_confidence, form_label, form_confidence = await _run_inference(preprocessed_frames)
    response_payload = _build_response_payload(shot_label, shot_confidence, form_label, form_confidence)

    return JSONResponse(content=response_payload)

