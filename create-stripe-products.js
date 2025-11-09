// Create Stripe products for Directory tiers using secret from Cloudflare
import Stripe from 'stripe';

// Get the secret key from Cloudflare secrets via environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createDirectoryProducts() {
  try {
    console.log('Creating GROWTH product...');
    const growthProduct = await stripe.products.create({
      name: 'Michigan Spots Directory - GROWTH',
      description: 'Featured business listing with 60% search ranking boost and weekly analytics',
      metadata: {
        tier: 'growth',
        product_type: 'directory_advertising'
      }
    });

    console.log('Created GROWTH product:', growthProduct.id);

    const growthPrice = await stripe.prices.create({
      product: growthProduct.id,
      unit_amount: 9900,
      currency: 'usd',
      recurring: {
        interval: 'month'
      }
    });

    console.log('Created GROWTH price:', growthPrice.id);
    console.log('');

    console.log('Creating PRO product...');
    const proProduct = await stripe.products.create({
      name: 'Michigan Spots Directory - PRO',
      description: 'Full AI intelligence suite with API access and dedicated support',
      metadata: {
        tier: 'pro',
        product_type: 'directory_advertising'
      }
    });

    console.log('Created PRO product:', proProduct.id);

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 19900,
      currency: 'usd',
      recurring: {
        interval: 'month'
      }
    });

    console.log('Created PRO price:', proPrice.id);
    console.log('');

    console.log('✅ All products created successfully!');
    console.log('');
    console.log('Update wrangler.toml with these price IDs:');
    console.log(`STRIPE_PRICE_DIRECTORY_GROWTH_MONTHLY = "${growthPrice.id}"`);
    console.log(`STRIPE_PRICE_DIRECTORY_PRO_MONTHLY = "${proPrice.id}"`);

  } catch (error) {
    console.error('Error creating products:', error.message);
    process.exit(1);
  }
}

createDirectoryProducts();
