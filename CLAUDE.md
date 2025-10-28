- Do not give me .md files that contain instructions of things that you need me to do. I should not need to do much. Instead, always use best coding practices without leaking any secrets.
- always use the latest cli available.
- # Reddit API Client Cheat Sheet

## Setup

```javascript
import { Devvit } from '@devvit/public-api';

// Configure the Reddit API in your app
Devvit.configure({
  redditAPI: true,
});
```

## Core Usage Pattern

```javascript
// Use within capability handlers (Menu Actions, Triggers, Scheduled Jobs, etc.)
async (event, context) => {
  // Access the Reddit API client through context
  const { reddit } = context;
  
  // Use API methods
  const subreddit = await reddit.getSubredditInfoByName('askReddit');
  // ...
}
```

## Common Methods

### Posts

```javascript
// Get a post by ID
const post = await reddit.getPostById('t3_123abc');

// Get posts from a subreddit
const hotPosts = await reddit.getHotPosts({
  subredditName: 'askReddit',
  limit: 25
}).all();

// Submit a post
const newPost = await reddit.submitPost({
  subredditName: 'askReddit',
  title: 'Hello World',
  text: 'This is a test post'
});

// Submit a rich text post
import { RichTextBuilder } from '@devvit/public-api';

const richPost = await reddit.submitPost({
  subredditName: 'askReddit',
  title: 'Rich Text Post',
  richtext: new RichTextBuilder()
    .heading({ level: 1 }, (h) => h.rawText('Hello world'))
    .codeBlock({}, (cb) => cb.rawText('Code example'))
    .build()
});

// Crosspost
const crosspost = await reddit.crosspost({
  postId: 't3_123abc',
  subredditName: 'otherSubreddit',
  title: 'Interesting post from askReddit'
});

// Moderate posts
await reddit.approve('t3_123abc');
await reddit.remove('t3_123abc', false); // false = not spam
```

### Comments

```javascript
// Get a comment by ID
const comment = await reddit.getCommentById('t1_abc123');

// Get comments from a post
const comments = await reddit.getComments({
  postId: 't3_123abc',
  limit: 100
}).all();

// Submit a comment
const newComment = await reddit.submitComment({
  id: 't3_123abc', // post or comment ID to reply to
  text: 'This is my comment'
});

// Moderate comments
await reddit.approve('t1_abc123');
await reddit.remove('t1_abc123', false);
```

### Subreddits

```javascript
// Get current subreddit
const currentSubreddit = await reddit.getCurrentSubreddit();
const currentSubredditName = await reddit.getCurrentSubredditName();

// Get subreddit by name
const subreddit = await reddit.getSubredditInfoByName('askReddit');

// Get subreddit by ID
const subredditById = await reddit.getSubredditInfoById('t5_2qh1i');

// Subscribe/unsubscribe
await reddit.subscribeToCurrentSubreddit();
await reddit.unsubscribeFromCurrentSubreddit();
```

### Users

```javascript
// Get current user
const currentUser = await reddit.getCurrentUser();
const currentUsername = await reddit.getCurrentUsername();

// Get user by username
const user = await reddit.getUserByUsername('spez');

// Get user by ID
const userById = await reddit.getUserById('t2_1w72');

// Get user content
const userPosts = await reddit.getPostsByUser({
  username: 'spez',
  limit: 25
}).all();

const userComments = await reddit.getCommentsByUser({
  username: 'spez',
  limit: 25
}).all();
```

### Moderation

```javascript
// Ban a user
await reddit.banUser({
  username: 'problematicUser',
  subredditName: 'mySubreddit',
  duration: 7, // days, or 0 for permanent
  reason: 'Violation of rule #1',
  message: 'You have been banned for breaking rule #1'
});

// Unban a user
await reddit.unbanUser('problematicUser', 'mySubreddit');

// Get moderation log
const modLog = await reddit.getModerationLog({
  subredditName: 'mySubreddit',
  limit: 100
}).all();

// Get mod queue
const modQueue = await reddit.getModQueue({
  subredditName: 'mySubreddit'
}).all();

// Add removal reason
await reddit.addRemovalNote({
  id: 't3_123abc', // post or comment ID
  reason: 'This violates our rules'
});
```

### Flair

```javascript
// Get flair templates
const postFlairs = await reddit.getPostFlairTemplates('mySubreddit');
const userFlairs = await reddit.getUserFlairTemplates('mySubreddit');

// Set post flair
await reddit.setPostFlair({
  subredditName: 'mySubreddit',
  postId: 't3_123abc',
  flairTemplateId: 'abc123',
  text: 'Custom Flair Text'
});

// Set user flair
await reddit.setUserFlair({
  subredditName: 'mySubreddit',
  username: 'someUser',
  flairTemplateId: 'def456',
  text: 'Custom User Flair'
});
```

### Wiki

```javascript
// Get wiki pages
const wikiPages = await reddit.getWikiPages('mySubreddit');

// Get wiki page
const wikiPage = await reddit.getWikiPage('mySubreddit', 'index');

// Create/update wiki page
await reddit.updateWikiPage({
  subredditName: 'mySubreddit',
  page: 'newpage',
  content: 'This is the content of the wiki page',
  reason: 'Initial creation'
});
```

### Messages

```javascript
// Send private message
await reddit.sendPrivateMessage({
  to: 'username',
  subject: 'Hello',
  text: 'This is a message'
});

// Send message as subreddit
await reddit.sendPrivateMessageAsSubreddit({
  to: 'username',
  subject: 'Notice from r/mySubreddit',
  text: 'This is a message from the mod team',
  subredditName: 'mySubreddit'
});
```

## Common Patterns

### Pagination with Listings

```javascript
// Get all items (automatically handles pagination)
const allPosts = await reddit.getHotPosts({
  subredditName: 'askReddit',
  limit: 100
}).all();

// Manual pagination
const listing = reddit.getHotPosts({
  subredditName: 'askReddit',
  pageSize: 25
});

let page1 = await listing.fetchNext();
let page2 = await listing.fetchNext();
```

### Error Handling

```javascript
try {
  const post = await reddit.getPostById('t3_123abc');
  // Process post
} catch (error) {
  console.error('Error fetching post:', error);
}
```