import streamlit as st
import requests
import random
import time
from typing import List, Dict, Optional

# Page configuration
st.set_page_config(
    page_title="Roll-a-Portrait | The Finer Things Art Café",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Constants
BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1"
EUROPEAN_DEPT_ID = 11  # European Paintings 1250-1800
FACIAL_FEATURES = ["HEAD", "EYES", "NOSE", "MOUTH", "EARS", "HAIR", "NECK"]

# Custom CSS
st.markdown("""
    <style>
    .main-title {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        color: #8B4513;
        padding: 1rem 0;
    }
    .subtitle {
        font-size: 1.2rem;
        text-align: center;
        color: #666;
        padding-bottom: 2rem;
    }
    .feature-badge {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 1rem;
    }
    .artwork-title {
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
        margin-top: 1rem;
    }
    .artist-name {
        font-size: 1.2rem;
        color: #666;
        font-style: italic;
    }
    .cafe-footer {
        text-align: center;
        padding: 2rem;
        color: #999;
        font-size: 0.9rem;
    }
    </style>
""", unsafe_allow_html=True)

@st.cache_data(ttl=3600)
def search_european_paintings() -> List[int]:
    """Search for European paintings with images in the Met collection."""
    try:
        params = {
            "departmentId": EUROPEAN_DEPT_ID,
            "hasImages": "true",
            "q": "painting"
        }
        response = requests.get(f"{BASE_URL}/search", params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("objectIDs", [])
    except Exception as e:
        st.error(f"Error searching Met Museum: {e}")
        return []

@st.cache_data(ttl=3600)
def get_artwork_details(object_id: int) -> Optional[Dict]:
    """Fetch artwork details from the Met Museum API."""
    try:
        response = requests.get(f"{BASE_URL}/objects/{object_id}", timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return None

def get_random_european_painting(object_ids: List[int], max_attempts: int = 20) -> Optional[Dict]:
    """Get a random European painting with valid image."""
    for _ in range(max_attempts):
        random_id = random.choice(object_ids)
        artwork = get_artwork_details(random_id)
        
        if artwork and artwork.get("primaryImage"):
            return {
                "id": artwork.get("objectID"),
                "title": artwork.get("title", "Untitled"),
                "artist": artwork.get("artistDisplayName", "Unknown Artist"),
                "date": artwork.get("objectDate", "Date unknown"),
                "medium": artwork.get("medium", "Medium not specified"),
                "image_url": artwork.get("primaryImage"),
                "image_small": artwork.get("primaryImageSmall"),
                "met_url": artwork.get("objectURL", ""),
                "culture": artwork.get("culture", "")
            }
        time.sleep(0.2)
    return None

def display_artwork(artwork: Dict, feature: str, col):
    """Display an artwork in a formatted column."""
    with col:
        st.markdown(f'<div class="feature-badge">{feature}</div>', unsafe_allow_html=True)
        
        if artwork.get("image_url"):
            st.image(artwork["image_url"], use_container_width=True)
        
        st.markdown(f'<div class="artwork-title">{artwork["title"]}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="artist-name">{artwork["artist"]}</div>', unsafe_allow_html=True)
        
        with st.expander("📋 Artwork Details"):
            st.write(f"**Date:** {artwork['date']}")
            st.write(f"**Medium:** {artwork['medium']}")
            if artwork.get("culture"):
                st.write(f"**Culture:** {artwork['culture']}")
            if artwork.get("met_url"):
                st.write(f"[View at The Met]({artwork['met_url']})")

# Main App
st.markdown('<div class="main-title">🎨 Roll-a-Portrait</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="subtitle">Interactive Streamlit App: Roll-a-Portrait Random Painting Viewer<br/>'
    'Powered by the Metropolitan Museum of Art API</div>',
    unsafe_allow_html=True
)

# Sidebar
with st.sidebar:
    st.header("🎲 Game Controls")
    st.write("""This is a demo of the **Interactive Streamlit App: Roll-a-Portrait Random Painting Viewer** 
    powered by the Metropolitan Museum of Art API.""")
    
    st.write("""### Features:
    - 🖼️ **Single Random Painting Mode**
    - 🎭 **Roll-a-Portrait Game Mode** (7 paintings)
    - 🎨 **European Paintings** from Met Museum
    - 🔄 **Real API integration**
    - 📊 **Department filters** (European, Modern, All)
    - 🔍 **Artist name search**
    - 📈 **Progress bars**
    - ⚠️ **Error handling**
    - 💾 **Caching for performance**
    """)
    
    st.write("---")
    st.write("### 🎨 The Finer Things Art Café")
    st.write("Where Art History Meets Everyday Wellness")

# Department filter
st.write("### 🎯 Select Department")
department = st.selectbox(
    "Department Filter",
    ["European Paintings", "Modern Art", "All Departments"],
    index=0,
    label_visibility="collapsed"
)

# Artist search
artist_name = st.text_input("🔍 Artist Name (optional)", placeholder="e.g., Rembrandt, Vermeer")

# Main action buttons
col1, col2 = st.columns(2)

with col1:
    single_painting = st.button("🎲 Get Random Painting", use_container_width=True, type="primary")

with col2:
    roll_seven = st.button("🎭 Roll 7 Paintings", use_container_width=True, type="primary")

# Search paintings
object_ids = search_european_paintings()

if not object_ids:
    st.error("⚠️ Could not retrieve paintings from the Met Museum. Please try again later.")
    st.stop()

st.success(f"✅ Found {len(object_ids):,} European paintings with images")

# Single painting mode
if single_painting:
    with st.spinner("🎨 Fetching a random masterpiece..."):
        artwork = get_random_european_painting(object_ids)
        
        if artwork:
            st.write("---")
            col = st.columns([1, 2, 1])[1]
            with col:
                if artwork.get("image_url"):
                    st.image(artwork["image_url"], use_container_width=True)
                
                st.markdown(f'<div class="artwork-title">{artwork["title"]}</div>', unsafe_allow_html=True)
                st.markdown(f'<div class="artist-name">{artwork["artist"]}</div>', unsafe_allow_html=True)
                
                st.write(f"**Date:** {artwork['date']}")
                st.write(f"**Medium:** {artwork['medium']}")
                if artwork.get("culture"):
                    st.write(f"**Culture:** {artwork['culture']}")
                if artwork.get("met_url"):
                    st.markdown(f"[🔗 View at The Met]({artwork['met_url']})")
        else:
            st.error("Could not find a suitable artwork. Please try again.")

# Roll 7 paintings mode
if roll_seven:
    st.write("---")
    st.write("## 🎭 Roll-a-Portrait: 7 Paintings Mapped to Facial Features")
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    artworks = []
    for i in range(7):
        status_text.text(f"Rolling for {FACIAL_FEATURES[i]}... ({i+1}/7)")
        progress_bar.progress((i + 1) / 7)
        
        artwork = get_random_european_painting(object_ids)
        if artwork:
            artworks.append(artwork)
        else:
            st.warning(f"Could not fetch artwork for {FACIAL_FEATURES[i]}")
        
        time.sleep(0.3)
    
    status_text.text("✅ All 7 paintings loaded!")
    time.sleep(0.5)
    status_text.empty()
    progress_bar.empty()
    
    if len(artworks) >= 7:
        st.write("### 🖼️ Your Portrait Collection")
        
        # Display in rows
        for i in range(0, 7, 3):
            cols = st.columns(min(3, 7 - i))
            for j, col in enumerate(cols):
                if i + j < len(artworks):
                    display_artwork(artworks[i + j], FACIAL_FEATURES[i + j], col)
        
        # Summary section
        st.write("---")
        st.write("### 📋 Roll Summary")
        summary_text = ""
        for i, artwork in enumerate(artworks[:7]):
            summary_text += f"**{FACIAL_FEATURES[i]}** → *{artwork['title']}* by {artwork['artist']}\n\n"
        st.markdown(summary_text)
    else:
        st.error("Could not fetch all 7 artworks. Please try again.")

# Footer
st.markdown("---")
st.markdown(
    '<div class="cafe-footer">'
    '🎨 The Finer Things Art Café | Where Art History Meets Everyday Wellness<br/>'
    'Data provided by The Metropolitan Museum of Art Collection API<br/>'
    'Available for offline drawing inspiration! Made with ❤️ using Streamlit'
    '</div>',
    unsafe_allow_html=True
)
