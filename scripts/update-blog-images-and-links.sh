#!/bin/bash

# Update Detroit post with internal links
sed -i '' 's|<p class="lead">Detroit isn'"'"'t just back—it'"'"'s absolutely thriving.|<p class="lead">Detroit isn'"'"'t just back—it'"'"'s absolutely thriving. Discover the Motor City with <a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a> and experience why Detroit is one of America'"'"'s most exciting comeback stories.|g' src/content/blog/detroit-metro-weekend-guide-november-21-23-2025.mdx

# Update Winter Adventure Guide image
sed -i '' 's|featuredImage: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=1200&h=600&fit=crop"|featuredImage: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=600&fit=crop"|g' src/content/blog/ultimate-michigan-winter-adventure-guide-december-2025.mdx
sed -i '' 's|featuredImageAlt: "Ultimate Michigan Winter Adventure Guide: Best Snow Activities December 2025"|featuredImageAlt: "Snowy forest trail in Michigan'"'"'s Upper Peninsula"|g' src/content/blog/ultimate-michigan-winter-adventure-guide-december-2025.mdx

# Update Photography Locations image
sed -i '' 's|featuredImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop"|featuredImage: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=600&fit=crop"|g' src/content/blog/michigan-most-photogenic-locations-photography-guide.mdx
sed -i '' 's|featuredImageAlt: "Michigan'"'"'s Most Photogenic Locations.*"|featuredImageAlt: "Michigan lighthouse on Lake Michigan shoreline at golden hour"|g' src/content/blog/michigan-most-photogenic-locations-photography-guide.mdx

# Update Family Adventures image
sed -i '' 's|featuredImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=600&fit=crop"|featuredImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop"|g' src/content/blog/top-10-family-friendly-michigan-adventures.mdx
sed -i '' 's|featuredImageAlt: "Top 10 Family-Friendly Michigan Adventures.*"|featuredImageAlt: "Family enjoying a sunny day on a pristine Michigan beach"|g' src/content/blog/top-10-family-friendly-michigan-adventures.mdx

# Update Essential Gear image
sed -i '' 's|featuredImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=600&fit=crop"|featuredImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop"|g' src/content/blog/essential-gear-michigan-treasure-hunt.mdx
sed -i '' 's|featuredImageAlt: "Essential Gear for Your First Michigan Treasure Hunt"|featuredImageAlt: "Hiking gear and backpack ready for Michigan outdoor adventure"|g' src/content/blog/essential-gear-michigan-treasure-hunt.mdx

echo "✅ Images and links updated successfully!"
