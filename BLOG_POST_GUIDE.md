# How to Add New Blog Posts to Michigan Spots

This guide shows you how to create beautiful, on-brand blog posts that match the ultra-modern design system.

---

## Quick Start

1. Create a new `.mdx` file in `/src/content/blog/`
2. Add required frontmatter (see template below)
3. Write your content using the components and formatting guide
4. Save the file - it will automatically appear on the blog!

---

## File Naming Convention

Use lowercase with hyphens:
```
your-post-title-keyword-rich-slug.mdx
```

**Examples:**
- `ultimate-michigan-winter-adventure-guide-december-2025.mdx`
- `best-breweries-grand-rapids-beer-city-usa.mdx`
- `mackinac-island-day-trip-complete-guide.mdx`

---

## Frontmatter Template

Every blog post must start with this YAML frontmatter (between the `---` markers):

```yaml
---
title: "Your Compelling Title: Make It Click-Worthy"
excerpt: "A 1-2 sentence summary that appears in cards and social shares. Make it engaging and informative!"
publishedAt: 2025-11-07
status: "published"
category: "Adventure Guides"
tags: ["michigan", "outdoor", "hiking", "family-friendly"]
authorName: "Michigan Spots Team"
authorEmail: "admin@michiganspots.com"
featuredImage: "https://images.unsplash.com/photo-XXXXX?w=1200&h=600&fit=crop"
featuredImageAlt: "Descriptive alt text for accessibility"
hasAffiliateLinks: true
affiliateDisclosure: true
updatedAt: 2025-11-07
seoTitle: "Optional: Custom SEO title (60 chars max)"
seoDescription: "Optional: Custom meta description (160 chars max)"
keywords: ["keyword1", "keyword2", "keyword3"]
---
```

### Frontmatter Fields Explained

| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✅ | Post title (shown in hero and cards) |
| `excerpt` | ✅ | Short summary for cards and social |
| `publishedAt` | ✅ | Publication date (YYYY-MM-DD) |
| `status` | ✅ | `"published"` or `"draft"` |
| `category` | ✅ | Main category (see list below) |
| `tags` | ✅ | Array of tags for filtering |
| `authorName` | ✅ | Author name |
| `authorEmail` | ✅ | Author email |
| `featuredImage` | ✅ | URL to hero image (1200x600px) |
| `featuredImageAlt` | ✅ | Alt text for accessibility |
| `hasAffiliateLinks` | ⚪ | Set to `true` if post has affiliate links |
| `affiliateDisclosure` | ⚪ | Set to `true` to show disclosure box |
| `updatedAt` | ⚪ | Last update date |
| `seoTitle` | ⚪ | Custom SEO title |
| `seoDescription` | ⚪ | Custom meta description |
| `keywords` | ⚪ | SEO keywords array |

---

## Categories

Use one of these existing categories:

- **Adventure Guides** - Outdoor activities, hiking, camping
- **Weekend Guides** - City/regional weekend itineraries
- **Food & Drink** - Restaurants, breweries, culinary
- **Family Adventures** - Kid-friendly activities
- **Photography Guides** - Best photo locations
- **Seasonal Guides** - Winter, summer, fall activities

---

## Finding Michigan-Appropriate Images

### ✅ Good Image Sources

1. **Unsplash** - Search for:
   - "detroit skyline"
   - "michigan lake"
   - "great lakes"
   - "lighthouse michigan"
   - "forest midwest"

2. **Michigan-Specific Keywords:**
   - Pictured Rocks, Sleeping Bear Dunes
   - Mackinac Bridge, Mackinac Island
   - Detroit Renaissance Center
   - Grand Rapids, Ann Arbor
   - Upper Peninsula

### ❌ What to AVOID

