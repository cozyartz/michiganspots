# Michigan Spots - Discount Coupon System

## 🎟️ Available Discount Coupons for Sales Reps

### Yearly Partnership Discounts

**FOUNDERS50**
- **Discount:** 50% OFF
- **Applies To:** Yearly plans ONLY
- **Best For:** Closing big deals, early adopters, founders
- **Example:** $999 Spot Partner Year → $500 (save $499!)

**YEARLY30**
- **Discount:** 30% OFF
- **Applies To:** Yearly plans ONLY
- **Best For:** Standard yearly discount, less aggressive
- **Example:** $999 Spot Partner Year → $699 (save $300)

### Web/Dev Services Discounts

**WEBDEV50**
- **Discount:** 50% OFF
- **Applies To:** Web & Development Services ONLY
- **Best For:** Upselling services with partnership
- **Example:** $999 E-Commerce → $500 (save $499!)

**WEBDEV30**
- **Discount:** 30% OFF
- **Applies To:** Web & Development Services ONLY
- **Best For:** Adding services to existing partnerships
- **Example:** $799 Custom Dashboard → $559 (save $240)

---

## 💰 Strategic Discount Usage

### When to Use FOUNDERS50 (50% Off Yearly)

✅ **Use When:**
- Customer is on the fence about yearly
- It's a large business (will refer others)
- First customer at a new event/location
- Customer could become a testimonial
- Competing against another offer
- High-value long-term relationship potential

❌ **Don't Use When:**
- Customer is already ready to buy
- It's a small purchase (diminishing returns)
- You haven't pitched value first
- Customer asks for discount before you offer

### When to Use YEARLY30 (30% Off Yearly)

✅ **Use When:**
- Customer needs a nudge but not desperate
- Mid-sized business
- Buying multiple tiers (upsell opportunity)
- Standard promotion at events
- Building momentum (first few sales of the day)

### When to Use WEBDEV50/30 (Services Discount)

✅ **Use When:**
- Customer already bought partnership (upsell)
- Customer mentions needing website work
- Bundling: Partnership + Services together
- Customer has budget for services
- Adding services increases total deal value

---

## 📊 Pricing Examples with Coupons

### Example 1: Founders Special - Maximum Savings
**Scenario:** New restaurant, wants full year + landing page

| Item | Regular | With Coupon | Savings |
|------|---------|-------------|---------|
| Spot Partner (Yearly) | $999 | **$500** (FOUNDERS50) | $499 |
| Landing Page | $499 | **$250** (WEBDEV50) | $249 |
| **TOTAL** | **$1,498** | **$750** | **$748** |

**Sales Pitch:** "As a founding partner, I can offer you 50% off everything today - that's $750 total instead of $1,498. Lock in this rate for the entire year."

### Example 2: Standard Yearly Deal
**Scenario:** Established business, wants Featured Partner

| Item | Regular | With Coupon | Savings |
|------|---------|-------------|---------|
| Featured Partner (Yearly) | $2,399 | **$1,679** (YEARLY30) | $720 |
| **TOTAL** | **$2,399** | **$1,679** | **$720** |

**Sales Pitch:** "I can give you 30% off the yearly rate today - that's $1,679 instead of $2,399, saving you $720."

### Example 3: Service Upsell
**Scenario:** Customer just bought quarterly, mentions needing e-commerce

| Item | Regular | With Coupon | Savings |
|------|---------|-------------|---------|
| E-Commerce Integration | $999 | **$699** (WEBDEV30) | $300 |
| **TOTAL** | **$999** | **$699** | **$300** |

**Sales Pitch:** "Since you just became a partner, I can add e-commerce integration for 30% off - only $699 instead of $999."

---

## 🎯 Sales Script with Coupons

### Opening (No Coupon Yet)
"Michigan Spots helps businesses engage customers with challenges. We have tiers from $99/month to $12,999/year depending on your needs."

### Middle (After Interest, Before Close)
**If they hesitate on yearly:**
"I can offer a special discount today if you commit to the full year - would that help?"

**If they say yes:**
"Perfect! I can give you [30% or 50%] off the yearly rate with code [YEARLY30 or FOUNDERS50]."

### Close (With Coupon)
"So instead of $[REGULAR], with the [COUPON] code, your total is $[DISCOUNTED]. Let's get you signed up!"

