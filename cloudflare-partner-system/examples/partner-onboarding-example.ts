/**
 * Example: Partner Onboarding Integration
 * Shows how to integrate the partner system with the Reddit app
 */

// Example partner data for onboarding
const examplePartnerData = {
  businessName: "Great Lakes Coffee Roasters",
  description: "Artisanal coffee roastery featuring locally sourced beans and cozy atmosphere perfect for treasure hunters to plan their next adventure.",
  address: "456 Lake Shore Dr",
  city: "Traverse City",
  state: "MI",
  zipCode: "49684",
  phone: "(231) 555-0199",
  email: "hello@greatlakescoffee.com",
  website: "https://greatlakescoffee.com",
  category: "cafe" as const,
  hours: {
    monday: "6:00 AM - 8:00 PM",
    tuesday: "6:00 AM - 8:00 PM", 
    wednesday: "6:00 AM - 8:00 PM",
    thursday: "6:00 AM - 8:00 PM",
    friday: "6:00 AM - 9:00 PM",
    saturday: "7:00 AM - 9:00 PM",
    sunday: "7:00 AM - 6:00 PM"
  },
  amenities: [
    "Free WiFi",
    "Outdoor Seating", 
    "Pet Friendly",
    "Local Art Gallery",
    "Meeting Rooms",
    "Fresh Pastries"
  ],
  specialOffers: "Show your Michigan Spots badge for 15% off any specialty drink!",
  socialMedia: {
    facebook: "https://facebook.com/greatlakescoffee",
    instagram: "https://instagram.com/greatlakescoffee"
  }
};

// Integration with Reddit Devvit app
export async function onboardPartnerFromReddit(
  partnerData: typeof examplePartnerData,
  context: any // Devvit context
) {
  try {
    console.log('🤖 Starting AI-powered partner onboarding...');
    
    // Call the partner system API
    const response = await fetch('https://partners.michiganspots.com/api/partners/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': context.settings.get('PARTNER_API_KEY'),
        'User-Agent': 'MichiganSpots-Reddit-App/1.0'
      },
      body: JSON.stringify(partnerData)
    });

    if (!response.ok) {
      throw new Error(`Partner onboarding failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Partner onboarding failed: ${result.error}`);
    }

    console.log('✅ Partner onboarded successfully!');
    console.log(`📄 Partner page: ${result.urls.partnerPage}`);
    console.log(`📱 QR code: ${result.urls.qrCode}`);
    console.log(`📊 Dashboard: ${result.urls.dashboard}`);

    // Create announcement post in Reddit
    await createPartnerAnnouncementPost(context, result, partnerData);
    
    // Store partner info in Reddit app storage
    await context.redis.set(
      `partner:${result.partnerId}`,
      JSON.stringify({
        partnerId: result.partnerId,
        businessName: partnerData.businessName,
        urls: result.urls,
        onboardedAt: new Date().toISOString(),
        status: 'active'
      }),
      { expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } // 1 year
    );

    // Show success message to moderator
    context.ui.showToast({
      text: `🎉 ${partnerData.businessName} successfully onboarded!`,
      appearance: 'success'
    });

    return result;

  } catch (error) {
    console.error('Partner onboarding error:', error);
    
    context.ui.showToast({
      text: `❌ Failed to onboard partner: ${error instanceof Error ? error.message : 'Unknown error'}`,
      appearance: 'neutral'
    });
    
    throw error;
  }
}

// Create Reddit announcement post for new partner
async function createPartnerAnnouncementPost(
  context: any,
  onboardingResult: any,
  partnerData: typeof examplePartnerData
) {
  try {
    const post = await context.reddit.submitPost({
      title: `🎉 Welcome Our Newest Partner: ${partnerData.businessName}!`,
      subredditName: context.subredditName,
      text: `We're excited to welcome **${partnerData.businessName}** to the Michigan Spots family! 🗺️

**About ${partnerData.businessName}:**
${partnerData.description}

**Location:** ${partnerData.address}, ${partnerData.city}, ${partnerData.state}
**Category:** ${partnerData.category.charAt(0).toUpperCase() + partnerData.category.slice(1)}

**Special Offer:** ${partnerData.specialOffers}

**🎯 New Challenges Available:**
Visit ${partnerData.businessName} to unlock exclusive treasure hunt challenges and earn points!

**📱 Quick Access:**
- [Visit Partner Page](${onboardingResult.urls.partnerPage})
- [Download QR Code](${onboardingResult.urls.qrCode})

**🏆 What You Can Do:**
- Complete location-based challenges
- Earn Michigan Spots points and badges  
- Support local Michigan businesses
- Share your experience with the community

Welcome to the adventure, ${partnerData.businessName}! 🎉

---
*This partner was onboarded using our AI-powered system that automatically created their branded page, QR codes, and challenge integration.*`,
      preview: {
        type: 'vstack',
        padding: 'medium',
        gap: 'medium',
        alignment: 'center',
        children: [
          {
            type: 'text',
            size: 'xxlarge',
            text: '🎉'
          },
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            text: `Welcome ${partnerData.businessName}!`
          },
          {
            type: 'text',
            size: 'medium',
            color: '#6b7280',
            text: 'New Michigan Spots Partner'
          }
        ]
      }
    });

    console.log(`📢 Partner announcement post created: ${post.permalink}`);
    return post;

  } catch (error) {
    console.error('Failed to create announcement post:', error);
    // Don't throw - this is not critical to the onboarding process
  }
}

