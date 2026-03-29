import os
import json
from google import genai

def analyze_video_content(audio_path: str = None, frame_paths: list[str] = None, doc_paths: list[str] = None, focus_topic: str = None, user_api_key: str = None) -> dict:
    """Uses Gemini API to process audio and visual notes and generate a structured document."""
    api_key = user_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("Valid GEMINI_API_KEY is not set. Please set it in your browser settings or .env file.")
        
    client = genai.Client(api_key=api_key)
    
    import concurrent.futures
    
    # Process files to upload
    files_to_upload = []
    
    if audio_path:
        files_to_upload.append(audio_path)
    
    max_frames = 15 # slightly reduced to further optimize speed without major detail loss
    
    if frame_paths:
        if len(frame_paths) > max_frames:
            step = len(frame_paths) // max_frames
            sampled_frames = frame_paths[::step][:max_frames]
        else:
            sampled_frames = frame_paths
        files_to_upload.extend(sampled_frames)
        
    if doc_paths:
        files_to_upload.extend(doc_paths)
        
    print(f"Uploading {len(files_to_upload)} files (including PPTs/Frames) to Gemini concurrently...")
    
    def upload_single_file(path_to_upload):
        return client.files.upload(file=path_to_upload)

    uploaded_files = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        # map guarantees the resulting list preserves the original input order
        for file_ref in executor.map(upload_single_file, files_to_upload):
            uploaded_files.append(file_ref)
            
    topic_instruction = ""
    if focus_topic:
        topic_instruction = f"""
    CRITICAL FOCUS INSTRUCTION: The user has specifically requested that you FOCUS YOUR ANALYSIS intensely on this topic: "{focus_topic}". 
    You must still extract and elaborately explain all other topics in detail as usual, but you must prioritize and expand even MORE disproportionately on information relating specifically to {focus_topic}.
    """
            
    prompt = f"""
    You are an expert tutor and examination preparer. 
    I have provided you with a video's audio track, keyframes (images) from the video, and possibly supplementary documents (PDFs, PPTs, Word, etc.). 
    The primary goal is NOT to just blindly transcribe or document everything in these files. Instead, you must scan the materials and INTELLIGENTLY EXTRACT ONLY THE MOST IMPORTANT core topics.
    {topic_instruction}
    
    Your task is to synthesize this multimodal information into four distinct, highly-structured examination-prep sections.
    
    IMPORTANT MUST-FOLLOW INSTRUCTIONS FOR OUTPUT FORMAT:
    You must output your response EXACTLY in four sections separated by the following identical marker lines:
    
    ===DETAILED_NOTES===
    [Intelligently extracted, elaborate explanations of IMPORTANT topics only]
    Do NOT include mundane details or everything from the files. Identify only the key concepts and provide thorough, detailed, and clear explanations strictly for these important topics.
    Structure your notes perfectly using Markdown: use clear # Headings, bullet points, bold text for emphasis, and proper code blocks if needed.
    
    ===ONE_LINE_POINTS===
    [Extract strictly the most important 1-line points from the content as a markdown bulleted list]
    Limit each point to a single concise sentence. Focus only on the absolute most valuable takeaways for a quick review.
    
    ===QUIZ===
    [Generate exactly 5-10 highly relevant MCQs focused strictly on the important topics]
    Test the concepts deeply, even inferring related important knowledge beyond just the video's literal words.
    Present them format:
    ### Q1: [Question]
    - A) [Option A]
    - B) [Option B]
    - C) [Option C]
    - D) [Option D]
    
    **Answer:** [Correct Option]
    
    ===FLASHCARDS===
    [Generate exactly 10 flashcards in highly-structured JSON format]
    Output ONLY a valid JSON array of objects, containing "q" (question) and "a" (answer) keys. Do NOT wrap this in Markdown block ticks. Look at the example:
    [
      {{ "q": "What is the primary function of the Mitochondria?", "a": "To generate most of the chemical energy needed to power the cell's biochemical reactions." }}
    ]
    """
    
    print("Generating content with Gemini...")
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=uploaded_files + [prompt]
    )
    
    text = response.text
    
    # Parse the response using the delimiters
    detailed_notes = "Error generating notes."
    one_line_points = "Error generating one-line points."
    quiz = "Error generating quiz."
    flashcards = []
    
    try:
        parts = text.split("===DETAILED_NOTES===")
        if len(parts) > 1:
            rest = parts[1]
            sub_parts = rest.split("===ONE_LINE_POINTS===")
            if len(sub_parts) > 1:
                detailed_notes = sub_parts[0].strip()
                rest2 = sub_parts[1]
                quiz_parts = rest2.split("===QUIZ===")
                if len(quiz_parts) > 1:
                    one_line_points = quiz_parts[0].strip()
                    rest3 = quiz_parts[1]
                    flash_parts = rest3.split("===FLASHCARDS===")
                    if len(flash_parts) > 1:
                        quiz = flash_parts[0].strip()
                        raw_json = flash_parts[1].strip()
                        raw_json = raw_json.replace("```json", "").replace("```", "").strip()
                        try:
                            flashcards = json.loads(raw_json)
                        except json.JSONDecodeError:
                            print("Warning: Failed to parse flashcards JSON")
                    else:
                        quiz = rest3.strip()
                else:
                    one_line_points = rest2.strip()
            else:
                detailed_notes = rest.strip()
        else:
            detailed_notes = text
            
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        detailed_notes = text # fallback
        
    return {
        "detailed_notes": detailed_notes,
        "one_line_points": one_line_points,
        "quiz": quiz,
        "flashcards": flashcards
    }
