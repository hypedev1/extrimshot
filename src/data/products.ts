export interface Product {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  tagline: string;
  taglineBn: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  category: string;
  categoryBn: string;
  rating: number;
  reviews: number;
  badge?: string;
  badgeBn?: string;
  features: string[];
  featuresBn: string[];
}

export const products: Product[] = [
  {
    id: '1',
    slug: 'powerbooster',
    name: 'Extrimshot Power Booster',
    nameBn: 'এক্সট্রিমশট পাওয়ার বুস্টার',
    tagline: 'Natural Energy & Vitality Enhancer',
    taglineBn: 'প্রাকৃতিক শক্তি ও জীবনীশক্তি বৃদ্ধিকারী',
    price: 1250,
    originalPrice: 2500,
    discount: 50,
    image: '/lovable-uploads/acfcf931-2261-40e7-b2ab-6d20cc99533f.webp',
    category: 'Energy & Vitality',
    categoryBn: 'শক্তি ও জীবনীশক্তি',
    rating: 4.9,
    reviews: 2847,
    badge: 'Best Seller',
    badgeBn: 'সেরা বিক্রয়',
    features: ['100% Natural', 'No Side Effects', 'Fast Results'],
    featuresBn: ['১০০% প্রাকৃতিক', 'কোন পার্শ্বপ্রতিক্রিয়া নেই', 'দ্রুত ফলাফল']
  },
  {
    id: '2',
    slug: 'diabeticpack',
    name: 'Diabetic Care Pack',
    nameBn: 'ডায়াবেটিক কেয়ার প্যাক',
    tagline: 'Natural Blood Sugar Management',
    taglineBn: 'প্রাকৃতিক রক্তে শর্করা নিয়ন্ত্রণ',
    price: 1450,
    originalPrice: 2800,
    discount: 48,
    image: '/lovable-uploads/7dcfcca6-53ab-4f9f-8e43-c791ff913947.webp',
    category: 'Health & Wellness',
    categoryBn: 'স্বাস্থ্য ও সুস্থতা',
    rating: 4.8,
    reviews: 1923,
    badge: 'New',
    badgeBn: 'নতুন',
    features: ['Herbal Formula', 'Doctor Recommended', 'Safe Daily Use'],
    featuresBn: ['ভেষজ সূত্র', 'ডাক্তার প্রস্তাবিত', 'দৈনিক ব্যবহারে নিরাপদ']
  },
  {
    id: '3',
    slug: 'immunitybooster',
    name: 'Immunity Booster Plus',
    nameBn: 'ইমিউনিটি বুস্টার প্লাস',
    tagline: 'Strengthen Your Natural Defense',
    taglineBn: 'আপনার প্রাকৃতিক প্রতিরক্ষা শক্তিশালী করুন',
    price: 950,
    originalPrice: 1800,
    discount: 47,
    image: '/lovable-uploads/ab2d8092-bf7e-45d2-84d0-37f1ace163c4.webp',
    category: 'Immunity',
    categoryBn: 'রোগ প্রতিরোধ',
    rating: 4.7,
    reviews: 1456,
    features: ['Vitamin Rich', 'Antioxidant', 'Daily Protection'],
    featuresBn: ['ভিটামিন সমৃদ্ধ', 'অ্যান্টিঅক্সিডেন্ট', 'দৈনিক সুরক্ষা']
  },
  {
    id: '4',
    slug: 'weightloss',
    name: 'Organic Slim Tea',
    nameBn: 'অর্গানিক স্লিম টি',
    tagline: 'Natural Weight Management Solution',
    taglineBn: 'প্রাকৃতিক ওজন নিয়ন্ত্রণ সমাধান',
    price: 750,
    originalPrice: 1400,
    discount: 46,
    image: '/lovable-uploads/c5fb1812-cf74-4249-9744-ed2222164fee.webp',
    category: 'Weight Management',
    categoryBn: 'ওজন নিয়ন্ত্রণ',
    rating: 4.6,
    reviews: 2134,
    badge: 'Popular',
    badgeBn: 'জনপ্রিয়',
    features: ['Green Tea Extract', 'Metabolism Boost', 'Detox Formula'],
    featuresBn: ['গ্রিন টি এক্সট্রাক্ট', 'মেটাবলিজম বুস্ট', 'ডিটক্স ফর্মুলা']
  },
  {
    id: '5',
    slug: 'haircare',
    name: 'Herbal Hair Oil',
    nameBn: 'হার্বাল হেয়ার অয়েল',
    tagline: 'Traditional Hair Nourishment',
    taglineBn: 'ঐতিহ্যবাহী চুলের পুষ্টি',
    price: 550,
    originalPrice: 1000,
    discount: 45,
    image: '/lovable-uploads/aeca2ff1-3195-4d8b-ac60-1bd8bd7f9078.webp',
    category: 'Hair Care',
    categoryBn: 'চুলের যত্ন',
    rating: 4.8,
    reviews: 987,
    features: ['Pure Coconut Oil', 'Herbal Infused', 'Promotes Growth'],
    featuresBn: ['বিশুদ্ধ নারকেল তেল', 'ভেষজ মিশ্রিত', 'বৃদ্ধি প্রচার করে']
  },
  {
    id: '6',
    slug: 'skincare',
    name: 'Turmeric Face Pack',
    nameBn: 'হলুদ ফেস প্যাক',
    tagline: 'Ayurvedic Skin Brightening',
    taglineBn: 'আয়ুর্বেদিক ত্বক উজ্জ্বলকারী',
    price: 450,
    originalPrice: 850,
    discount: 47,
    image: '/lovable-uploads/12a04d91-3d2a-4274-8e85-16c00eae429a.webp',
    category: 'Skin Care',
    categoryBn: 'ত্বকের যত্ন',
    rating: 4.7,
    reviews: 1567,
    features: ['Pure Turmeric', 'No Chemicals', 'Glowing Skin'],
    featuresBn: ['বিশুদ্ধ হলুদ', 'কেমিক্যাল মুক্ত', 'উজ্জ্বল ত্বক']
  }
];

export const categories = [
  { id: 'all', name: 'All Products', nameBn: 'সকল পণ্য', icon: '🌿' },
  { id: 'energy', name: 'Energy & Vitality', nameBn: 'শক্তি ও জীবনীশক্তি', icon: '⚡' },
  { id: 'health', name: 'Health & Wellness', nameBn: 'স্বাস্থ্য ও সুস্থতা', icon: '💚' },
  { id: 'immunity', name: 'Immunity', nameBn: 'রোগ প্রতিরোধ', icon: '🛡️' },
  { id: 'weight', name: 'Weight Management', nameBn: 'ওজন নিয়ন্ত্রণ', icon: '🍃' },
  { id: 'beauty', name: 'Beauty & Care', nameBn: 'সৌন্দর্য ও যত্ন', icon: '✨' }
];
