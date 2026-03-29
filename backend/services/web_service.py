import requests
from bs4 import BeautifulSoup
import re

def scrape_article(url: str) -> str:
    """
    Downloads the HTML from a given URL, parses it, and extracts clean text from relevant tags.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove noisy elements
        for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
            element.decompose()
            
        # Extract meaningful tags
        content_tags = soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'li', 'article'])
        
        text_blocks = []
        for tag in content_tags:
            text = tag.get_text(strip=True)
            if len(text) > 20: # Filter out tiny useless string fragments
                text_blocks.append(text)
                
        # Combine and clean up
        full_text = "\n\n".join(text_blocks)
        full_text = re.sub(r'\n{3,}', '\n\n', full_text) # reduce multiple newlines
        
        if not full_text.strip():
            # Fallback if no specific tags found
            full_text = soup.get_text(separator='\n\n', strip=True)

        return full_text
        
    except requests.exceptions.RequestException as e:
        print(f"Error scraping {url}: {e}")
        return ""
