# Community Guidelines PDF Generation Guide

## Quick PDF Generation (Recommended Method)

The easiest way to create a beautiful PDF of the community guidelines:

### Method 1: Print from Browser
1. Open the HTML file in any modern browser:
   - Visit: `https://michiganspots.com/r-michiganspots-community-guidelines.html`
   - Or open locally: `public/r-michiganspots-community-guidelines.html`

2. Open Print dialog:
   - **Mac**: `Cmd + P`
   - **Windows/Linux**: `Ctrl + P`

3. Configure print settings:
   - **Destination**: Save as PDF
   - **Paper size**: Letter (8.5" x 11")
   - **Margins**: Default (or adjust to preference)
   - **Options**: Enable "Background graphics" for full styling

4. Click "Save" and choose location:
   - Recommended filename: `r-michiganspots-community-guidelines.pdf`

### Method 2: Using Chrome/Edge Built-in PDF Export
1. Open `r-michiganspots-community-guidelines.html` in Chrome or Edge
2. Right-click → "Print" (or Cmd/Ctrl + P)
3. Destination → "Save as PDF"
4. Click "Save"

---

## What Was Created

### 1. **On-Brand Website Page** ✅
- **URL**: `/community-guidelines`
- **File**: `src/pages/community-guidelines.astro`
- **Features**:
  - Full Michigan Spots branding (colors, fonts, styling)
  - Responsive design for mobile and desktop
  - Card-based layout with icons
  - Matching the site's treasure hunt theme
  - Link added to Footer navigation

### 2. **Printable HTML Version** ✅
- **URL**: `/r-michiganspots-community-guidelines.html`
- **File**: `public/r-michiganspots-community-guidelines.html`
- **Features**:
  - Professional print styling
  - Optimized for 8.5" x 11" paper
  - Table of contents
  - Page break optimization
  - Print-friendly colors and layout

### 3. **Footer Navigation** ✅
- Added "Community Guidelines" link to site footer
- Accessible from any page on the site
- Positioned in "Explore" section

---

## Content Included

All r/MichiganSpots community guidelines:

✅ **Community Rules** (6 rules)
- Stay On-Topic
- Respect & Kindness
- Authentic Participation
- Privacy & Safety
- Business Partnership Respect
- Quality Content Standards

✅ **Game-Specific Guidelines**
- Treasure Hunt Challenges
- Interactive Mini-Games
- Community Events

✅ **Post Flairs & Formatting**
- 7 required flairs with descriptions
- Post title format examples

✅ **Point System & Rewards**
- Earning points breakdown
- Leaderboard categories
- Rewards and recognition

✅ **Reporting & Moderation**
- Report issues guide
- Moderation actions explained

✅ **Community Partnerships**
- Benefits for businesses and community
- How to become a partner

✅ **Using the App**
- App features overview
- App guidelines

✅ **Contact & Support**
- Moderator team information
- Community resources

---

## Styling Details

### On-Brand Colors Used:
- **Copper Orange**: `#d97742` - Headers, CTAs, accents
- **Lakes Blue**: `#2c5f7f` - Secondary accents, links
- **Forest Green**: `#2d5016` - Success states, checkmarks
- **Sunset Red**: `#b8405e` - Warnings, negative states
- **Gold Treasure**: `#d4af37` - Point system, rewards
- **Ink Primary**: `#2c1810` - Main text
- **Parchment Light**: `#f5f2e9` - Backgrounds, cards

### Typography:
- **Headings**: Font Heading (bold, large sizes)
- **Body**: System fonts for readability
- **Spacing**: Generous padding and margins
- **Icons**: Lucide React icon library

---

## File Locations

```
michiganspot/
├── src/pages/community-guidelines.astro  # Main website page
├── public/r-michiganspots-community-guidelines.html  # Printable version
├── r-michiganspots-community-guidelines.md  # Source markdown
└── PDF-GENERATION-GUIDE.md  # This file
```

---

## Next Steps

1. **Test the page**: Visit `/community-guidelines` on the deployed site
2. **Generate PDF**: Use browser print (Method 1 above)
3. **Share with Reddit**: Post PDF and page link to r/MichiganSpots
4. **Sticky post**: Consider making it a sticky/pinned post on the subreddit

---

## Advanced: Pandoc PDF Generation (Optional)

If you want to use Pandoc with a LaTeX engine for maximum control:

### Prerequisites:
```bash
# Install MacTeX (includes pdflatex, xelatex)
brew install --cask mactex-no-gui

# Or full MacTeX
brew install --cask mactex
```

### Generate PDF:
```bash
pandoc r-michiganspots-community-guidelines.md \
  -o r-michiganspots-community-guidelines.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=2 \
  -V geometry:margin=1in \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V urlcolor=blue \
  -V fontsize=11pt \
  -V papersize=letter
```

**Note**: This method requires ~5GB of LaTeX packages to be installed. Browser print method is recommended for simplicity.

---

**Created**: October 21, 2025
**Updated**: October 21, 2025
