# Amazon Affiliate Integration Guide

Your Amazon Associates account (cozyartz05-20) is now integrated into Michigan Spots!

## ✅ What's Been Implemented

### 1. **Core Components**
- `AmazonAffiliateLink.tsx` - Simple link component with auto-tracking
- `AmazonProductCard.tsx` - Rich product display cards
- `AffiliateDisclosure.tsx` - FTC-compliant disclosure notices
- `ProductRecommendations.tsx` - Product grid display

### 2. **Product Database**
- 15+ Michigan-themed products in `src/data/affiliateProducts.ts`
- Categories: Travel Guides, Outdoor Gear, Photography, Camping, Maps, Winter Gear
- Helper functions to get products by category, tag, or spot type

### 3. **Pages Created**
- `/gear` - Dedicated gear & resources page showcasing affiliate products
- Footer updated with affiliate disclosure

### 4. **Legal Compliance**
- FTC disclosure in footer: ✅
- Banner disclosure for product pages: ✅
- Inline disclosure for blog posts: ✅

---

## 📝 How to Use in Blog Posts

### Example 1: Simple Affiliate Link

```tsx
import { AmazonAffiliateLink } from '../../components/AmazonAffiliateLink';

<AmazonAffiliateLink
  asin="B08KGLVH6L"
  text="Moon Michigan Travel Guide"
  showIcon={true}
/>
```

### Example 2: Product Card

```tsx
import { AmazonProductCard } from '../../components/AmazonAffiliateLink';

<AmazonProductCard
  asin="B08RNJW7T9"
  title="Garmin eTrex GPS Navigator"
  description="Perfect for geocaching and exploring Michigan trails"
  category="GPS & Navigation"
  price="$129.99"
/>
```

### Example 3: Product Grid

```tsx
import { ProductRecommendations } from '../../components/ProductRecommendations';
import { getProductsByTag } from '../../data/affiliateProducts';

const hikingGear = getProductsByTag('hiking');

<ProductRecommendations
  products={hikingGear}
  title="Essential Hiking Gear"
  description="Gear up for Michigan's beautiful trails"
  client:load
/>
```

---

## 🎯 Strategic Placement Ideas

### Blog Post Examples

**"Top 10 Hiking Trails in Michigan"**
- Add: Hiking boots, backpack, GPS, water bottle
- Use: `getProductsByTag('hiking')`

**"Best Beaches on Lake Michigan"**
- Add: Beach blanket, cooler, sunscreen, water toys
- Use: `getProductsByTag('beach')`

**"Geocaching Guide for Beginners"**
- Add: GPS device, waterproof container, logbook
- Use: `getProductsByTag('geocaching')`

**"Winter Adventures in the UP"**
- Add: Snowshoes, winter jacket, hand warmers
- Use: `getProductsByTag('winter')`

### Spot Detail Pages

You can add contextual product recommendations based on spot type:

```tsx
import { getProductsForSpotType } from '../data/affiliateProducts';

// On a hiking trail spot page
const products = getProductsForSpotType('hiking');
```

---

## 💰 Adding New Products

Edit `src/data/affiliateProducts.ts`:

```typescript
{
  asin: 'PRODUCT_ASIN',  // Found in Amazon URL
  title: 'Product Name',
  description: 'Why Michigan explorers need this',
  category: 'Category Name',
  tags: ['hiking', 'outdoor', 'summer'],
  imageUrl: 'optional-image-url',
}
```

### Finding ASINs

1. Go to the product page on Amazon
2. Look in the URL: `amazon.com/dp/B08KGLVH6L` ← This is the ASIN
3. Or scroll to "Product Details" section

---

## 📊 Where Affiliate Links Appear

### Current Pages
- ✅ `/gear` - Main gear showcase page
- ✅ Footer - Disclosure notice on every page

### Recommended Future Additions
- Blog posts about specific activities (hiking, camping, etc.)
- Spot detail pages (contextual recommendations)
- Challenge pages (gear needed for challenges)
- Email newsletters
- Partner spotlight pages

---

## 🔒 Legal & Compliance

### FTC Disclosure Requirements
All affiliate links include:
- `rel="sponsored"` attribute
- Clear disclosure text
- Visible placement

### Three Disclosure Variants

**Banner (use on product-heavy pages):**
```tsx
<AffiliateDisclosure variant="banner" />
```

**Inline (use in blog content):**
```tsx
<AffiliateDisclosure variant="inline" />
```

**Footer (automatic on all pages):**
```tsx
<AffiliateDisclosure variant="footer" />
```

---

## 📈 Performance Optimization

### Link Format
All links use Amazon's standard format:
```
https://www.amazon.com/dp/[ASIN]?tag=cozyartz05-20
```

### SEO Best Practices
- Links include `rel="noopener noreferrer sponsored"`
- Products are relevant to Michigan exploration
- Natural integration with content

---

## 🚀 Next Steps

1. **Add Products**: Expand `affiliateProducts.ts` with more Michigan-specific items
2. **Create Blog Posts**: Write content featuring your recommended products
3. **Seasonal Updates**: Rotate products based on Michigan seasons
4. **Analytics**: Track which products perform best
5. **Partner Integration**: Feature partner businesses alongside Amazon products

---

## 💡 Content Ideas

### Blog Posts with High Affiliate Potential
- "Ultimate Michigan Road Trip Packing List"
- "Beginner's Guide to Michigan Geocaching"
- "Photography Tips for Michigan Landscapes"
- "Winter Camping in Michigan: Essential Gear"
- "Family-Friendly Hiking Trails (and What to Bring)"
- "Michigan Beach Day Essentials"
- "Exploring Michigan's Waterfalls: Gear Guide"

### Seasonal Rotations
- **Spring**: Hiking boots, rain gear, camping equipment
- **Summer**: Beach gear, water bottles, sunscreen
- **Fall**: Photography equipment, leaf-peeping guides
- **Winter**: Snowshoes, winter camping, ice fishing

---

## 📞 Support

Questions about Amazon Associates:
- Amazon Associates Dashboard: https://affiliate-program.amazon.com
- Your Tracking ID: `cozyartz05-20`

Questions about implementation:
- Review component files in `/src/components/`
- Check product data in `/src/data/affiliateProducts.ts`
- See live example at `/gear`

---

## ⚠️ Important Notes

1. **Always Disclose**: FTC requires clear disclosure of affiliate relationships
2. **Relevant Products**: Only recommend products you'd genuinely use in Michigan
3. **Update Regularly**: Keep product listings current and relevant
4. **Test Links**: Verify affiliate links work before publishing
5. **Track Performance**: Monitor which products resonate with your audience

---

**Your affiliate integration is live and ready to generate revenue!** 🎉

Visit `/gear` to see it in action, or start integrating products into your blog posts.
