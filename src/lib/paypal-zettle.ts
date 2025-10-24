/**
 * PayPal Zettle API Integration
 * READ-ONLY service for payment verification
 * Products are managed via CSV upload to PayPal Zettle dashboard
 */

const ZETTLE_API_BASE = 'https://purchase.izettle.com';
const ZETTLE_PRODUCT_API = 'https://products.izettle.com';

export interface ZettlePurchase {
  purchaseUUID: string;
  amount: number;
  timestamp: string;
  productName?: string;
  userDisplayName: string;
}

/**
 * Verify a PayPal Zettle transaction exists
 * @param apiKey PayPal Zettle JWT token
 * @param transactionId Transaction UUID from PayPal receipt
 * @returns Transaction details if found
 */
export async function verifyZettleTransaction(
  apiKey: string,
  transactionId: string
): Promise<ZettlePurchase | null> {
  try {
    const response = await fetch(`${ZETTLE_API_BASE}/purchases/v2/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Zettle API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying Zettle transaction:', error);
    return null;
  }
}

/**
 * Get recent purchases from PayPal Zettle
 * @param apiKey PayPal Zettle JWT token
 * @param limit Number of purchases to retrieve
 * @returns Array of purchases
 */
export async function getRecentPurchases(
  apiKey: string,
  limit: number = 10
): Promise<ZettlePurchase[]> {
  try {
    const response = await fetch(`${ZETTLE_API_BASE}/purchases/v2?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Zettle API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.purchases || [];
  } catch (error) {
    console.error('Error fetching Zettle purchases:', error);
    return [];
  }
}

/**
 * List all products in PayPal Zettle (for verification, not creation)
 * @param apiKey PayPal Zettle JWT token
 * @returns Array of products
 */
export async function listZettleProducts(apiKey: string) {
  try {
    const response = await fetch(`${ZETTLE_PRODUCT_API}/organizations/self/products/v2`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Zettle Product API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching Zettle products:', error);
    return [];
  }
}
