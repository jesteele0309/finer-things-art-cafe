# 🎨 The Finer Things Art Café - Roll-a-Portrait

**Where Art History Meets Everyday Wellness**

Met Museum art exploration app featuring Roll-a-Portrait - an interactive game that generates 7 random European paintings from the Metropolitan Museum of Art, mapped to facial features for portrait drawing inspiration.

## 🌐 Live Demos

- **Interactive Web App**: [View Roll-a-Portrait Viewer](https://jesteele0309.github.io/finer-things-art-cafe/)
- **Streamlit App**: [Try the Full-Featured App](https://finer-things-art-cafe-gyrlhbhknzbhci6wnr4g22.streamlit.app/)

## ✨ Features

- 🎲 **Random Painting Generator** - Get 7 European paintings from Met Museum
- 🎨 **Facial Feature Mapping** - Artworks mapped to HEAD, EYES, NOSE, MOUTH, EARS, HAIR, NECK
- 🖼️ **High-Quality Images** - Direct from Met Museum's collection
- 📱 **Mobile-Friendly** - Responsive design for all devices
- ✨ **DailyArt-Compatible** - JSON format inspired by popular art apps

## 📁 Project Structure

```
finer-things-art-cafe/
├── app.py                           # Streamlit app (interactive)
├── met_json_exporter.py            # Python script to generate JSON
├── example_roll_a_portrait.json    # Sample exported artworks
├── index.html                       # Simple web viewer
├── requirements.txt                 # Python dependencies
└── README.md                        # This file
```

## 🚀 Quick Start

### Option 1: View Sample Artworks (Instant)

Just open the live demo: [https://jesteele0309.github.io/finer-things-art-cafe/](https://jesteele0309.github.io/finer-things-art-cafe/)

### Option 2: Generate Fresh Artworks

1. **Install Requirements**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the JSON Exporter**
   ```bash
   python met_json_exporter.py
   ```
   This creates `roll_a_portrait.json` with 7 new random artworks.

3. **View Locally**
   - Open `index.html` in your browser
   - Or run a local server:
   ```bash
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`

### Option 3: Run Streamlit App

```bash
streamlit run app.py
```

Features:
- Single random painting mode
- Roll 7 paintings for portrait game
- European paintings filter
- Real-time API integration
- Progress bars and error handling

## 📖 How to Use for Art Classes

### Weekly Workflow (10 minutes/week)

1. **Sunday Evening**: Run `python met_json_exporter.py` to get fresh artworks
2. **Monday Morning**: Share the live URL with students
3. **During Week**: Students use artworks as references for portrait drawing
4. **Friday**: Students share their portrait creations
5. **Sunday**: Repeat with new artworks

### Integration with DailyArt App

This project complements the [DailyArt app](https://www.getdailyart.com/):
- DailyArt: Delivers one curated artwork daily
- Roll-a-Portrait: Generates 7 random paintings on-demand
- Both: Use Met Museum's collection

## 🎨 The Roll-a-Portrait Game

Inspired by the surrealist exquisite corpse technique:

1. **Roll**: Generate 7 random paintings
2. **Map**: Each painting represents one facial feature
   - HEAD - overall shape and structure
   - EYES - eye style and expression  
   - NOSE - nose shape and proportions
   - MOUTH - mouth and lips
   - EARS - ear placement and detail
   - HAIR - hairstyle and texture
   - NECK - neck and shoulders
3. **Create**: Draw a portrait using inspiration from all 7 artworks
4. **Result**: A unique surrealist portrait blending different art periods!

## 🛠️ Technical Details

### Met Museum API

- **Endpoint**: `https://collectionapi.metmuseum.org/public/collection/v1`
- **Department**: European Paintings (ID: 11) - 1250-1800
- **Filter**: Only artworks with images
- **Rate**: Free, no API key required
- **Documentation**: [Met Museum API](https://metmuseum.github.io/)

### JSON Format

DailyArt-compatible structure:
```json
{
  "gameType": "Roll-a-Portrait",
  "source": "Metropolitan Museum of Art",
  "features": [
    {
      "feature": "HEAD",
      "artwork": {
        "title": "Young Woman with a Water Pitcher",
        "artist": {"name": "Johannes Vermeer"},
        "images": {"primary": "https://..."},
        "metUrl": "https://www.metmuseum.org/art/collection/search/436535"
      }
    }
  ]
}
```

## 📝 Customization

### Change Art Period

Edit `met_json_exporter.py`:
```python
EUROPEAN_DEPT_ID = 11  # Change to different department
# 1: American Decorative Arts
# 9: Drawings and Prints
# 21: Modern and Contemporary Art
```

### Filter by Artist

Modify the search parameters:
```python
params = {
    "departmentId": 11,
    "hasImages": "true",
    "q": "Rembrandt"  # Search for specific artist
}
```

### Change Number of Artworks

```python
exporter.export_roll_a_portrait_json(count=10)  # Generate 10 instead of 7
```

## 👥 About The Finer Things Art Café

**Mission**: Make fine art accessible and therapeutic through hands-on creative practices.

**Philosophy**: "Where Art History Meets Everyday Wellness"
- Art history as daily inspiration
- Therapeutic art-making
- Accessible to beginners
- Sustainable materials
- Community-focused

## 💻 Development

### Technologies Used

- **Python 3.8+**
- **Streamlit** - Interactive web app framework
- **Requests** - HTTP library for API calls
- **JavaScript/HTML/CSS** - Simple web viewer
- **GitHub Pages** - Free hosting

### Local Development

1. Clone the repository
   ```bash
   git clone https://github.com/jesteele0309/finer-things-art-cafe.git
   cd finer-things-art-cafe
   ```

2. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

3. Run locally
   ```bash
   streamlit run app.py
   ```

## 🔗 Resources

- [Metropolitan Museum of Art API](https://metmuseum.github.io/)
- [DailyArt App](https://www.getdailyart.com/)
- [Google Arts & Culture](https://artsandculture.google.com/)
- [Streamlit Documentation](https://docs.streamlit.io/)

## 📜 License

This project uses data from the Metropolitan Museum of Art Collection API. 

- Code: MIT License
- Artwork Images: Public Domain (Met Museum Open Access)

## 🚀 Next Steps

As outlined in our implementation plan:

### Immediate Use (5 minutes) ✅
1. ✅ Run `python met_json_exporter.py`
2. ✅ Upload JSON to café website  
3. ✅ Create simple HTML page that loads JSON
4. ✅ Share URL with students: [https://jesteele0309.github.io/finer-things-art-cafe/](https://jesteele0309.github.io/finer-things-art-cafe/)

### Weekly Workflow (10 minutes/week)
1. Sunday: Run script to generate fresh JSON
2. Monday: Post first artwork on Instagram
3. Throughout week: Students draw portraits
4. Sunday: Share results in Discord

### Long-Term (2-4 hours one-time)
1. Hire developer to build mobile app
2. Host JSON on Netlify/Vercel (free)
3. Create mobile-friendly interface
4. Brand as "Café Art Roulette" app

---

**Made with ❤️ for art education and therapeutic wellness**

🎨 **The Finer Things Art Café** | Atlanta, GA
