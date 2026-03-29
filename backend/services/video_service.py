import cv2
import os

def extract_frames(video_path: str, output_dir: str, interval_seconds: int = 10):
    """Extracts frames from a video at a specified interval."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video file: {video_path}")
        return []

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30 # fallback
        
    frame_interval = int(fps * interval_seconds)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    saved_frames = []

    if total_frames > 0 and frame_interval > 0:
        # Heavily optimized frame jumping (only decodes what we strictly need)
        for current_frame in range(0, total_frames, frame_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
            ret, frame = cap.read()
            if ret:
                frame_path = os.path.join(output_dir, f"frame_{current_frame}.jpg")
                
                # Downscale 4k/1080p frames to 720p equivalent to save AI upload and processing time
                height, width = frame.shape[:2]
                if width > 1280:
                    scale = 1280 / width
                    frame = cv2.resize(frame, (1280, int(height * scale)))
                    
                cv2.imwrite(frame_path, frame)
                saved_frames.append(frame_path)
    else:
        # Fallback if total_frames failed to read from the codec correctly
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                frame_path = os.path.join(output_dir, f"frame_{frame_count}.jpg")
                cv2.imwrite(frame_path, frame)
                saved_frames.append(frame_path)

            frame_count += 1

    cap.release()
    return saved_frames