- **Mountains** (we don't have those!)
- **Ocean scenes** (we have Great Lakes)
- **Non-Michigan landmarks**
- **Wrong season** (palm trees, desert, etc.)

### Image Specs

- **Dimensions:** 1200x600px minimum
- **Format:** JPG or WebP
- **Optimization:** Use Unsplash's `?w=1200&h=600&fit=crop` parameters
- **Alt Text:** Always descriptive for accessibility

---

## Content Structure

### Opening Paragraph (Lead)

Start with a `<p class="lead">` for an engaging hook:

```jsx
<p class="lead">
  Discover Michigan's hidden gems with <a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a> and experience the adventure of a lifetime. Here's your complete guide to...
</p>
```

### Section Headers (H2)

Use H2 for main sections with **numbered** items:

```markdown
## 1. Pictured Rocks National Lakeshore

## 2. Tahquamenon Falls State Park

## 3. Sleeping Bear Dunes
```

**Why numbered?** Creates visual hierarchy and makes content scannable.

### Subsections (H3, H4)

Use for supporting content:

```markdown
### What to Bring

#### Summer Essentials
```

---

## Using the New Components

### 1. ProTip Callouts

Use for helpful tips, warnings, or special info:

```jsx
<ProTip variant="tip" title="Local Secret">
  The best time to visit is early morning before the crowds arrive.
  You'll have the trails almost to yourself!
</ProTip>
```

**Variants:**
- `tip` - 💡 General tips (yellow/amber)
- `pro` - ⚡ Pro moves (orange/copper)
- `warning` - ⚠️ Important warnings (red/coral)
- `info` - ⭐ Did you know? (blue/cyan)

**Title is optional:**
```jsx
<ProTip variant="info">
  Content without a title works too!
</ProTip>
```

### 2. TL;DR Summary Box

Add at the top or bottom of long posts:

```jsx
<TLDRSummary readingTime={8}>
  **Quick Summary:**
  - Visit Pictured Rocks for stunning cliff views
  - Hike Tahquamenon Falls for waterfalls
  - Camp at Sleeping Bear Dunes for beaches
  - Book accommodations 3+ months ahead
</TLDRSummary>
```

### 3. Action Buttons

Create prominent CTAs for challenges, maps, or gear:

```jsx
<ActionButton
  variant="challenge"
  href="/#challenges"
  title="Join the Winter Challenge"
  description="Complete 5 winter hikes and earn exclusive badges!"
/>

<ActionButton
  variant="map"
  href="/#map"
  title="View on Interactive Map"
  description="See all locations with directions and GPS coordinates"
/>

<ActionButton
  variant="gear"
  href="/gear"
  title="Essential Gear Guide"
  description="Everything you need for a safe and comfortable adventure"
/>
```

**Variants:**
- `challenge` - Trophy icon, amber gradient
- `map` - Map icon, blue gradient
- `gear` - Package icon, orange gradient
- `custom` - Custom icon and colors

### 4. Section Cards

Highlight important content in styled boxes:

```jsx
<SectionCard
  variant="highlight"
  title="Weekend Itinerary"
  icon={<Calendar className="w-6 h-6" />}
>
  **Friday Evening:** Arrive and check in
  **Saturday:** Full day hiking
  **Sunday:** Morning exploration, afternoon departure
</SectionCard>
```

**Variants:**
- `default` - Clean white/gray
- `highlight` - Copper/gold gradient
- `accent` - Blue/cyan gradient
- `subtle` - Minimal styling

---

## Typography Best Practices

### Paragraphs

- Keep paragraphs **3-5 sentences** maximum
- Add a blank line between paragraphs
- Use **bold** for emphasis: `**important text**`
- Use *italics* for terms: `*pure Michigan*`

### Lists

**Unordered Lists:**
```markdown
- First item
- Second item
- Third item
```

**Ordered Lists:**
```markdown
1. First step
2. Second step
3. Third step
```

### Links

**Internal Links** (to Michigan Spots pages):
```jsx
<a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a>
<a href="/about" class="text-lakes-blue hover:text-copper-orange font-semibold">our partners</a>
<a href="/#challenges" class="text-lakes-blue hover:text-copper-orange font-semibold">join our challenges</a>
```

**External Links:**
```markdown
[External Site Name](https://example.com)
```

### Inline Images

```markdown
![Alt text for the image](https://images.unsplash.com/photo-XXXXX?w=1200&h=800&fit=crop)
```

Images automatically get:
- Rounded corners
- Shadow effects
- Hover animations
- Proper spacing

---

## Affiliate Links

If your post includes affiliate links, set these in frontmatter:

```yaml
hasAffiliateLinks: true
affiliateDisclosure: true
```

### Affiliate Link Format

Use styled boxes for product recommendations:

```jsx
<div class="bg-parchment-dark treasure-border border-2 rounded-lg p-5 my-6">
  <p class="font-semibold text-ink-primary mb-2">📚 Recommended Guide</p>
  <p class="text-sm text-ink-secondary mb-3">
    The <a href="https://www.amazon.com/dp/PRODUCTID?tag=cozyartz05-20"
           target="_blank"
           rel="noopener noreferrer sponsored"
           class="text-lakes-blue hover:text-copper-orange underline font-semibold">
      Product Name
    </a> is essential for this adventure. Features include...
  </p>
  <p class="text-xs text-ink-secondary italic">
    Pro tip: Additional helpful information about the product.
  </p>
</div>
```

**Important:** Always include:
- `target="_blank"` - Opens in new tab
- `rel="noopener noreferrer sponsored"` - Security and SEO
- Our Amazon tag: `tag=cozyartz05-20`

---

## Internal Linking for SEO

Add **3-5 internal links** per post to boost SEO:

### Key Pages to Link To:

1. **Homepage:** `<a href="/">`
2. **About:** `<a href="/about">`
3. **Challenges:** `<a href="/#challenges">`
4. **Map:** `<a href="/#map">`
5. **Signup:** `<a href="/#signup">`
6. **Other Posts:** `<a href="/blog/other-post-slug">`

### Internal Link Style:

```jsx
<a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a>
```

---

## Content Boxes & Callouts

### Standard Info Box (Gold):

```jsx
<div class="bg-gold/10 border-l-4 border-gold pl-4 py-3 my-6">
  <p class="text-sm font-semibold text-ink-primary mb-2">💡 Pro Tip</p>
  <p class="text-sm text-ink-secondary">
    Your helpful tip content here.
  </p>
</div>
```

### Gear Recommendation Box:

```jsx
<div class="bg-parchment-dark treasure-border border-2 rounded-lg p-5 my-6">
  <p class="font-semibold text-ink-primary mb-2">🎒 Essential Gear</p>
  <p class="text-sm text-ink-secondary mb-3">
    Recommendations with affiliate links...
  </p>
</div>
```

### Safety Warning Box:

```jsx
<div class="bg-sunset-red/10 border-l-4 border-sunset-red pl-4 py-3 my-6">
  <p class="text-sm font-semibold text-ink-primary mb-2">⚠️ Safety Alert</p>
  <p class="text-sm text-ink-secondary">
    Important safety information...
  </p>
</div>
```

---

## Complete Example Post

Here's a minimal complete example:

```mdx
---
title: "Best Waterfalls in Michigan's Upper Peninsula"
excerpt: "Discover 7 stunning waterfalls you can visit in a single weekend. From Tahquamenon's massive cascades to hidden gems."
publishedAt: 2025-11-10
status: "published"
category: "Adventure Guides"
tags: ["upper-peninsula", "waterfalls", "hiking", "photography"]
authorName: "Michigan Spots Team"
authorEmail: "admin@michiganspots.com"
featuredImage: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&h=600&fit=crop"
featuredImageAlt: "Tahquamenon Falls in Michigan's Upper Peninsula"
hasAffiliateLinks: false
affiliateDisclosure: false
---

<p class="lead">
  The Upper Peninsula is home to over 300 waterfalls. Explore these seven must-see cascades with <a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a> and witness nature's power firsthand.
</p>

## 1. Tahquamenon Falls: Michigan's Niagara

Michigan's largest waterfall drops 50 feet and spans 200 feet across. The amber-colored water, stained by tannins from cedar swamps, creates a truly unique sight.

<ProTip variant="tip" title="Best Viewing Time">
  Visit in spring (April-May) or after heavy rains for maximum flow.
  Winter offers stunning frozen formations!
</ProTip>

**How to Visit:**
- Location: Tahquamenon Falls State Park
- Parking: $9 Recreation Passport
- Trails: Paved accessible path to Upper Falls
- Distance: 0.5 miles from parking

## 2. Munising Falls: Pictured Rocks Gateway

A perfect introduction to the <a href="/#challenges" class="text-lakes-blue hover:text-copper-orange font-semibold">Pictured Rocks Challenge</a>. This 50-foot waterfall is just minutes from downtown Munising.

<ActionButton
  variant="challenge"
  href="/#challenges"
  title="Join the Waterfall Challenge"
  description="Visit all 7 falls and earn exclusive badges!"
/>

[Continue with remaining waterfalls...]

## Essential Gear for Waterfall Hunting

<div class="bg-parchment-dark treasure-border border-2 rounded-lg p-5 my-6">
  <p class="font-semibold text-ink-primary mb-2">📸 Photography Essentials</p>
  <p class="text-sm text-ink-secondary mb-3">
    Capture stunning waterfall shots with a quality tripod and ND filter.
    Check out our <a href="/photography-guide" class="text-lakes-blue hover:text-copper-orange underline">complete photography guide</a>.
  </p>
</div>

## Plan Your Waterfall Weekend

<TLDRSummary readingTime={6}>
  **Quick Itinerary:**
  - Day 1: Tahquamenon Falls + Munising Falls
  - Day 2: Pictured Rocks waterfalls
  - Day 3: Hidden gems near Marquette

  **Total Driving:** ~180 miles
  **Best Season:** May-June or September-October
</TLDRSummary>
```

---

## Checklist Before Publishing

- [ ] Frontmatter complete with all required fields
- [ ] Featured image is **Michigan-appropriate** (no mountains!)
- [ ] Image dimensions: 1200x600px minimum
- [ ] Alt text added for accessibility
- [ ] 3-5 internal links to Michigan Spots pages
- [ ] Lead paragraph with engaging hook
- [ ] Numbered H2 sections (if list-style content)
- [ ] Used at least 1-2 components (ProTip, ActionButton, etc.)
- [ ] Paragraphs are 3-5 sentences maximum
- [ ] No spelling/grammar errors
- [ ] Affiliate links (if any) properly formatted
- [ ] Tags include relevant Michigan keywords
- [ ] Category matches content type

---

## Testing Your Post

1. Save the file in `/src/content/blog/`
2. Dev server automatically picks it up
3. Visit `http://localhost:4321/blog`
4. Your post should appear in the grid
5. Click to view the full post
6. Test dark mode toggle
7. Check mobile responsiveness
8. Verify all links work

---

## Dark Mode Considerations

All text, components, and colors automatically adapt to dark mode! No special styling needed.

Test both modes:
- **Light Mode:** Default
- **Dark Mode:** Click toggle in top-right

---

## Need Help?

**Common Issues:**

1. **Post not appearing?**
   - Check `status: "published"` in frontmatter
   - Ensure file is saved in `/src/content/blog/`
   - Verify YAML syntax (no extra spaces)

2. **Image not loading?**
   - Verify Unsplash URL includes `?w=1200&h=600&fit=crop`
   - Check for typos in URL

3. **Component not rendering?**
   - Ensure you're using JSX syntax, not Markdown
   - Check for proper closing tags
   - Verify component import (they auto-import in MDX)

4. **Dark mode not working?**
   - Components automatically support dark mode
   - No additional styling needed

---

## Pro Tips for Great Posts

1. **Write for Scanners:** Use short paragraphs, bullet points, numbered lists
2. **Lead with Value:** Tell readers what they'll learn in the first paragraph
3. **Show, Don't Tell:** Include specific details, prices, distances
4. **Add Personality:** Use first-person plural ("we," "our")
5. **Include CTAs:** Guide readers to challenges, maps, signup
6. **Update Regularly:** Keep information current (prices, hours, seasons)
7. **Michigan First:** Always emphasize what makes Michigan unique
8. **Visual Hierarchy:** Use components to break up long text
9. **Mobile-First:** Most readers are on phones - keep it concise
10. **SEO Friendly:** Include location names, activities, and seasonal keywords

---

## Example Post Structure

```
1. Lead Paragraph (with Michigan Spots link)
2. TL;DR Summary (optional, for long posts)
3. Main Content (H2 sections)
   - ProTip callouts
   - Info boxes
   - Images
4. ActionButton CTAs
5. Gear/Affiliate Section (if applicable)
6. Conclusion with CTA
```

---

**Your posts will automatically inherit:**
- ✅ Immersive hero section with featured image
- ✅ Reading time calculation
- ✅ Table of contents sidebar
- ✅ Share buttons (Reddit, Twitter, Facebook, LinkedIn)
- ✅ Related posts grid
- ✅ Newsletter subscription box
- ✅ Back-to-top button
- ✅ Dark mode support
- ✅ Mobile-responsive design
- ✅ SEO structured data

---

**Now go create amazing Michigan content!** 🚀
