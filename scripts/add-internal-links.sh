#!/bin/bash

# Add internal links to Detroit post
sed -i '' 's|<h2>2. Eastern Market Saturday Shopping</h2>|<h2>2. Eastern Market Saturday Shopping</h2>|g' src/content/blog/detroit-metro-weekend-guide-november-21-23-2025.mdx
sed -i '' 's|Eastern Market comes alive every Saturday|Eastern Market comes alive every Saturday. <a href="/about" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots partners</a> with local vendors to bring you authentic Detroit experiences|g' src/content/blog/detroit-metro-weekend-guide-november-21-23-2025.mdx

# Add links to Winter Adventure post
sed -i '' 's|<p class="lead">Forget hibernating!|<p class="lead">Forget hibernating! Join the <a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a> community and discover why|g' src/content/blog/ultimate-michigan-winter-adventure-guide-december-2025.mdx
sed -i '' 's|Experience one of America'"'"'s most stunning landscapes|Experience one of America'"'"'s most stunning landscapes at Pictured Rocks. <a href="/#challenges" class="text-lakes-blue hover:text-copper-orange font-semibold">Complete our winter hiking challenge</a> to earn exclusive badges and|g' src/content/blog/ultimate-michigan-winter-adventure-guide-december-2025.mdx

# Add links to Photography post
sed -i '' 's|<p class="lead">Michigan is a photographer'"'"'s paradise.|<p class="lead">Michigan is a photographer'"'"'s paradise. <a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a> has curated the ultimate guide to|g' src/content/blog/michigan-most-photogenic-locations-photography-guide.mdx
sed -i '' 's|Miners Castle, Chapel Rock, and Spray Falls|Miners Castle, Chapel Rock, and Spray Falls. <a href="/#signup" class="text-lakes-blue hover:text-copper-orange font-semibold">Join Michigan Spots</a> to share your best shots and|g' src/content/blog/michigan-most-photogenic-locations-photography-guide.mdx

# Add links to Family Adventures post
sed -i '' 's|<p class="lead">Planning a Michigan family adventure?|<p class="lead">Planning a Michigan family adventure? <a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a> makes it easy to discover family-friendly locations.|g' src/content/blog/top-10-family-friendly-michigan-adventures.mdx
sed -i '' 's|Voted "Most Beautiful Place in America,"|Voted "Most Beautiful Place in America," Sleeping Bear Dunes is pure family magic. <a href="/about" class="text-lakes-blue hover:text-copper-orange font-semibold">Learn how Michigan Spots</a> helps families plan perfect|g' src/content/blog/top-10-family-friendly-michigan-adventures.mdx

# Add links to Essential Gear post
sed -i '' 's|<p class="lead">Ready to start your Michigan Spots adventure?|<p class="lead">Ready to start your <a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a> adventure?|g' src/content/blog/essential-gear-michigan-treasure-hunt.mdx
sed -i '' 's|you'"'"'re ready to tackle any Michigan Spots challenge|you'"'"'re ready to tackle any <a href="/#challenges" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots challenge</a>|g' src/content/blog/essential-gear-michigan-treasure-hunt.mdx

# Add links to Food Trail post
sed -i '' 's|<p class="lead">Michigan'"'"'s food scene is having a moment.|<p class="lead">Michigan'"'"'s food scene is having a moment. Explore with <a href="/" class="text-lakes-blue hover:text-copper-orange font-semibold">Michigan Spots</a> as we guide you through|g' src/content/blog/michigan-ultimate-foodie-trail-culinary-experiences.mdx
sed -i '' 's|Detroit'"'"'s comeback story is delicious.|Detroit'"'"'s comeback story is delicious. <a href="/about" class="text-lakes-blue hover:text-copper-orange font-semibold">Discover more Michigan businesses</a> on our platform.|g' src/content/blog/michigan-ultimate-foodie-trail-culinary-experiences.mdx

echo "✅ Internal backlinks added successfully!"
