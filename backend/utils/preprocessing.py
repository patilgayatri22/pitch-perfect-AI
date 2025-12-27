"""
Preprocessing utilities for preparing sequences of video frames for model inference.
"""
from typing import List

import numpy as np

SEQUENCE_LENGTH = 8


def _pad_or_trim_sequence(frames: np.ndarray, sequence_length: int) -> np.ndarray:
    """
    Ensure the frame sequence matches the desired length by trimming or padding.

    Args:
        frames: Array of frames with shape (n_frames, 224, 224, 3)
        sequence_length: Desired sequence length

    Returns:
        Array of frames with shape (sequence_length, 224, 224, 3)
    """
    frame_count = len(frames)

    if frame_count == 0:
        raise ValueError("Cannot preprocess an empty sequence of frames")

    if frame_count == sequence_length:
        return frames

    if frame_count > sequence_length:
        return frames[-sequence_length:]

    # Pad by repeating the last available frame
    pad_count = sequence_length - frame_count
    last_frame = frames[-1:]
    padding = np.repeat(last_frame, pad_count, axis=0)
    return np.concatenate([frames, padding], axis=0)


def preprocess_frames(
    frames: List[np.ndarray],
    sequence_length: int = SEQUENCE_LENGTH,
    add_batch_dim: bool = True
) -> np.ndarray:
    """
    Normalize and prepare raw RGB frames for the multitask model.

    Args:
        frames: List of frames as numpy arrays (224x224x3, RGB, uint8)
        sequence_length: Desired sequence length (default: 8)
        add_batch_dim: Whether to prepend a batch dimension (default: True)

    Returns:
        Numpy array with shape (1, sequence_length, 224, 224, 3) if add_batch_dim else
        (sequence_length, 224, 224, 3), with float32 values normalized to [0, 1].
    """
    frames_array = np.asarray(frames, dtype=np.float32)

    if frames_array.ndim != 4 or frames_array.shape[1:] != (224, 224, 3):
        raise ValueError(
            f"Frames must have shape (N, 224, 224, 3); received {frames_array.shape}"
        )

    frames_array = _pad_or_trim_sequence(frames_array, sequence_length)
    frames_array = frames_array / 255.0  # normalize to [0, 1]

    if add_batch_dim:
        frames_array = np.expand_dims(frames_array, axis=0)

    return frames_array

