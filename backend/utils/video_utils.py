"""
Video processing utilities for extracting and preprocessing frames from video files.
"""
import cv2
import numpy as np
from typing import List


def extract_frames(video_path: str, frame_count: int = 8) -> List[np.ndarray]:
    """
    Extract evenly distributed frames from a video file.
    
    Args:
        video_path: Path to the video file
        frame_count: Number of frames to extract (default: 8)
    
    Returns:
        List of processed frames as numpy arrays (RGB, 224x224)
    
    Raises:
        ValueError: If video cannot be opened or has zero frames
    """
    # Open video file
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")
    
    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    if total_frames == 0:
        cap.release()
        raise ValueError("Video has zero frames")
    
    # Calculate frame indices to extract (evenly distributed)
    if total_frames <= frame_count:
        # If video has fewer frames than requested, extract all frames
        frame_indices = list(range(total_frames))
    else:
        # Calculate evenly distributed frame indices
        step = total_frames / frame_count
        frame_indices = [int(i * step) for i in range(frame_count)]
    
    frames = []
    
    try:
        for frame_idx in frame_indices:
            # Seek to the specific frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if not ret:
                # If frame couldn't be read, skip it
                continue
            
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Resize to 224x224
            frame_resized = cv2.resize(frame_rgb, (224, 224))
            
            frames.append(frame_resized)
    
    finally:
        cap.release()
    
    if len(frames) == 0:
        raise ValueError("No frames could be extracted from the video")
    
    return frames

