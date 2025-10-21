# r/MichiganSpots - Subreddit Setup Content

## **Subreddit Description (Short)**
Michigan's premier treasure hunting community! Discover hidden gems, complete interactive challenges, and support local businesses across the Great Lakes State. 🗺️✨

## **Subreddit Description (Long)**
Welcome to r/MichiganSpots - Michigan's most exciting treasure hunting community! Join thousands of explorers discovering hidden gems across the Great Lakes State through interactive challenges, mini-games, and local business partnerships. Whether you're hunting for the perfect coffee shop in Grand Rapids, exploring Pictured Rocks, or testing your Michigan knowledge in our trivia games, there's always an adventure waiting. Download our app, complete challenges, earn points, and connect with fellow Michigan enthusiasts. The real treasure is the communities we discover along the way! 🎯🏴‍☠️

## **Sidebar Content**

### 🎯 **Quick Start Guide**
1. Download the Michigan Spots app
2. Check active treasure hunt challenges  
3. Visit locations and submit proof
4. Play interactive mini-games
5. Earn points and climb the leaderboard!

### 🎮 **Available Games**
- 🔍 Spot the Difference
- 🔤 Michigan Word Search  
- 🧠 Michigan Trivia
- 🗺️ Virtual Treasure Hunt
- 🎨 Drawing Challenge

### 🏆 **Current Leaderboard**
*[This would be updated regularly]*
- 🥇 Monthly Champion: TBD
- 🎯 Challenge Master: TBD  
- 🎮 Game Legend: TBD

### 🏪 **Featured Partners**
*[Rotating list of local business partners]*
- Downtown Coffee Co.
- Local Bookstore
- Michigan Brewery Tours
- *[More partners added regularly]*

### 📱 **Official Links**
- 🌐 Website: michiganspots.com
- 📱 Download App: [App Store/Google Play links]
- 💬 Discord: [Discord invite link]
- 📧 Contact: hello@michiganspots.com

### 🗓️ **Upcoming Events**
- Monthly Meetup: Grand Rapids (Nov 15)
- Fall Colors Challenge: Statewide (Oct 1-31)
- Holiday Treasure Hunt: Detroit (Dec 10)

### 📋 **Post Flairs**
- 🎯 Challenge Complete
- 🎮 Game Discussion  
- 🏪 Business Spotlight
- 📍 Location Discovery
- 🤝 Community Event
- ❓ Help/Question
- 📢 Announcement

### 🚨 **Need Help?**
- Read our [Community Guidelines]
- Check the [FAQ Wiki]
- Message the moderators
- Join our Discord for real-time help

---

## **Welcome Message (New Members)**

🎉 **Welcome to r/MichiganSpots!** 

Thanks for joining Michigan's treasure hunting community! Here's how to get started:

1. **Read the Rules** - Check our community guidelines
2. **Download the App** - Get the Michigan Spots app for the full experience  
3. **Introduce Yourself** - Tell us what part of Michigan you're from!
4. **Start Exploring** - Check out active challenges and begin your adventure

Questions? Check our wiki or ask the community - we're here to help!

**Happy hunting! 🗺️✨**

---

## **Removal Reasons (For Moderators)**

### **Off-Topic Content**
Your post has been removed because it doesn't relate to Michigan locations, businesses, or treasure hunt activities. Please review our community guidelines and repost with Michigan-relevant content.

### **Insufficient Proof**
Your challenge submission has been removed due to insufficient proof. Please include clear photos, GPS verification, and all required evidence as specified in the challenge requirements.

### **Spam/Low Effort**
Your post has been removed for being spam or low-effort content. Please contribute meaningful content that adds value to our treasure hunting community.

### **Rule Violation**
Your post/comment has been removed for violating community rule #[X]. Please review our guidelines and ensure future contributions follow our community standards.

---

## **Moderator Guidelines**

### **Daily Tasks**
- Review reported content
- Approve/remove challenge submissions
- Update leaderboards
- Respond to modmail
- Monitor for spam/trolls

### **Weekly Tasks**  
- Update featured partners
- Plan community events
- Review and update wiki
- Coordinate with business partners
- Analyze community metrics

### **Monthly Tasks**
- Crown monthly champions
- Plan special events
- Review and update guidelines
- Conduct partner outreach
- Community feedback surveys

---

## **AutoModerator Rules**

### **Flair Enforcement**
```yaml
# Require post flairs
type: submission
~flair_css_class: [challenge-complete, game-discussion, business-spotlight, location-discovery, community-event, help-question, announcement]
action: remove
comment: |
    Your post has been removed because it doesn't have a required flair. Please add an appropriate flair and resubmit.
    
    Available flairs:
    - 🎯 Challenge Complete
    - 🎮 Game Discussion  
    - 🏪 Business Spotlight
    - 📍 Location Discovery
    - 🤝 Community Event
    - ❓ Help/Question
    - 📢 Announcement
```

### **Title Format Check**
```yaml
# Enforce title formatting for challenge posts
type: submission
flair_css_class: "challenge-complete"
~title (regex): '\[Challenge Complete\].*- .*, MI'
action: remove
comment: |
    Challenge completion posts must follow the format:
    [Challenge Complete] Brief Description - City, MI
    
    Example: [Challenge Complete] Downtown Coffee Hunt - Grand Rapids, MI
```

### **New User Welcome**
```yaml
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
```