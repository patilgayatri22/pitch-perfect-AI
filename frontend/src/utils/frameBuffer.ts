/**
 * Utility for buffering video frames before sending to backend
 * The backend expects 8 frames, so we buffer them over time
 * Includes motion detection to only trigger predictions when there's movement
 */

interface FrameData {
  base64: string;
  imageData: ImageData;
  timestamp: number;
}

export class FrameBuffer {
  private buffer: FrameData[] = [];
  private readonly maxFrames: number;
  private readonly frameInterval: number;
  private readonly motionThreshold: number;
  private lastCaptureTime: number = 0;
  private hasSignificantMotion: boolean = false;

  constructor(
    maxFrames: number = 8,
    frameInterval: number = 200,
    motionThreshold: number = 0.15 // 15% of pixels must change to detect motion
  ) {
    this.maxFrames = maxFrames;
    this.frameInterval = frameInterval;
    this.motionThreshold = motionThreshold;
  }

  /**
   * Calculate motion between two frames using pixel difference
   * Returns a value between 0 and 1 representing the amount of motion
   */
  private calculateMotion(frame1: ImageData, frame2: ImageData): number {
    if (frame1.width !== frame2.width || frame1.height !== frame2.height) {
      return 1.0; // Different sizes = significant change
    }

    const pixels = frame1.data.length / 4; // RGBA = 4 bytes per pixel
    let changedPixels = 0;
    const threshold = 30; // Pixel difference threshold (0-255)

    // Compare pixels (using grayscale for efficiency)
    for (let i = 0; i < frame1.data.length; i += 4) {
      // Convert to grayscale
      const gray1 = (frame1.data[i] + frame1.data[i + 1] + frame1.data[i + 2]) / 3;
      const gray2 = (frame2.data[i] + frame2.data[i + 1] + frame2.data[i + 2]) / 3;
      
      if (Math.abs(gray1 - gray2) > threshold) {
        changedPixels++;
      }
    }

    return changedPixels / pixels;
  }

  /**
   * Capture a frame from video and add to buffer
   * Returns true if buffer is full AND there's significant motion
   */
  addFrame(video: HTMLVideoElement): boolean {
    const now = Date.now();
    
    // Throttle frame capture
    if (now - this.lastCaptureTime < this.frameInterval) {
      return false;
    }

    this.lastCaptureTime = now;

    // Convert frame to base64 and ImageData
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Check for motion if we have a previous frame
    if (this.buffer.length > 0) {
      const lastFrame = this.buffer[this.buffer.length - 1];
      const motion = this.calculateMotion(lastFrame.imageData, imageData);
      
      // Update motion flag - we need motion in recent frames
      if (motion > this.motionThreshold) {
        this.hasSignificantMotion = true;
      }
    }
    
    // Add to buffer
    this.buffer.push({
      base64,
      imageData,
      timestamp: now,
    });

    // Keep only last N frames
    if (this.buffer.length > this.maxFrames) {
      this.buffer.shift();
    }

    // Check if we have enough frames AND significant motion
    if (this.buffer.length >= this.maxFrames) {
      // Check if there's motion in the buffer
      // We need at least some motion in the recent frames
      if (this.hasSignificantMotion) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get current buffer frames as base64 strings
   */
  getFrames(): string[] {
    // If buffer is not full, pad with last frame
    if (this.buffer.length < this.maxFrames && this.buffer.length > 0) {
      const lastFrame = this.buffer[this.buffer.length - 1];
      while (this.buffer.length < this.maxFrames) {
        this.buffer.push(lastFrame);
      }
    }
    return this.buffer.map(frame => frame.base64);
  }

  /**
   * Get motion level in the current buffer
   * Returns a value between 0 and 1
   */
  getMotionLevel(): number {
    if (this.buffer.length < 2) {
      return 0;
    }

    let totalMotion = 0;
    let comparisons = 0;

    // Compare consecutive frames
    for (let i = 1; i < this.buffer.length; i++) {
      const motion = this.calculateMotion(
        this.buffer[i - 1].imageData,
        this.buffer[i].imageData
      );
      totalMotion += motion;
      comparisons++;
    }

    return comparisons > 0 ? totalMotion / comparisons : 0;
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = [];
    this.lastCaptureTime = 0;
    this.hasSignificantMotion = false;
  }

  /**
   * Check if buffer is ready (has enough frames AND motion detected)
   */
  isReady(): boolean {
    return this.buffer.length >= this.maxFrames && this.hasSignificantMotion;
  }

  /**
   * Reset motion flag (useful when prediction is sent)
   */
  resetMotionFlag(): void {
    this.hasSignificantMotion = false;
  }
}

