/**
 * Partner Worker Integration
 * Calls the cloudflare-partner-system worker to onboard partners
 */

const WORKER_URL = 'https://michiganspots-partner-system.andrea-b56.workers.dev';

export interface PartnerOnboardRequest {
  businessName: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  category: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  amenities: string[];
  specialOffers?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
}

export interface WorkerOnboardResponse {
  success: boolean;
  partnerId: string;
  urls: {
    partnerPage: string;
    qrCode: string;
    dashboard: string;
    api: string;
  };
  qrCode: {
    svg: string;
    png: string;
    downloadUrl: string;
  };
  worker: {
    name: string;
    url: string;
    status: string;
  };
  message: string;
}

/**
 * Call the partner worker to onboard a new partner
 */
export async function onboardPartnerToWorker(
  partnerData: PartnerOnboardRequest
): Promise<WorkerOnboardResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/api/partners/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(partnerData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Worker onboard failed: ${error}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Worker onboard failed');
    }

    return result;
  } catch (error) {
    console.error('Partner worker onboard error:', error);
    throw error;
  }
}

/**
 * Update partner data in worker
 */
export async function updatePartnerInWorker(
  partnerId: string,
  updates: Partial<PartnerOnboardRequest>
): Promise<boolean> {
  try {
    const response = await fetch(`${WORKER_URL}/api/partners/${partnerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      console.error('Worker update failed:', await response.text());
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Partner worker update error:', error);
    return false;
  }
}

/**
 * Get partner analytics from worker
 */
export async function getPartnerAnalyticsFromWorker(
  partnerId: string,
  timeframe: string = '30d'
): Promise<any> {
  try {
    const response = await fetch(
      `${WORKER_URL}/api/partners/${partnerId}/analytics?timeframe=${timeframe}`
    );

    if (!response.ok) {
      throw new Error('Failed to get analytics from worker');
    }

    const result = await response.json();
    return result.analytics;
  } catch (error) {
    console.error('Partner worker analytics error:', error);
    return null;
  }
}

/**
 * Helper to format partner data from signup to worker format
 */
export function formatPartnerDataForWorker(signupData: any): PartnerOnboardRequest {
  // Default business hours if not provided
  const defaultHours = {
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM',
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 5:00 PM',
    saturday: '10:00 AM - 4:00 PM',
    sunday: 'Closed',
  };

  // Parse ZIP code
  let zipCode = '';
  if (signupData.address) {
    const zipMatch = signupData.address.match(/\b\d{5}(-\d{4})?\b/);
    zipCode = zipMatch ? zipMatch[0] : '48823'; // Default to MI zip
  }

  // Map partnership tier to category
  const categoryMap = {
    spot_partner: 'business',
    featured_partner: 'restaurant',
    premium_sponsor: 'attractions',
    title_sponsor: 'entertainment',
    chamber_tourism: 'services',
  };

  const category = categoryMap[signupData.tier] || 'business';

  // Build amenities list
  const amenities: string[] = [];
  if (signupData.has_prize_package) {
    amenities.push('Prize Giveaways');
  }
  if (signupData.has_webdev_services) {
    amenities.push('Custom Website');
  }
  amenities.push('Michigan Spots Partner', 'Treasure Hunt Challenges');

  return {
    businessName: signupData.organization_name || signupData.organizationName,
    description: `${signupData.organization_name} is a proud Michigan Spots ${getTierDisplayName(signupData.tier)} offering exciting treasure hunt challenges and community engagement opportunities.`,
    address: signupData.address,
    city: signupData.city,
    state: 'MI',
    zipCode,
    phone: signupData.phone,
    email: signupData.email,
    website: signupData.website || undefined,
    category,
    hours: signupData.hours || defaultHours,
    amenities,
    specialOffers: signupData.prize_description || undefined,
    socialMedia: signupData.social_media || undefined,
  };
}

function getTierDisplayName(tier: string): string {
  const names = {
    spot_partner: 'Spot Partner',
    featured_partner: 'Featured Partner',
    premium_sponsor: 'Premium Sponsor',
    title_sponsor: 'Title Sponsor',
    chamber_tourism: 'Chamber & Tourism Partner',
  };
  return names[tier] || 'Partner';
}
