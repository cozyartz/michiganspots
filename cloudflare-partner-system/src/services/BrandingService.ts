/**
 * Branding Service
 * Manages Michigan Spots branding guidelines and ensures consistent brand application
 */

import { Env } from '../index';

export interface BrandingGuidelines {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string;
  brandVoice: string;
  designPrinciples: string[];
}

export class BrandingService {
  constructor(private env: Env) {}

  async getBrandingGuidelines(): Promise<BrandingGuidelines> {
    return {
      primaryColor: '#059669', // Michigan green (forest/nature)
      secondaryColor: '#0ea5e9', // Great Lakes blue
      accentColor: '#f59e0b', // Michigan maize (University of Michigan inspired)
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      logoUrl: 'https://michiganspots.com/assets/logo.svg',
      brandVoice: 'Friendly, adventurous, and authentically Michigan. We celebrate local businesses and the spirit of exploration that makes Michigan special.',
      designPrinciples: [
        'Clean and modern design that reflects Michigan\'s natural beauty',
        'Accessible and mobile-first approach',
        'Consistent use of Michigan-inspired colors and imagery',
        'Clear hierarchy and easy navigation',
        'Authentic representation of local businesses',
        'Emphasis on community and exploration'
      ]
    };
  }

  generateBrandedCSS(customizations?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  }): string {
    const branding = {
      primaryColor: customizations?.primaryColor || '#059669',
      secondaryColor: customizations?.secondaryColor || '#0ea5e9',
      accentColor: customizations?.accentColor || '#f59e0b'
    };

    return `
      :root {
        /* Michigan Spots Brand Colors */
        --michigan-primary: ${branding.primaryColor};
        --michigan-secondary: ${branding.secondaryColor};
        --michigan-accent: ${branding.accentColor};
        --michigan-success: #10b981;
        --michigan-warning: #f59e0b;
        --michigan-error: #ef4444;
        
        /* Neutral Colors */
        --michigan-gray-50: #f9fafb;
        --michigan-gray-100: #f3f4f6;
        --michigan-gray-200: #e5e7eb;
        --michigan-gray-300: #d1d5db;
        --michigan-gray-400: #9ca3af;
        --michigan-gray-500: #6b7280;
        --michigan-gray-600: #4b5563;
        --michigan-gray-700: #374151;
        --michigan-gray-800: #1f2937;
        --michigan-gray-900: #111827;
        
        /* Typography */
        --michigan-font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --michigan-font-size-xs: 0.75rem;
        --michigan-font-size-sm: 0.875rem;
        --michigan-font-size-base: 1rem;
        --michigan-font-size-lg: 1.125rem;
        --michigan-font-size-xl: 1.25rem;
        --michigan-font-size-2xl: 1.5rem;
        --michigan-font-size-3xl: 1.875rem;
        --michigan-font-size-4xl: 2.25rem;
        
        /* Spacing */
        --michigan-space-1: 0.25rem;
        --michigan-space-2: 0.5rem;
        --michigan-space-3: 0.75rem;
        --michigan-space-4: 1rem;
        --michigan-space-5: 1.25rem;
        --michigan-space-6: 1.5rem;
        --michigan-space-8: 2rem;
        --michigan-space-10: 2.5rem;
        --michigan-space-12: 3rem;
        --michigan-space-16: 4rem;
        
        /* Border Radius */
        --michigan-radius-sm: 0.125rem;
        --michigan-radius: 0.25rem;
        --michigan-radius-md: 0.375rem;
        --michigan-radius-lg: 0.5rem;
        --michigan-radius-xl: 0.75rem;
        --michigan-radius-2xl: 1rem;
        --michigan-radius-full: 9999px;
        
        /* Shadows */
        --michigan-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        --michigan-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        --michigan-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        --michigan-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        --michigan-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      }
      
      /* Base Styles */
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: var(--michigan-font-family);
        line-height: 1.6;
        color: var(--michigan-gray-800);
        background: linear-gradient(135deg, var(--michigan-gray-50), #e0f2fe);
        margin: 0;
        padding: 0;
      }
      
      /* Michigan Spots Components */
      .michigan-badge {
        background: linear-gradient(135deg, var(--michigan-primary), var(--michigan-secondary));
        color: white;
        padding: var(--michigan-space-2) var(--michigan-space-4);
        border-radius: var(--michigan-radius-full);
        font-weight: 600;
        font-size: var(--michigan-font-size-sm);
        display: inline-flex;
        align-items: center;
        gap: var(--michigan-space-2);
        box-shadow: var(--michigan-shadow-md);
      }
      
      .michigan-button {
        background: linear-gradient(135deg, var(--michigan-primary), var(--michigan-accent));
        color: white;
        border: none;
        padding: var(--michigan-space-3) var(--michigan-space-6);
        border-radius: var(--michigan-radius-lg);
        font-weight: 600;
        font-size: var(--michigan-font-size-base);
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: var(--michigan-space-2);
        box-shadow: var(--michigan-shadow);
      }
      
      .michigan-button:hover {
        transform: translateY(-2px);
        box-shadow: var(--michigan-shadow-lg);
      }
      
      .michigan-button:active {
        transform: translateY(0);
      }
      
      .michigan-button.secondary {
        background: white;
        color: var(--michigan-primary);
        border: 2px solid var(--michigan-primary);
      }
      
      .michigan-button.secondary:hover {
        background: var(--michigan-primary);
        color: white;
      }
      
      .michigan-card {
        background: white;
        border-radius: var(--michigan-radius-xl);
        padding: var(--michigan-space-6);
        box-shadow: var(--michigan-shadow);
        border: 1px solid var(--michigan-gray-200);
      }
      
      .michigan-card.featured {
        border: 2px solid var(--michigan-accent);
        box-shadow: var(--michigan-shadow-lg);
      }
      
      .michigan-treasure-section {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        border: 2px solid var(--michigan-accent);
        border-radius: var(--michigan-radius-xl);
        padding: var(--michigan-space-6);
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .michigan-treasure-section::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
        animation: treasure-glow 3s ease-in-out infinite alternate;
      }
      
      @keyframes treasure-glow {
        0% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      .michigan-qr-container {
        background: white;
        border-radius: var(--michigan-radius-xl);
        padding: var(--michigan-space-6);
        text-align: center;
        box-shadow: var(--michigan-shadow-md);
        border: 1px solid var(--michigan-gray-200);
      }
      
      .michigan-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--michigan-space-6);
        margin: var(--michigan-space-8) 0;
      }
      
      .michigan-header {
        text-align: center;
        background: white;
        border-radius: var(--michigan-radius-xl);
        padding: var(--michigan-space-8);
        margin-bottom: var(--michigan-space-8);
        box-shadow: var(--michigan-shadow-md);
        position: relative;
        overflow: hidden;
      }
      
      .michigan-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--michigan-primary), var(--michigan-secondary), var(--michigan-accent));
      }
      
      .michigan-business-name {
        font-size: var(--michigan-font-size-4xl);
        font-weight: 700;
        color: var(--michigan-primary);
        margin: var(--michigan-space-4) 0;
        line-height: 1.2;
      }
      
      .michigan-description {
        font-size: var(--michigan-font-size-lg);
        color: var(--michigan-gray-600);
        margin-bottom: var(--michigan-space-6);
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .michigan-info-grid {
          grid-template-columns: 1fr;
        }
        
        .michigan-business-name {
          font-size: var(--michigan-font-size-3xl);
        }
        
        .michigan-button {
          padding: var(--michigan-space-3) var(--michigan-space-4);
          font-size: var(--michigan-font-size-sm);
        }
        
        .michigan-card {
          padding: var(--michigan-space-4);
        }
      }
      
      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* Focus styles for accessibility */
      .michigan-button:focus,
      .michigan-card:focus {
        outline: 2px solid var(--michigan-accent);
        outline-offset: 2px;
      }
    `;
  }

  generateMichiganThemedElements(): string {
    return `
      <!-- Michigan-themed decorative elements -->
      <div class="michigan-decorative-elements">
        <style>
          .michigan-decorative-elements {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.05;
          }
          
          .michigan-shape {
            position: absolute;
            background: var(--michigan-primary);
            border-radius: 50%;
          }
          
          .michigan-shape.shape-1 {
            width: 200px;
            height: 200px;
            top: 10%;
            right: 10%;
            animation: float 6s ease-in-out infinite;
          }
          
          .michigan-shape.shape-2 {
            width: 150px;
            height: 150px;
            bottom: 20%;
            left: 15%;
            animation: float 8s ease-in-out infinite reverse;
          }
          
          .michigan-shape.shape-3 {
            width: 100px;
            height: 100px;
            top: 60%;
            right: 20%;
            animation: float 7s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        </style>
        
        <div class="michigan-shape shape-1"></div>
        <div class="michigan-shape shape-2"></div>
        <div class="michigan-shape shape-3"></div>
      </div>
    `;
  }

  generateSocialMediaMeta(businessInfo: any, partnerId: string): string {
    const baseUrl = this.env.BASE_URL;
    const pageUrl = `${baseUrl}/partners/${partnerId}`;
    const imageUrl = `${baseUrl}/api/partners/${partnerId}/social-image`;

    return `
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="business.business">
      <meta property="og:url" content="${pageUrl}">
      <meta property="og:title" content="${businessInfo.businessName} - Michigan Spots Partner">
      <meta property="og:description" content="${businessInfo.description}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:site_name" content="Michigan Spots">
      
      <!-- Twitter -->
      <meta property="twitter:card" content="summary_large_image">
      <meta property="twitter:url" content="${pageUrl}">
      <meta property="twitter:title" content="${businessInfo.businessName} - Michigan Spots Partner">
      <meta property="twitter:description" content="${businessInfo.description}">
      <meta property="twitter:image" content="${imageUrl}">
      
      <!-- Business Schema -->
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "${businessInfo.businessName}",
        "description": "${businessInfo.description}",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "${businessInfo.address}",
          "addressLocality": "${businessInfo.city}",
          "addressRegion": "${businessInfo.state}",
          "postalCode": "${businessInfo.zipCode}",
          "addressCountry": "US"
        },
        "telephone": "${businessInfo.phone}",
        "email": "${businessInfo.email}",
        ${businessInfo.website ? `"url": "${businessInfo.website}",` : ''}
        "openingHours": [
          ${Object.entries(businessInfo.hours).map(([day, hours]) => 
            `"${day.substring(0, 2).toUpperCase()} ${hours}"`
          ).join(',\n          ')}
        ],
        "paymentAccepted": "Cash, Credit Card",
        "currenciesAccepted": "USD",
        "priceRange": "$$"
      }
      </script>
    `;
  }

  async generateSocialImage(businessInfo: any, partnerId: string): Promise<string> {
    // This would generate a branded social media image
    // For now, return a placeholder URL
    return `${this.env.BASE_URL}/assets/social-images/${partnerId}.png`;
  }

  validateBrandCompliance(html: string): {
    isCompliant: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for required branding elements
    if (!html.includes('Michigan Spots')) {
      issues.push('Missing Michigan Spots branding');
    }

    if (!html.includes('michigan-badge') && !html.includes('🗺️')) {
      suggestions.push('Consider adding the Michigan Spots partner badge');
    }

    if (!html.includes('var(--michigan-primary)') && !html.includes('#059669')) {
      suggestions.push('Use Michigan Spots brand colors for better consistency');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      suggestions
    };
  }
}