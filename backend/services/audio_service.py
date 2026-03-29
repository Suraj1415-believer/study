import os
from moviepy import VideoFileClip

def extract_audio(video_path: str, output_audio_path: str):
    """Extracts audio from a video file and saves it as an mp3."""
    try:
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(output_audio_path, logger=None)
        video.close()
        return True
    except Exception as e:
        print(f"Error extracting audio: {e}")
        return False
