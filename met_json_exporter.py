#!/usr/bin/env python3
"""
Metropolitan Museum of Art JSON Exporter
Creates DailyArt-compatible JSON files for The Finer Things Art Café
"""

import requests
import random
import json
import time
from typing import List, Dict, Optional
from datetime import datetime

class MetMuseumJSONExporter:
    """Export Met Museum artworks to various JSON formats."""
    
    BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1"
    EUROPEAN_DEPT_ID = 11  # European Paintings 1250-1800
    FACIAL_FEATURES = ["HEAD", "EYES", "NOSE", "MOUTH", "EARS", "HAIR", "NECK"]
    
    def __init__(self):
        self.object_ids_cache = None
    
    def search_european_paintings(self) -> List[int]:
        """Search for European paintings with images."""
        if self.object_ids_cache:
            return self.object_ids_cache
            
        try:
            params = {
                "departmentId": self.EUROPEAN_DEPT_ID,
                "hasImages": "true",
                "q": "painting"
            }
            response = requests.get(f"{self.BASE_URL}/search", params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            self.object_ids_cache = data.get("objectIDs", [])
            return self.object_ids_cache
        except Exception as e:
            print(f"Error searching Met Museum: {e}")
            return []
    
    def get_artwork_details(self, object_id: int) -> Optional[Dict]:
        """Fetch artwork details from the Met Museum API."""
        try:
            response = requests.get(f"{self.BASE_URL}/objects/{object_id}", timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return None
    
    def transform_to_dailyart_format(self, artwork: Dict) -> Dict:
        """Transform Met API response to DailyArt-compatible format."""
        return {
            "id": artwork.get("objectID"),
            "title": artwork.get("title", "Untitled"),
            "artist": {
                "name": artwork.get("artistDisplayName", "Unknown Artist"),
                "nationality": artwork.get("artistNationality", ""),
                "lifespan": {
                    "begin": artwork.get("artistBeginDate", ""),
                    "end": artwork.get("artistEndDate", "")
                }
            },
            "date": artwork.get("objectDate", "Date unknown"),
            "medium": artwork.get("medium", "Medium not specified"),
            "dimensions": artwork.get("dimensions", ""),
            "culture": artwork.get("culture", ""),
            "images": {
                "primary": artwork.get("primaryImage", ""),
                "primarySmall": artwork.get("primaryImageSmall", ""),
                "additional": artwork.get("additionalImages", [])
            },
            "rights": {
                "isPublicDomain": artwork.get("isPublicDomain", False),
                "creditLine": artwork.get("creditLine", "")
            },
            "metUrl": artwork.get("objectURL", "")
        }
    
    def get_random_artwork(self, object_ids: List[int], max_attempts: int = 20) -> Optional[Dict]:
        """Get a random artwork with valid image."""
        for _ in range(max_attempts):
            random_id = random.choice(object_ids)
            artwork = self.get_artwork_details(random_id)
            
            if artwork and artwork.get("primaryImage"):
                return self.transform_to_dailyart_format(artwork)
            
            time.sleep(0.2)
        return None
    
    def export_roll_a_portrait_json(self, count: int = 7, filename: str = "roll_a_portrait.json"):
        """Export Roll-a-Portrait game JSON with 7 artworks mapped to facial features."""
        print(f"🎨 Generating Roll-a-Portrait JSON...")
        
        object_ids = self.search_european_paintings()
        if not object_ids:
            print("❌ Could not retrieve paintings")
            return
        
        print(f"✅ Found {len(object_ids):,} European paintings")
        
        artworks = []
        for i in range(count):
            print(f"Rolling for {self.FACIAL_FEATURES[i]}... ({i+1}/{count})")
            artwork = self.get_random_artwork(object_ids)
            if artwork:
                artworks.append(artwork)
            time.sleep(0.3)
        
        game_data = {
            "gameType": "Roll-a-Portrait",
            "source": "Metropolitan Museum of Art",
            "generated": datetime.now().isoformat(),
            "totalArtworks": len(artworks),
            "features": [
                {
                    "feature": self.FACIAL_FEATURES[i],
                    "artwork": artworks[i]
                }
                for i in range(min(len(artworks), len(self.FACIAL_FEATURES)))
            ],
            "cafeInfo": {
                "name": "The Finer Things Art Café",
                "tagline": "Where Art History Meets Everyday Wellness"
            }
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(game_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Created {filename}")
        print(f"📊 {len(artworks)} artworks exported")
        return game_data
    
    def export_gallery_json(self, count: int = 30, filename: str = "met_gallery.json"):
        """Export gallery JSON with multiple artworks for browsing."""
        print(f"🖼️ Generating Gallery JSON...")
        
        object_ids = self.search_european_paintings()
        if not object_ids:
            return
        
        artworks = []
        for i in range(count):
            print(f"Fetching artwork {i+1}/{count}...")
            artwork = self.get_random_artwork(object_ids)
            if artwork:
                artworks.append(artwork)
            time.sleep(0.2)
        
        gallery_data = {
            "collectionName": "Met Museum European Paintings",
            "generated": datetime.now().isoformat(),
            "totalArtworks": len(artworks),
            "artworks": artworks,
            "cafeInfo": {
                "name": "The Finer Things Art Café"
            }
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(gallery_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Created {filename}")
        return gallery_data

def main():
    """Main execution function."""
    print("="*70)
    print("🎨 The Finer Things Art Café - Met Museum JSON Exporter")
    print("="*70)
    print()
    
    exporter = MetMuseumJSONExporter()
    
    # Generate Roll-a-Portrait JSON (7 artworks)
    exporter.export_roll_a_portrait_json(count=7)
    
    print("\n" + "="*70)
    print("✅ Export complete!")
    print("📁 Files created:")
    print("   - roll_a_portrait.json")
    print("\n💡 Next steps:")
    print("   1. Upload JSON to café website")
    print("   2. Create simple HTML page that loads JSON")
    print("   3. Share URL with students")
    print("="*70)

if __name__ == "__main__":
    main()
