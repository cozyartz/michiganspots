/**
 * AI Page Generator Service
 * Uses Cloudflare AI to generate branded partner pages that match Michigan Spots branding
 */

import { Env } from '../index';

export interface PartnerPageRequest {
  partnerId: string;
  businessInfo: BusinessInfo;
  brandingGuidelines: BrandingGuidelines;
  regenerationReason?: string;
}

export interface BusinessInfo {
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
  hours: BusinessHours;
  amenities: string[];
  specialOffers?: string;
  socialMedia?: SocialMediaLinks;
}

export interface BusinessHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
}

export interface BrandingGuidelines {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string;
  brandVoice: string;
  designPrinciples: string[];
}

export class AIPageGeneratorService {
  constructor(private env: Env) {}

  async generatePartnerPage(request: PartnerPageRequest): Promise<string> {
    try {
      console.log(`🤖 Generating AI page for partner: ${request.businessInfo.businessName}`);

      // Create comprehensive prompt for AI page generation
      const prompt = this.buildPageGenerationPrompt(request);

      // Use Cloudflare AI to generate the page content
      const aiResponse = await this.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [
          {
            role: 'system',
            content: 'You are an expert web developer and designer specializing in creating beautiful, branded business pages for Michigan Spots treasure hunt partners. Generate complete HTML pages that match the provided branding guidelines and showcase the business effectively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract and enhance the generated HTML
      let generatedHTML = this.extractHTMLFromResponse(aiResponse);
      
      // Apply Michigan Spots branding and enhancements
      generatedHTML = await this.enhanceWithBranding(generatedHTML, request);
      
      // Add interactive elements and QR code integration
      generatedHTML = this.addInteractiveElements(generatedHTML, request);

      console.log(`✅ Successfully generated page for ${request.businessInfo.businessName}`);
      return generatedHTML;

    } catch (error) {
      console.error('AI page generation error:', error);
      
      // Fallback to template-based generation
      return this.generateFallbackPage(request);
    }
  }

  async generatePartnerDashboard(request: { partnerId: string; businessInfo: BusinessInfo }): Promise<string> {
    const dashboardUrl = `${this.env.BASE_URL}/partners/${request.partnerId}/dashboard`;
    
    // Generate AI-powered dashboard
    const prompt = `Create a business analytics dashboard for ${request.businessInfo.businessName} that shows:
    - Treasure hunt challenge completions
    - Customer visits and engagement
    - QR code scan analytics
    - Revenue impact from Michigan Spots partnership
    - Customer reviews and feedback
    - Performance compared to other partners
    
    Make it professional, easy to understand, and actionable for business owners.`;

    try {
      const aiResponse = await this.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [
          {
            role: 'system',
            content: 'You are a business analytics expert creating dashboard interfaces for Michigan Spots business partners.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // For now, return the dashboard URL - full implementation would generate the dashboard HTML
      return dashboardUrl;

    } catch (error) {
      console.error('Dashboard generation error:', error);
      return dashboardUrl;
    }
  }

  private buildPageGenerationPrompt(request: PartnerPageRequest): string {
    const { businessInfo, brandingGuidelines } = request;

    return `
Create a complete, responsive HTML page for "${businessInfo.businessName}", a Michigan Spots treasure hunt partner.

BUSINESS INFORMATION:
- Name: ${businessInfo.businessName}
- Description: ${businessInfo.description}
- Category: ${businessInfo.category}
- Address: ${businessInfo.address}, ${businessInfo.city}, ${businessInfo.state} ${businessInfo.zipCode}
- Phone: ${businessInfo.phone}
- Email: ${businessInfo.email}
- Website: ${businessInfo.website || 'N/A'}
- Special Offers: ${businessInfo.specialOffers || 'None'}
- Amenities: ${businessInfo.amenities.join(', ')}

HOURS:
${Object.entries(businessInfo.hours).map(([day, hours]) => `${day}: ${hours}`).join('\n')}

BRANDING GUIDELINES:
- Primary Color: ${brandingGuidelines.primaryColor}
- Secondary Color: ${brandingGuidelines.secondaryColor}
- Accent Color: ${brandingGuidelines.accentColor}
- Font Family: ${brandingGuidelines.fontFamily}
- Brand Voice: ${brandingGuidelines.brandVoice}
- Design Principles: ${brandingGuidelines.designPrinciples.join(', ')}

REQUIREMENTS:
1. Create a complete HTML page with embedded CSS
2. Use the Michigan Spots color scheme and branding
3. Include a prominent "🗺️ Michigan Spots Partner" badge
4. Add a section for treasure hunt challenges
5. Include QR code placeholder area
6. Make it mobile-responsive
7. Add contact information and business hours
8. Include a map placeholder
9. Add social media links if provided
10. Include a "Visit & Complete Challenge" call-to-action button

DESIGN STYLE:
- Clean, modern design that reflects Michigan's natural beauty
- Use the provided color scheme
- Include Michigan-themed elements (Great Lakes, forests, etc.)
- Professional but approachable
- Easy to navigate on mobile devices

Generate the complete HTML page with inline CSS. Make it visually appealing and functional.
`;
  }

  private extractHTMLFromResponse(aiResponse: any): string {
    // Extract HTML from AI response
    const content = aiResponse.response || aiResponse.result || '';
    
    // Look for HTML content between markers or extract full response
    const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/) || 
                     content.match(/<html[\s\S]*<\/html>/) ||
                     content.match(/<!DOCTYPE html[\s\S]*<\/html>/);
    
    if (htmlMatch) {
      return htmlMatch[1] || htmlMatch[0];
    }
    
    // If no HTML markers found, assume the entire response is HTML
    return content;
  }

  private async enhanceWithBranding(html: string, request: PartnerPageRequest): Promise<string> {
    const { brandingGuidelines, businessInfo } = request;
    
    // Add Michigan Spots branding elements
    const brandingCSS = `
      <style>
        :root {
          --michigan-primary: ${brandingGuidelines.primaryColor};
          --michigan-secondary: ${brandingGuidelines.secondaryColor};
          --michigan-accent: ${brandingGuidelines.accentColor};
          --michigan-font: ${brandingGuidelines.fontFamily};
        }
        
        .michigan-spots-badge {
          background: linear-gradient(135deg, var(--michigan-primary), var(--michigan-secondary));
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: bold;
          display: inline-block;
          margin: 10px 0;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .treasure-hunt-section {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border: 2px solid var(--michigan-accent);
          border-radius: 15px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .qr-code-container {
          text-align: center;
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          margin: 20px 0;
        }
        
        .cta-button {
          background: linear-gradient(135deg, var(--michigan-primary), var(--michigan-accent));
          color: white;
          padding: 15px 30px;
          border: none;
          border-radius: 25px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
          .michigan-spots-badge {
            font-size: 14px;
            padding: 8px 16px;
          }
          
          .cta-button {
            font-size: 16px;
            padding: 12px 24px;
          }
        }
      </style>
    `;

    // Add Michigan Spots specific sections
    const michiganSpotsContent = `
      <div class="michigan-spots-integration">
        <div class="michigan-spots-badge">
          🗺️ Official Michigan Spots Partner
        </div>
        
        <div class="treasure-hunt-section">
          <h3>🎯 Treasure Hunt Challenge</h3>
          <p>Visit ${businessInfo.businessName} and complete our exclusive treasure hunt challenge!</p>
          <ul>
            <li>📍 Check in at our location</li>
            <li>🎮 Complete the interactive challenge</li>
            <li>🏆 Earn points and badges</li>
            <li>🎁 Unlock special rewards</li>
          </ul>
          <a href="#" class="cta-button" onclick="startChallenge()">
            🚀 Start Challenge
          </a>
        </div>
        
        <div class="qr-code-container">
          <h4>📱 Quick Access QR Code</h4>
          <div id="qr-code-placeholder" style="width: 200px; height: 200px; margin: 0 auto; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #666;">
            QR Code Loading...
          </div>
          <p style="margin-top: 10px; font-size: 14px; color: #666;">
            Scan to access challenges and earn rewards!
          </p>
        </div>
      </div>
      
      <script>
        function startChallenge() {
          // Integration with Michigan Spots app
          if (window.MichiganSpots) {
            window.MichiganSpots.startChallenge('${request.partnerId}');
          } else {
            // Fallback to redirect
            window.location.href = 'https://michiganspots.com/challenges/${request.partnerId}';
          }
        }
        
        // Load QR code
        document.addEventListener('DOMContentLoaded', function() {
          fetch('/api/partners/${request.partnerId}/qr?format=svg')
            .then(response => response.text())
            .then(svg => {
              document.getElementById('qr-code-placeholder').innerHTML = svg;
            })
            .catch(error => {
              console.error('Failed to load QR code:', error);
            });
        });
      </script>
    `;

    // Insert branding CSS and content into the HTML
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${brandingCSS}</head>`);
    }
    
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${michiganSpotsContent}</body>`);
    }

    return html;
  }

  private addInteractiveElements(html: string, request: PartnerPageRequest): string {
    // Add interactive elements like maps, social sharing, etc.
    const interactiveElements = `
      <script>
        // Google Maps integration
        function initMap() {
          const location = {
            lat: 42.3601, // Default to Michigan coordinates
            lng: -84.9553
          };
          
          const map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
            center: location
          });
          
          new google.maps.Marker({
            position: location,
            map: map,
            title: '${request.businessInfo.businessName}'
          });
        }
        
        // Social sharing
        function shareOnSocial(platform) {
          const url = encodeURIComponent(window.location.href);
          const text = encodeURIComponent('Check out ${request.businessInfo.businessName} on Michigan Spots!');
          
          let shareUrl = '';
          switch(platform) {
            case 'facebook':
              shareUrl = \`https://www.facebook.com/sharer/sharer.php?u=\${url}\`;
              break;
            case 'twitter':
              shareUrl = \`https://twitter.com/intent/tweet?url=\${url}&text=\${text}\`;
              break;
            case 'instagram':
              // Instagram doesn't support direct URL sharing
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard! Share it on Instagram.');
              return;
          }
          
          if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
          }
        }
        
        // Analytics tracking
        function trackEvent(eventName, data = {}) {
          if (window.gtag) {
            window.gtag('event', eventName, {
              partner_id: '${request.partnerId}',
              business_name: '${request.businessInfo.businessName}',
              ...data
            });
          }
          
          // Send to Michigan Spots analytics
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              event: eventName,
              partnerId: '${request.partnerId}',
              timestamp: new Date().toISOString(),
              data
            })
          }).catch(console.error);
        }
        
        // Track page view
        document.addEventListener('DOMContentLoaded', function() {
          trackEvent('partner_page_view');
        });
      </script>
    `;

    return html.replace('</body>', `${interactiveElements}</body>`);
  }

  private generateFallbackPage(request: PartnerPageRequest): string {
    const { businessInfo, brandingGuidelines } = request;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessInfo.businessName} - Michigan Spots Partner</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${brandingGuidelines.fontFamily}, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .michigan-spots-badge {
            background: linear-gradient(135deg, ${brandingGuidelines.primaryColor}, ${brandingGuidelines.secondaryColor});
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
        
        .business-name {
            font-size: 2.5em;
            color: ${brandingGuidelines.primaryColor};
            margin-bottom: 10px;
        }
        
        .business-description {
            font-size: 1.2em;
            color: #666;
            margin-bottom: 20px;
        }
        
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .treasure-hunt-section {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 2px solid ${brandingGuidelines.accentColor};
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }
        
        .cta-button {
            background: linear-gradient(135deg, ${brandingGuidelines.primaryColor}, ${brandingGuidelines.accentColor});
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        
        .qr-code-container {
            text-align: center;
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
        }
        
        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: 1fr;
            }
            
            .business-name {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="michigan-spots-badge">
                🗺️ Official Michigan Spots Partner
            </div>
            <h1 class="business-name">${businessInfo.businessName}</h1>
            <p class="business-description">${businessInfo.description}</p>
        </div>
        
        <div class="content-grid">
            <div class="info-card">
                <h3>📍 Location & Contact</h3>
                <p><strong>Address:</strong><br>
                ${businessInfo.address}<br>
                ${businessInfo.city}, ${businessInfo.state} ${businessInfo.zipCode}</p>
                <p><strong>Phone:</strong> ${businessInfo.phone}</p>
                <p><strong>Email:</strong> ${businessInfo.email}</p>
                ${businessInfo.website ? `<p><strong>Website:</strong> <a href="${businessInfo.website}" target="_blank">${businessInfo.website}</a></p>` : ''}
            </div>
            
            <div class="info-card">
                <h3>🕒 Business Hours</h3>
                ${Object.entries(businessInfo.hours).map(([day, hours]) => 
                  `<p><strong>${day.charAt(0).toUpperCase() + day.slice(1)}:</strong> ${hours}</p>`
                ).join('')}
            </div>
        </div>
        
        <div class="treasure-hunt-section">
            <h2>🎯 Treasure Hunt Challenge</h2>
            <p>Visit ${businessInfo.businessName} and complete our exclusive Michigan Spots challenge!</p>
            <ul style="text-align: left; display: inline-block; margin: 20px 0;">
                <li>📍 Check in at our location</li>
                <li>🎮 Complete the interactive challenge</li>
                <li>🏆 Earn points and badges</li>
                <li>🎁 Unlock special rewards</li>
            </ul>
            <br>
            <a href="https://michiganspots.com/challenges/${request.partnerId}" class="cta-button">
                🚀 Start Challenge
            </a>
        </div>
        
        <div class="qr-code-container">
            <h3>📱 Quick Access QR Code</h3>
            <div id="qr-code-placeholder" style="width: 200px; height: 200px; margin: 20px auto; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #666;">
                QR Code Loading...
            </div>
            <p>Scan to access challenges and earn rewards!</p>
        </div>
        
        ${businessInfo.amenities.length > 0 ? `
        <div class="info-card">
            <h3>✨ Amenities & Features</h3>
            <ul>
                ${businessInfo.amenities.map(amenity => `<li>${amenity}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${businessInfo.specialOffers ? `
        <div class="info-card" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 2px solid #22c55e;">
            <h3>🎁 Special Offers</h3>
            <p>${businessInfo.specialOffers}</p>
        </div>
        ` : ''}
    </div>
    
    <script>
        // Load QR code
        document.addEventListener('DOMContentLoaded', function() {
            fetch('/api/partners/${request.partnerId}/qr?format=svg')
                .then(response => response.text())
                .then(svg => {
                    document.getElementById('qr-code-placeholder').innerHTML = svg;
                })
                .catch(error => {
                    console.error('Failed to load QR code:', error);
                    document.getElementById('qr-code-placeholder').innerHTML = 
                        '<p style="color: #666;">QR Code Unavailable</p>';
                });
        });
    </script>
</body>
</html>
    `;
  }
}