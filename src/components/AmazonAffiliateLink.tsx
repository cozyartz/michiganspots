import React from 'react';
import { ExternalLink } from 'lucide-react';

interface AmazonAffiliateLinkProps {
  asin: string; // Amazon Standard Identification Number
  text?: string;
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const AMAZON_ASSOCIATE_ID = 'cozyartz05-20';

export const AmazonAffiliateLink: React.FC<AmazonAffiliateLinkProps> = ({
  asin,
  text,
  className = '',
  showIcon = false,
  children,
}) => {
  // Generate the Amazon affiliate link
  const affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${AMAZON_ASSOCIATE_ID}`;

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`inline-flex items-center gap-1 text-lakes-blue hover:text-copper-orange transition-colors underline ${className}`}
    >
      {children || text || 'View on Amazon'}
      {showIcon && <ExternalLink className="w-4 h-4" />}
    </a>
  );
};

interface ProductCardProps {
  asin: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  category?: string;
}

export const AmazonProductCard: React.FC<ProductCardProps> = ({
  asin,
  title,
  description,
  imageUrl,
  price,
  category,
}) => {
  const affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${AMAZON_ASSOCIATE_ID}`;

  return (
    <div className="border-2 border-ink-primary/20 rounded-lg p-4 hover:border-lakes-blue transition-all hover:shadow-md">
      {imageUrl && (
        <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-48 object-cover rounded-md mb-3"
          />
        </a>
      )}
      {category && (
        <span className="text-xs uppercase tracking-wide text-copper-orange font-semibold">
          {category}
        </span>
      )}
      <h3 className="font-heading text-lg font-bold text-ink-primary mb-2 mt-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-ink-secondary mb-3 line-clamp-2">{description}</p>
      )}
      {price && (
        <p className="text-lg font-bold text-forest-green mb-3">{price}</p>
      )}
      <a
        href={affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-flex items-center gap-2 px-4 py-2 bg-lakes-blue text-parchment rounded-md hover:bg-copper-orange transition-colors font-semibold text-sm"
      >
        View on Amazon
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
};
