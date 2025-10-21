# Reddit Implementation Guide for r/michiganspots

## 🔧 **Step-by-Step Implementation**

### **1. Subreddit Description (Copy to Reddit Settings)**

**Short Description (160 chars max):**
```
Michigan's premier treasure hunting community! Discover hidden gems, complete challenges, support local businesses. 🗺️✨
```

**Long Description:**
```
Welcome to r/MichiganSpots - Michigan's most exciting treasure hunting community! Join thousands of explorers discovering hidden gems across the Great Lakes State through interactive challenges, mini-games, and local business partnerships. Whether you're hunting for the perfect coffee shop in Grand Rapids, exploring Pictured Rocks, or testing your Michigan knowledge in our trivia games, there's always an adventure waiting. Download our app, complete challenges, earn points, and connect with fellow Michigan enthusiasts. The real treasure is the communities we discover along the way! 🎯🏴‍☠️
```

### **2. Community Rules (Copy to Reddit Rules Section)**

**Rule 1: Michigan Content Only**
```
Title: Michigan Content Only 🗺️
Description: Posts must be related to Michigan locations, businesses, or treasure hunt activities. Off-topic content will be removed.
Violation Reason: Off-topic content
```

**Rule 2: Authentic Participation**
```
Title: Authentic Participation ✅
Description: Submit genuine challenge completions with real proof. No fake GPS locations, manipulated evidence, or cheating. Honest reviews and experiences only.
Violation Reason: Fake or manipulated content
```

**Rule 3: Respect & Safety**
```
Title: Respect & Safety 🤝
Description: Be kind and respectful to all community members. No harassment, bullying, or discriminatory language. Protect personal privacy and follow all local laws.
Violation Reason: Harassment or unsafe behavior
```

**Rule 4: Quality Content Standards**
```
Title: Quality Content Standards 📸
Description: Use appropriate post flairs, include clear photos and required proof for challenges, follow posting format guidelines. No spam or low-effort posts.
Violation Reason: Low quality or improperly formatted content
```

**Rule 5: Business Partnership Respect**
```
Title: Business Partnership Respect 🏪
Description: Be respectful to partner businesses and staff. Follow business hours and policies. Make required purchases for business challenges. Leave honest, constructive reviews.
Violation Reason: Disrespectful behavior toward businesses
```

**Rule 6: Game Integrity**
```
Title: Game Integrity 🎮
Description: Submit challenge proof within 24 hours. No retroactive submissions older than 1 week. Report cheating or suspicious activity. Help others learn, but don't share direct answers.
Violation Reason: Cheating or game integrity violation
```

### **3. Post Flairs (Create in Reddit Flair Settings)**

```
🎯 Challenge Complete - #059669 (green)
🎮 Game Discussion - #3b82f6 (blue)
🏪 Business Spotlight - #f59e0b (amber)
📍 Location Discovery - #8b5cf6 (purple)
🤝 Community Event - #ef4444 (red)
❓ Help/Question - #6b7280 (gray)
📢 Announcement - #dc2626 (red)
```

### **4. Sidebar Content (Copy to Community Description)**

```markdown
## 🎯 Quick Start Guide
1. Download the Michigan Spots app
2. Check active treasure hunt challenges  
3. Visit locations and submit proof
4. Play interactive mini-games
5. Earn points and climb the leaderboard!

## 🎮 Available Games
- 🔍 Spot the Difference
- 🔤 Michigan Word Search  
- 🧠 Michigan Trivia
- 🗺️ Virtual Treasure Hunt
- 🎨 Drawing Challenge

## 📱 Official Links
- 🌐 Website: michiganspots.com
- 📱 Download App: [Coming Soon]
- 💬 Discord: [Coming Soon]
- 📧 Contact: hello@michiganspots.com

## 📋 Post Flairs Required
Use appropriate flairs for all posts:
- 🎯 Challenge Complete
- 🎮 Game Discussion  
- 🏪 Business Spotlight
- 📍 Location Discovery
- 🤝 Community Event
- ❓ Help/Question
- 📢 Announcement

## 🚨 Need Help?
- Read our community guidelines
- Message the moderators
- Ask the community with [Help/Question] flair

**Happy hunting! 🗺️✨**
```

