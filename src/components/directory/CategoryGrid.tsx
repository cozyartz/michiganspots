import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  ShoppingBag,
  Palette,
  Briefcase,
  Heart,
  Car,
  Home,
  MapPin,
  Coffee,
  Hammer,
  GraduationCap,
  Building2,
} from 'lucide-react';

interface Category {
  name: string;
  icon: any;
  count: number;
  href: string;
  color: string;
}

const categories: Category[] = [
  {
    name: 'Restaurants',
    icon: UtensilsCrossed,
    count: 487,
    href: '/directory/category/restaurants',
    color: 'from-red-500 to-orange-500',
  },
  {
    name: 'Coffee Shops',
    icon: Coffee,
    count: 143,
    href: '/directory/category/coffee-shops',
    color: 'from-amber-700 to-yellow-600',
  },
  {
    name: 'Shopping',
    icon: ShoppingBag,
    count: 312,
    href: '/directory/category/shopping',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Arts & Culture',
    icon: Palette,
    count: 178,
    href: '/directory/category/arts-culture',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Services',
    icon: Briefcase,
    count: 256,
    href: '/directory/category/services',
    color: 'from-blue-600 to-cyan-500',
  },
  {
    name: 'Health & Wellness',
    icon: Heart,
    count: 189,
    href: '/directory/category/health-wellness',
    color: 'from-rose-500 to-pink-500',
  },
  {
    name: 'Automotive',
    icon: Car,
    count: 134,
    href: '/directory/category/automotive',
    color: 'from-slate-600 to-gray-500',
  },
  {
    name: 'Home & Garden',
    icon: Home,
    count: 167,
    href: '/directory/category/home-garden',
    color: 'from-green-600 to-emerald-500',
  },
  {
    name: 'Tourism',
    icon: MapPin,
    count: 223,
    href: '/directory/category/tourism',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    name: 'Construction',
    icon: Hammer,
    count: 198,
    href: '/directory/category/construction',
    color: 'from-orange-600 to-amber-600',
  },
  {
    name: 'Education',
    icon: GraduationCap,
    count: 91,
    href: '/directory/category/education',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    name: 'Real Estate',
    icon: Building2,
    count: 156,
    href: '/directory/category/real-estate',
    color: 'from-emerald-600 to-teal-600',
  },
];

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map((category, idx) => {
        const Icon = category.icon;
        return (
          <motion.a
            key={category.name}
            href={category.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
            className="group relative parchment-card p-6 hover:shadow-xl transition-all duration-300"
          >
            {/* Gradient Background on Hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`}
            />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div
                className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="text-white" size={28} />
              </div>

              {/* Category Name */}
              <h3 className="font-heading text-lg font-bold text-ink-primary mb-2 group-hover:text-lakes-blue transition-colors">
                {category.name}
              </h3>

              {/* Business Count */}
              <p className="text-sm text-ink-secondary">
                {category.count.toLocaleString()} businesses
              </p>

              {/* Arrow Icon */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-lakes-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