// Example: Bulk partner onboarding
export async function bulkOnboardPartners(
  partners: Array<typeof examplePartnerData>,
  context: any
) {
  console.log(`🚀 Starting bulk onboarding for ${partners.length} partners...`);
  
  const results = [];
  const batchSize = 3; // Process in small batches to avoid overwhelming the system

  for (let i = 0; i < partners.length; i += batchSize) {
    const batch = partners.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(partners.length / batchSize)}`);
    
    const batchPromises = batch.map(partner => 
      onboardPartnerFromReddit(partner, context).catch(error => {
        console.error(`Failed to onboard ${partner.businessName}:`, error);
        return { error: error.message, businessName: partner.businessName };
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Wait between batches to be respectful to the API
    if (i + batchSize < partners.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const successful = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;

  console.log(`✅ Bulk onboarding completed: ${successful} successful, ${failed} failed`);
  
  context.ui.showToast({
    text: `Bulk onboarding completed: ${successful}/${partners.length} partners onboarded successfully`,
    appearance: successful === partners.length ? 'success' : 'neutral'
  });

  return results;
}

// Example: Update partner information
export async function updatePartnerInfo(
  partnerId: string,
  updates: Partial<typeof examplePartnerData>,
  context: any
) {
  try {
    console.log(`🔄 Updating partner: ${partnerId}`);

    const response = await fetch(`https://partners.michiganspots.com/api/partners/${partnerId}/regenerate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': context.settings.get('PARTNER_API_KEY')
      },
      body: JSON.stringify({
        updates,
        reason: 'Information updated via Reddit moderator tools'
      })
    });

    if (!response.ok) {
      throw new Error(`Partner update failed: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Partner updated successfully!');
    
    context.ui.showToast({
      text: '✅ Partner information updated and page regenerated!',
      appearance: 'success'
    });

    return result;

  } catch (error) {
    console.error('Partner update error:', error);
    
    context.ui.showToast({
      text: `❌ Failed to update partner: ${error instanceof Error ? error.message : 'Unknown error'}`,
      appearance: 'neutral'
    });
    
    throw error;
  }
}

// Example: Get partner analytics
export async function getPartnerAnalytics(
  partnerId: string,
  timeframe: string = '30d',
  context: any
) {
  try {
    const response = await fetch(`https://partners.michiganspots.com/api/partners/${partnerId}/analytics?timeframe=${timeframe}`, {
      headers: {
        'X-API-Key': context.settings.get('PARTNER_API_KEY')
      }
    });

    if (!response.ok) {
      throw new Error(`Analytics fetch failed: ${response.status}`);
    }

    const analytics = await response.json();
    
    console.log('📊 Partner analytics:', analytics);
    return analytics;

  } catch (error) {
    console.error('Analytics fetch error:', error);
    throw error;
  }
}

// Example usage in Reddit app moderator tools
export const exampleModeratorAction = {
  label: '🤖 Onboard New Partner (AI)',
  onPress: async (context: any) => {
    try {
      // This would typically show a form to collect partner data
      // For this example, we'll use the sample data
      
      const result = await onboardPartnerFromReddit(examplePartnerData, context);
      
      // Navigate to the new partner page
      if (result.urls?.partnerPage) {
        // In a real implementation, you might open the partner page
        console.log(`Partner page ready: ${result.urls.partnerPage}`);
      }
      
    } catch (error) {
      console.error('Moderator action failed:', error);
    }
  }
};