import React from 'react';
import { AmazonProductCard } from './AmazonAffiliateLink';
import { AffiliateDisclosure } from './AffiliateDisclosure';
import type { AffiliateProduct } from '../data/affiliateProducts';

interface ProductRecommendationsProps {
  products: AffiliateProduct[];
  title?: string;
  description?: string;
  showDisclosure?: boolean;
  columns?: 2 | 3 | 4;
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  products,
  title = 'Recommended Gear',
  description,
  showDisclosure = true,
  columns = 3,
}) => {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <div className="my-8">
      {showDisclosure && <AffiliateDisclosure variant="banner" />}

      <div className="mb-6">
        <h2 className="font-heading text-3xl font-bold text-ink-primary mb-3">
          {title}
        </h2>
        {description && (
          <p className="text-ink-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
        {products.map((product) => (
          <AmazonProductCard
            key={product.asin}
            asin={product.asin}
            title={product.title}
            description={product.description}
            category={product.category}
            imageUrl={product.imageUrl}
          />
        ))}
      </div>
    </div>
  );
};