### **5. AutoModerator Configuration**

**Create this as automod config (Reddit Settings > AutoModerator):**

```yaml
---
# Require post flairs
type: submission
~flair_text: ["🎯 Challenge Complete", "🎮 Game Discussion", "🏪 Business Spotlight", "📍 Location Discovery", "🤝 Community Event", "❓ Help/Question", "📢 Announcement"]
action: remove
action_reason: "Missing required flair"
comment: |
    Your post has been removed because it doesn't have a required flair. Please add an appropriate flair and resubmit.
    
    **Available flairs:**
    - 🎯 Challenge Complete
    - 🎮 Game Discussion  
    - 🏪 Business Spotlight
    - 📍 Location Discovery
    - 🤝 Community Event
    - ❓ Help/Question
    - 📢 Announcement

---
# Welcome new users
type: submission
author:
    account_age: "< 7 days"
action: approve
comment: |
    Welcome to r/MichiganSpots! 🎉
    
    Thanks for joining our treasure hunting community! Make sure to:
    - Read our community guidelines
    - Download the Michigan Spots app
    - Check out active challenges
    
    Happy hunting! 🗺️✨

---
# Challenge post title format
type: submission
flair_text: "🎯 Challenge Complete"
~title (regex): '.*- .*, MI'
action: remove
action_reason: "Improper title format"
comment: |
    Challenge completion posts must include the location in format: "Description - City, MI"
    
    **Example:** "Downtown Coffee Hunt - Grand Rapids, MI"
    
    Please repost with the correct format.

---
# Remove common spam words
type: submission
title+body (regex): ['crypto', 'bitcoin', 'investment', 'make money', 'work from home']
action: spam
action_reason: "Spam content"

---
# Auto-approve quality posts
type: submission
title (regex): ['challenge', 'michigan', 'treasure', 'hunt', 'game', 'business', 'location']
author:
    account_age: "> 30 days"
    combined_karma: "> 100"
action: approve
```

### **6. Removal Reasons (Create in Mod Tools)**

**Off-Topic Content:**
```
Your post has been removed because it doesn't relate to Michigan locations, businesses, or treasure hunt activities. Please review our community guidelines and repost with Michigan-relevant content.
```

**Insufficient Proof:**
```
Your challenge submission has been removed due to insufficient proof. Please include clear photos, GPS verification, and all required evidence as specified in the challenge requirements.
```

**Missing Flair:**
```
Your post has been removed for missing a required flair. Please add an appropriate flair from our available options and resubmit.
```

**Rule Violation:**
```
Your post/comment has been removed for violating community rule #{rule_number}. Please review our guidelines and ensure future contributions follow our community standards.
```

### **7. Welcome Message Template**

**For new member posts:**
```
🎉 **Welcome to r/MichiganSpots!** 

Thanks for joining Michigan's treasure hunting community! Here's how to get started:

1. **Read the Rules** - Check our community guidelines
2. **Download the App** - Get the Michigan Spots app for the full experience  
3. **Introduce Yourself** - Tell us what part of Michigan you're from!
4. **Start Exploring** - Check out active challenges and begin your adventure

Questions? Check our wiki or ask the community - we're here to help!

**Happy hunting! 🗺️✨**
```

## 📋 **Implementation Checklist**

- [ ] Set subreddit description (short & long)
- [ ] Create 8 community rules
- [ ] Set up 7 post flairs with colors
- [ ] Configure sidebar/community info
- [ ] Set up AutoModerator rules
- [ ] Create removal reason templates
- [ ] Set up welcome message
- [ ] Create initial pinned post
- [ ] Invite moderators
- [ ] Test all functionality

## 🚀 **Manual Steps Required**

1. Go to r/michiganspots mod tools
2. Copy/paste each section into appropriate Reddit settings
3. Test AutoModerator rules with test posts
4. Create initial community content
5. Invite trusted moderators
6. Launch announcement

This gives you everything formatted and ready to copy directly into Reddit's interface!
```