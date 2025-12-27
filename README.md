# Pitch-Perfect: AI-Powered Cricket Shot Analysis

A full-stack application for real-time cricket shot classification and form quality assessment using deep learning. The system analyzes cricket batting videos to detect shot types and evaluate form quality with confidence scoring.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Model Information](#model-information)
- [Development](#development)
- [Contributing](#contributing)

## Overview

Pitch-Perfect is a computer vision application that leverages a multitask deep learning model to analyze cricket batting videos. The system provides:

- **Shot Type Classification**: Identifies cricket shots (drive, sweep, pullshot, legglance_flick)
- **Form Quality Assessment**: Evaluates batting form as High or Not High
- **Confidence Scoring**: Provides confidence metrics for both shot type and form quality predictions
- **Real-time Analysis**: Supports both live camera feed and video file upload

### Key Features

- Multitask neural network architecture combining CNN and BiLSTM layers
- EfficientNet-B0 backbone for feature extraction
- Time-distributed processing for temporal sequence analysis
- RESTful API with FastAPI backend
- Modern React frontend with TypeScript
- Responsive web interface with real-time visualization

## Architecture

The application follows a client-server architecture with clear separation of concerns:

```
┌─────────────────┐         HTTP/REST         ┌─────────────────┐
│                 │ ────────────────────────> │                 │
│  React Frontend │                            │  FastAPI Backend│
│  (TypeScript)   │ <──────────────────────── │  (Python 3.12)  │
│                 │         JSON Response      │                 │
└─────────────────┘                            └─────────────────┘
                                                         │
                                                         │ Model Inference
                                                         ▼
                                                ┌─────────────────┐
                                                │  Keras Model    │
                                                │  (TensorFlow)   │
                                                └─────────────────┘
```

### Backend Architecture

- **API Layer**: FastAPI application handling HTTP requests
- **Processing Layer**: Video frame extraction and preprocessing utilities
- **Model Layer**: Keras 3.10 model with TensorFlow 2.19 backend
- **Inference Layer**: Asynchronous model inference with proper resource management

### Frontend Architecture

- **Component-Based**: React functional components with TypeScript
- **State Management**: React hooks for local state management
- **Routing**: React Router for navigation
- **Visualization**: Recharts for data visualization
- **Styling**: Tailwind CSS for responsive design

## Technology Stack

### Backend

- **Python**: 3.12
- **Framework**: FastAPI 0.121.1
- **ASGI Server**: Uvicorn 0.38.0
- **Deep Learning**: TensorFlow 2.19.0, Keras 3.10.0
- **Computer Vision**: OpenCV 4.12.0.88
- **Numerical Computing**: NumPy 2.0.2
- **Data Validation**: Pydantic 2.12.0+

### Frontend

- **Runtime**: Node.js (LTS recommended)
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 4.5.0
- **Styling**: Tailwind CSS 3.3.6
- **Visualization**: Recharts 3.4.1
- **Routing**: React Router DOM 6.30.1

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows
- **Python**: 3.12 or higher
- **Node.js**: 18.x or higher (LTS recommended)
- **npm**: 9.x or higher
- **Memory**: Minimum 8GB RAM (16GB recommended for model inference)
- **Storage**: At least 5GB free space for dependencies and models

### Model Files

The application requires trained model files in the `backend/models/` directory:

- `cricvision_v2_multitask_tf.keras` (primary model, ~29MB)
- `cricvision_v2_multitask.keras` (alternative model, ~85MB)
- `cnn_bilstm_binary_classifier.keras` (fallback model, ~19MB)

**Note**: Model files are not included in the repository. Ensure model files are placed in the `backend/models/` directory before running the application.

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3.12 -m venv venv
```

3. Activate the virtual environment:

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# SSL Configuration (for production)
ENABLE_SSL_VERIFY=0

# ElevenLabs API (optional, for audio generation)
ELEVENLABS_API_KEY=your_api_key_here
```

### Frontend Configuration

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000
```

## Running the Application

### Development Mode

1. **Start the backend server:**

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app:app --reload --port 8000 --host 0.0.0.0
```

The backend API will be available at `http://localhost:8000`

2. **Start the frontend development server:**

```bash
cd frontend
npm run dev
```

The frontend application will be available at `http://localhost:5173` (or the port shown in the terminal)

### Production Build

1. **Build the frontend:**

```bash
cd frontend
npm run build
```

2. **Serve the production build:**

The built files will be in `frontend/dist/`. Serve these files using a web server like Nginx or Apache, or use Vite's preview:

```bash
npm run preview
```

## API Documentation

### Endpoints

#### Health Check
```
GET /health
```
Returns server health status and model loading state.

**Response:**
```json
{
  "status": "ok",
  "model": "loaded",
  "inference": "ready",
  "ready_for_predictions": true
}
```

#### Model Status
```
GET /model-status
```
Returns detailed model loading status and available model files.

**Response:**
```json
{
  "model_loaded": true,
  "inference_ready": true,
  "models_directory": "/path/to/models",
  "available_models": [...],
  "message": "Model loaded and ready"
}
```

#### Video Prediction
```
POST /predict
Content-Type: multipart/form-data
```
Upload a video file for analysis.

**Request:**
- `video`: Video file (MP4, AVI, or MOV format)

**Response:**
```json
{
  "shot_type": "drive",
  "shot_confidence": 0.85,
  "form_quality": "High",
  "form_confidence": 0.92,
  "prediction": "High",
  "confidence": 0.92,
  "message": "Drive (85% confidence) — Great shot! Very well executed."
}
```

#### Live Frame Prediction
```
POST /predict-live
Content-Type: application/json
```
Analyze frames from live camera feed.

**Request:**
```json
{
  "frames": ["base64_encoded_frame_1", "base64_encoded_frame_2", ...]
}
```

**Response:** Same format as `/predict` endpoint.

### Interactive API Documentation

When the backend server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
CricVision/
├── backend/
│   ├── app.py                 # FastAPI application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── models/                # Trained model files (not in repo)
│   │   ├── cricvision_v2_multitask_tf.keras
│   │   └── ...
│   └── utils/
│       ├── preprocessing.py   # Frame preprocessing utilities
│       ├── video_utils.py    # Video frame extraction
│       └── elevenlabs_utils.py # Audio generation utilities
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ActionDisplay.tsx
│   │   │   ├── VideoAnalysisCharts.tsx
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── ApplicationPage.tsx
│   │   │   └── VideoUploadPage.tsx
│   │   ├── services/          # API service layer
│   │   │   ├── api.ts
│   │   │   └── poseDetection.ts
│   │   ├── config/           # Configuration constants
│   │   └── types/            # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                  # This file
```

## Model Information

### Architecture

The model uses a multitask learning architecture:

1. **Backbone**: EfficientNet-B0 for spatial feature extraction
2. **Temporal Processing**: TimeDistributed wrapper for frame sequence processing
3. **Sequence Modeling**: Bidirectional LSTM (BiLSTM) with 256 units
4. **Task Heads**:
   - Shot Type Classification: 4-class softmax (drive, sweep, pullshot, legglance_flick)
   - Form Quality Assessment: Binary sigmoid (High/Not High)

### Input Specifications

- **Frame Resolution**: 224x224 pixels
- **Sequence Length**: 8 frames
- **Color Channels**: RGB (3 channels)
- **Normalization**: Pixel values normalized to [0, 1]

### Output Format

- **Shot Type**: Probability distribution over 4 classes
- **Form Quality**: Single probability value (0 = Not High, 1 = High)
- **Confidence Threshold**: 0.5 for form quality classification

### Camera Angle Requirement

**Important**: The model is trained on side-view footage (90 degrees perpendicular to the batsman). For accurate predictions:

- Record videos from a side angle
- Avoid broadcast angles or front/back views
- Ensure the full body of the batsman is visible

## Development

### Code Style

- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: Use ESLint and Prettier configurations
- **TypeScript**: Enable strict mode for type safety

### Testing

Run linting and type checking:

**Frontend:**
```bash
cd frontend
npm run lint
```

**Backend:**
```bash
cd backend
pylint app.py utils/*.py
```

### Environment Variables

Never commit `.env` files. Use `.env.example` files for documentation if needed.

### Git Workflow

- Use feature branches for new development
- Write descriptive commit messages
- Keep commits focused and atomic
- Review code before merging to main branch

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code structure and patterns
- Write clear, self-documenting code
- Add comments for complex logic
- Update documentation for new features
- Ensure backward compatibility when possible

## License

[Specify your license here]

## Acknowledgments

- TensorFlow and Keras teams for deep learning frameworks
- FastAPI for the modern Python web framework
- React team for the frontend framework
- All contributors and testers

---

For questions or support, please open an issue in the repository.