---

## 🔧 How to Apply Coupons (Technical)

### On iPad In-Person Signup:

1. Customer selects tier and duration
2. **NEW:** Customer selects optional web/dev services
3. **NEW:** Rep enters coupon code in "Discount Code" field
4. System validates coupon in real-time
5. Shows: Original Price → Discount → Final Price
6. Customer signs agreement with final price shown
7. Rep processes final (discounted) amount via PayPal Zettle

### Coupon Validation Rules:

- ✅ Must be active
- ✅ Must not be expired
- ✅ Must not exceed max uses (if set)
- ✅ Must meet minimum purchase (if set)
- ✅ Yearly coupons only work on yearly plans
- ✅ Service coupons only work on services

---

## 📋 Web/Dev Services Available

### Standard Services (All can use WEBDEV30 or WEBDEV50)

**Landing Page** - $499
- Single page website
- Mobile responsive
- Contact form
- Basic SEO

**E-Commerce Integration** - $999
- Add online store
- Product catalog
- Payment processing
- Inventory management

**Custom Dashboard** - $799
- Analytics dashboard
- Custom metrics
- Real-time data
- Export tools

**API Integration** - $1,299
- Connect third-party services
- Custom integrations
- Webhook setup
- Documentation

---

## 💡 Upselling Strategy

### Maximize Revenue with Coupons

**BAD:** Give discount immediately
**GOOD:** Pitch value first, then discount to close

**BAD:** Offer 50% off on everything
**GOOD:** Offer 50% off strategically on big deals

**BAD:** Discount without increasing deal size
**GOOD:** Use discount to upsell (monthly → yearly, no services → add services)

### Example Upsell Flow:

1. Customer wants Spot Partner Monthly ($99)
2. You pitch: "Most businesses save money going yearly"
3. Customer: "That's a lot upfront"
4. You: "What if I could get you 50% off the yearly rate?"
5. Customer: "How much?"
6. You: "$500 instead of $999 - that's like paying for 5 months and getting 7 free"
7. Customer: "Plus I need a landing page"
8. You: "I can do 50% off that too - $250 instead of $499"
9. **CLOSE:** $750 total (was $99/month = $1,188/year normally, you got $750 upfront!)

---

## 📊 Coupon Tracking

### Admin Can See:
- Which coupons are used most
- Revenue impact of discounts
- Which reps use which coupons
- Total savings given vs revenue generated

### Database Tracks:
- Coupon code used
- Original amount
- Discount amount
- Final amount
- Who used it (rep name)
- When used
- Customer info

---

## 🚨 Important Rules

### Do NOT:
- ❌ Give coupons before pitching value
- ❌ Stack coupons (one coupon per transaction)
- ❌ Apply service coupons to partnerships
- ❌ Apply yearly coupons to monthly/quarterly
- ❌ Promise coupons that don't exist

### DO:
- ✅ Use coupons to close deals
- ✅ Upsell with coupons (monthly → yearly)
- ✅ Bundle services with partnerships
- ✅ Track all coupon usage for admin
- ✅ Emphasize total savings to customer

---

## 🎁 Bonus Tips

### Creating Urgency:
"This founders rate is only available for our first 50 partners"
"The 50% off code expires at the end of this event"
"I can only offer this discount today"

### Handling Price Objections:
Customer: "That's expensive"
You: "What's your budget?"
Customer: "$500"
You: "Perfect! With the FOUNDERS50 code, the yearly Spot Partner is exactly $500 - let me show you what you get..."

### Maximizing Total Sale:
- Always mention services AFTER they commit to partnership
- Bundle discounts: "Since you're getting 50% off the partnership, I can do 50% off the landing page too"
- Emphasize total savings: "You're saving $748 total today"

---

## 📞 Questions?

**Can I create my own coupons?**
No - only admin can create coupons. Use the pre-approved codes above.

**What if a customer has a coupon I don't recognize?**
The system will validate it. If it's invalid, it won't apply.

**Can I give bigger discounts?**
No - stick to the approved coupons. Escalate to manager for special cases.

**Do coupons expire?**
Check with admin. System tracks expiration automatically.

---

**Use coupons strategically to close deals and maximize revenue!**
