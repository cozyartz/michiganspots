/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { useState } from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  const allCategories = ['All', ...categories];

  return (
    <div className="flex flex-wrap gap-3 justify-center py-12">
      {allCategories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category === 'All' ? '' : category)}
          className={`
            px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-wide
            transition-all duration-300 transform hover:scale-105
            ${activeCategory === (category === 'All' ? '' : category)
              ? 'bg-gradient-to-r from-copper-orange to-sunset-red text-parchment-light shadow-lg'
              : 'bg-parchment-dark text-ink-primary hover:bg-parchment border-2 border-transparent hover:border-copper-orange'
            }
          `}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
