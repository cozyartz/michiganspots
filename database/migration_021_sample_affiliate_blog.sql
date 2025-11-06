-- Add sample blog post showcasing affiliate integration
-- This demonstrates how to create blog content with Amazon affiliate products

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  author_name,
  author_email,
  category,
  tags,
  status,
  published_at,
  created_at,
  updated_at,
  view_count
) VALUES (
  'Essential Gear for Your First Michigan Treasure Hunt',
  'essential-gear-michigan-treasure-hunt',
  'Planning your first Michigan Spots adventure? Here''s everything you need to make it successful, from GPS devices to weather-ready clothing.',
  '<div class="prose max-w-none">
    <p class="lead">Ready to start your Michigan Spots adventure? Whether you''re geocaching in the Upper Peninsula or exploring hidden beaches along Lake Michigan, having the right gear makes all the difference.</p>

    <h2>Navigation Essentials</h2>
    <p>First things first: you need reliable navigation. While your phone works great, having a dedicated GPS device can be a game-changer, especially in areas with spotty cell coverage.</p>

    <div class="my-6">
      <!-- Use AmazonProductCard component here -->
      <p class="font-semibold">Recommended: <a href="https://www.amazon.com/dp/B08RNJW7T9?tag=cozyartz05-20" rel="sponsored" class="text-lakes-blue hover:text-copper-orange">Garmin eTrex GPS Navigator</a> - Perfect for geocaching and trail navigation.</p>
    </div>

    <h2>Stay Hydrated</h2>
    <p>Michigan summers can be hot and humid. A quality hydration pack keeps you refreshed without having to constantly stop and dig through your backpack.</p>

    <div class="my-6">
      <p class="font-semibold">Recommended: <a href="https://www.amazon.com/dp/B07PXQXQMM?tag=cozyartz05-20" rel="sponsored" class="text-lakes-blue hover:text-copper-orange">CamelBak Hydration Pack</a> - Hands-free water storage for long hikes.</p>
    </div>

    <h2>Weather-Ready Clothing</h2>
    <p>Anyone who lives in Michigan knows: if you don''t like the weather, wait five minutes. A lightweight, packable rain jacket is essential year-round.</p>

    <div class="my-6">
      <p class="font-semibold">Recommended: <a href="https://www.amazon.com/dp/B00H192IPE?tag=cozyartz05-20" rel="sponsored" class="text-lakes-blue hover:text-copper-orange">Columbia Rain Jacket</a> - Weather-resistant and packable.</p>
    </div>

    <h2>Capture Your Adventures</h2>
    <p>You''ll want to document your discoveries! While smartphone cameras are excellent, a simple lens kit can dramatically improve your photos for Michigan Spots submissions.</p>

    <div class="my-6">
      <p class="font-semibold">Recommended: <a href="https://www.amazon.com/dp/B07QD6HQ4V?tag=cozyartz05-20" rel="sponsored" class="text-lakes-blue hover:text-copper-orange">Smartphone Camera Lens Kit</a> - Professional-quality mobile photography.</p>
    </div>

    <h2>Don''t Forget Your Guide</h2>
    <p>Even with GPS, having a comprehensive Michigan travel guide helps you discover spots you might otherwise miss. Plus, it works without batteries!</p>

    <div class="my-6">
      <p class="font-semibold">Recommended: <a href="https://www.amazon.com/dp/B08KGLVH6L?tag=cozyartz05-20" rel="sponsored" class="text-lakes-blue hover:text-copper-orange">Moon Michigan: Explore the Great Lakes State</a> - The ultimate Michigan guide.</p>
    </div>

    <h2>Ready to Explore?</h2>
    <p>With the right gear, you''re ready to tackle any Michigan Spots challenge. Remember to check the weather, tell someone where you''re going, and most importantly - have fun exploring the Great Lakes State!</p>

    <p class="text-sm italic border-l-4 border-gold pl-4 py-2 bg-gold/5 mt-8">
      <strong>Note:</strong> Some links in this article are affiliate links. If you make a purchase through them, we may earn a small commission at no extra cost to you. This helps us keep Michigan Spots free and support local discovery.
    </p>
  </div>',
  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=600&fit=crop',
  'Michigan Spots Team',
  'admin@michiganspots.com',
  'Guides',
  '["gear", "beginner", "hiking", "outdoor", "tips"]',
  'published',
  datetime('now'),
  datetime('now'),
  datetime('now'),
  0
);
