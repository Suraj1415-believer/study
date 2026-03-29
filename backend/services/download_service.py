import os
import uuid
import yt_dlp

def download_video_from_url(url: str, output_dir: str = "temp") -> str:
    """Downloads a video from a URL using yt-dlp and returns the saved file path."""
    os.makedirs(output_dir, exist_ok=True)
    task_id = str(uuid.uuid4())
    
    # Configure yt-dlp to download max 720p to drastically reduce download and processing time
    ydl_opts = {
        'format': 'best[height<=720]/best',
        'outtmpl': os.path.join(output_dir, f'{task_id}_video.%(ext)s'),
        'quiet': False,
        'no_warnings': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        # Find the properly downloaded file by prefix
        for file in os.listdir(output_dir):
            if file.startswith(f"{task_id}_video"):
                return os.path.join(output_dir, file)
                
        # Fallback if no file is found (unlikely)
        return os.path.join(output_dir, f'{task_id}_video.mp4')
