export interface ProductContent {
  slug: string;
  hero: {
    title: string;
    videoUrl?: string;
    subtitle: string;
    badges: { text: string }[];
    ctaText: string;
    discount: string;
    features: { icon: string; title: string; desc: string }[];
  };
  about: {
    title: string;
    image: string;
    description: string;
    tags: string[];
    additionalInfo: string;
  };
  benefits: {
    title: string;
    subtitle: string;
    image: string;
    categories: {
      title: string;
      icon: string;
      items: { title: string; desc: string }[];
    }[];
    ctaText: string;
  };
  beforeAfter: {
    title: string;
    before: { title: string; items: string[] };
    after: { title: string; items: string[] };
  };
  stats: {
    items: { value: string; label: string }[];
  };
  howToUse: {
    title: string;
    subtitle: string;
    steps: { step: string; title: string; desc: string }[];
  };
  order: {
    title: string;
    subtitle: string;
    packages: {
      id: string;
      name: string;
      quantity: string;
      price: number;
      originalPrice: number;
      popular?: boolean;
      savings?: string;
    }[];
  };
  finalCta: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
}

export const productContents: Record<string, ProductContent> = {
  powerbooster: {
    slug: 'powerbooster',
    hero: {
      title: 'ডক্টর এ আর খান এর রেকমেন্ডেড প্রডাক্ট এক্সট্রিমশট, যা খেলে যৌন জীবন হবে শান্তিপূর্ণ ইনশা আল্লাহ',
      videoUrl: 'https://www.youtube.com/embed/iOaQbkKdlYA?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=iOaQbkKdlYA&playsinline=1',
      subtitle: 'দিনের ক্লান্তি, স্ট্রেস, লো এনার্জি… সব ভুলে আবারও অনুভব করুন তরুন উদ্যম, স্ট্রং পারফরম্যান্স আর কনফিডেন্ট Extrimshot – ন্যাচারাল পাওয়ার বুস্টার এর সাথে।',
      badges: [
        { text: 'কোন প্রকার কেমিকেল নেই' },
        { text: 'Cash on Delivery' },
        { text: '100000+ কাস্টমার' }
      ],
      ctaText: 'এখনই অর্ডার করুন',
      discount: '৫০% ডিসকাউন্ট',
      features: [
        { icon: 'Zap', title: 'তাৎক্ষণিক এনার্জি', desc: '৩০ মিনিটে পাওয়ার বুস্ট' },
        { icon: 'Dumbbell', title: 'স্ট্যামিনা সাপোর্ট', desc: 'দীর্ঘক্ষণ এনার্জি ধরে রাখুন' },
        { icon: 'FlaskConical', title: '১০০% ন্যাচারাল', desc: 'স্টেরয়েড ও কেমিক্যাল মুক্ত' },
        { icon: 'Lock', title: 'ডিসক্রিট প্যাকেজিং', desc: 'সম্পূর্ণ গোপনীয়তা' }
      ]
    },
    about: {
      title: 'Extrimshot ন্যাচারাল পাওয়ার বুস্টার যেটি খেলে ন্যাচারালি সহবাসের সময় দীর্ঘায়িত হবে ইনশা আল্লাহ।দ্রুত বীর্যপাত রোধ করবে যা আপনার বিবাহিত জীবন কে করবে আরও বেশি আনন্দময় ইনশা আল্লাহ',
      image: '/lovable-uploads/12a04d91-3d2a-4274-8e85-16c00eae429a.png',
      description: 'Extrimshot হলো একটি প্রাকৃতিক হার্বাল পাওয়ার বুস্টার শট, যা সিলেক্টেড হার্ব, ভিটামিন ও ন্যাচারাল এনার্জি কমপ্লেক্স দিয়ে তৈরি। এটি শরীরের ন্যাচারাল এনার্জি সিস্টেমকে সাপোর্ট করে।',
      tags: ['১০০% হার্বাল', 'স্টেরয়েড ফ্রি', 'নন-অ্যাডিক্টিভ'],
      additionalInfo: 'রিসার্চড ডোজে ব্যবহার করা উপাদানের জন্য এটি (Addiction) তৈরি না করে সেফভাবে কাজ করার জন্য তৈরি করা হয়েছে।'
    },
    benefits: {
      title: 'Extrimshot থেকে আপনি কী কী উপকার পেতে পারেন?',
      subtitle: 'হাজারো সন্তুষ্ট কাস্টমারের বাস্তব অভিজ্ঞতা',
      image: '/lovable-uploads/aeca2ff1-3195-4d8b-ac60-1bd8bd7f9078.png',
      categories: [
        {
          title: 'শরীর ও এনার্জি',
          icon: 'Zap',
          items: [
            { title: 'দ্রুত এনার্জি বুস্ট', desc: 'মাত্র 30 মিনিটে এনার্জি অন' },
            { title: 'ফোকাস ও কনসেনট্রেশন', desc: 'কাজে ব্রেইন ফগ কমাতে হেল্প করে' },
            { title: 'ব্লাড সার্কুলেশন সাপোর্ট', desc: 'ফ্রেশ ও সজীব অনুভূতি' }
          ]
        },
        {
          title: 'কনফিডেন্স ও পারফরম্যান্স',
          icon: 'Shield',
          items: [
            { title: 'স্ট্যামিনা সাপোর্ট', desc: 'দীর্ঘ সময় এনার্জি ধরে রাখতে সহায়ক' },
            { title: 'স্ট্রেস রিলিফ সাপোর্ট', desc: 'টেনশন কমিয়ে রিল্যাক্স ফিল' },
            { title: 'কনফিডেন্স বুস্ট', desc: 'নিজের উপর বিশ্বাস বাড়াতে সহায়ক' }
          ]
        }
      ],
      ctaText: 'আজই ট্রাই করুন – স্টক শেষ হওয়ার আগেই'
    },
    beforeAfter: {
      title: 'Extrimshot ব্যবহারের আগে ও পরে',
      before: {
        title: 'আগে',
        items: ['দ্রুত ক্লান্ত হয়ে যাওয়া', 'কম এনার্জি ফিল করা', 'কনফিডেন্স কম থাকা', 'স্ট্রেস ও টেনশন']
      },
      after: {
        title: 'পরে',
        items: ['সারাদিন এনার্জেটিক থাকা', 'শক্তি ও স্ট্যামিনা বৃদ্ধি', 'আত্মবিশ্বাস বাড়া', 'রিল্যাক্স ও ফ্রেশ ফিলিং']
      }
    },
    stats: {
      items: [
        { value: '১,০০,০০০+', label: 'সন্তুষ্ট কাস্টমার' },
        { value: '৯৮%', label: 'পজিটিভ রিভিউ' },
        { value: '৫০+', label: 'জেলা কভারেজ' },
        { value: '২৪/৭', label: 'কাস্টমার সাপোর্ট' }
      ]
    },
    howToUse: {
      title: 'কীভাবে ব্যবহার করবেন?',
      subtitle: 'সঠিক নিয়মে ব্যবহার করলে সেরা ফলাফল পাবেন',
      steps: [
        { step: '১', title: 'সকালে খালি পেটে', desc: 'প্রতিদিন সকালে ১ চামচ খালি পেটে খান' },
        { step: '২', title: 'পানির সাথে মিশিয়ে', desc: 'হালকা গরম পানির সাথে মিশিয়ে পান করুন' },
        { step: '৩', title: 'নিয়মিত সেবন', desc: 'সেরা ফলাফলের জন্য নিয়মিত সেবন করুন' }
      ]
    },
    order: {
      title: 'আজই অর্ডার করুন',
      subtitle: 'সীমিত সময়ের জন্য বিশেষ অফার',
      packages: [
        { id: '1pack', name: '১ প্যাক', quantity: '১ মাসের কোর্স', price: 1250, originalPrice: 2500, savings: '৫০% সেভ' },
        { id: '2pack', name: '২ প্যাক', quantity: '২ মাসের কোর্স', price: 2200, originalPrice: 5000, popular: true, savings: '৫৬% সেভ' },
        { id: '3pack', name: '৩ প্যাক', quantity: '৩ মাসের কোর্স', price: 3000, originalPrice: 7500, savings: '৬০% সেভ' }
      ]
    },
    finalCta: {
      title: 'আর দেরি কেন? আজই শুরু করুন!',
      subtitle: 'হাজারো মানুষ ইতিমধ্যে উপকৃত হয়েছেন। এবার আপনার পালা।',
      ctaText: 'এখনই অর্ডার করুন'
    }
  },
  diabeticpack: {
    slug: 'diabeticpack',
    hero: {
      title: 'প্রাকৃতিক উপায়ে ডায়াবেটিস নিয়ন্ত্রণ করুন - কোন কেমিক্যাল নেই, শুধু প্রকৃতির শক্তি',
      subtitle: 'ডায়াবেটিক কেয়ার প্যাক - ১০০% ভেষজ ও প্রাকৃতিক উপাদানে তৈরি। রক্তে শর্করার মাত্রা স্বাভাবিক রাখতে সাহায্য করে। কোন সাইড ইফেক্ট নেই।',
      badges: [
        { text: '১০০% প্রাকৃতিক ভেষজ' },
        { text: 'ক্যাশ অন ডেলিভারি' },
        { text: '৫০,০০০+ সন্তুষ্ট রোগী' }
      ],
      ctaText: 'এখনই অর্ডার করুন',
      discount: '৪৮% ছাড়',
      features: [
        { icon: 'Leaf', title: 'ভেষজ সূত্র', desc: 'প্রাকৃতিক উপাদানে তৈরি' },
        { icon: 'Heart', title: 'সুগার কন্ট্রোল', desc: 'রক্তে শর্করা নিয়ন্ত্রণ' },
        { icon: 'Shield', title: 'নিরাপদ ব্যবহার', desc: 'কোন পার্শ্বপ্রতিক্রিয়া নেই' },
        { icon: 'Clock', title: 'দীর্ঘমেয়াদী ফলাফল', desc: 'স্থায়ী সুস্থতা' }
      ]
    },
    about: {
      title: 'ডায়াবেটিক কেয়ার প্যাক - আয়ুর্বেদিক পদ্ধতিতে ডায়াবেটিস নিয়ন্ত্রণের সেরা সমাধান',
      image: '/lovable-uploads/7dcfcca6-53ab-4f9f-8e43-c791ff913947.jpg',
      description: 'ডায়াবেটিক কেয়ার প্যাক হলো একটি সম্পূর্ণ প্রাকৃতিক ভেষজ ফর্মুলা যা করলা, মেথি, জামের বীজ, নিম পাতা এবং অন্যান্য কার্যকরী ভেষজ উপাদান দিয়ে তৈরি। এটি প্যানক্রিয়াসকে সক্রিয় করে ইনসুলিন উৎপাদনে সাহায্য করে।',
      tags: ['কেমিক্যাল মুক্ত', 'ডাক্তার পরামর্শিত', 'দৈনিক ব্যবহারে নিরাপদ'],
      additionalInfo: 'আমাদের ভেষজ ফর্মুলা শত বছরের আয়ুর্বেদিক জ্ঞান ও আধুনিক গবেষণার সমন্বয়ে তৈরি। নিয়মিত সেবনে রক্তে শর্করার মাত্রা স্বাভাবিক থাকে।'
    },
    benefits: {
      title: 'ডায়াবেটিক কেয়ার প্যাক থেকে আপনি যা পাবেন',
      subtitle: 'হাজারো ডায়াবেটিস রোগী ইতিমধ্যে উপকৃত হয়েছেন',
      image: '/lovable-uploads/ab2d8092-bf7e-45d2-84d0-37f1ace163c4.jpg',
      categories: [
        {
          title: 'সুগার নিয়ন্ত্রণ',
          icon: 'Activity',
          items: [
            { title: 'রক্তে শর্করা নিয়ন্ত্রণ', desc: 'ফাস্টিং ও পোস্ট প্রান্ডিয়াল সুগার কমায়' },
            { title: 'HbA1c উন্নতি', desc: 'দীর্ঘমেয়াদী সুগার কন্ট্রোল' },
            { title: 'ইনসুলিন সেনসিটিভিটি', desc: 'শরীরের ইনসুলিন ব্যবহার উন্নত করে' }
          ]
        },
        {
          title: 'সার্বিক স্বাস্থ্য',
          icon: 'Heart',
          items: [
            { title: 'এনার্জি বৃদ্ধি', desc: 'দুর্বলতা ও ক্লান্তি দূর করে' },
            { title: 'কিডনি সুরক্ষা', desc: 'ডায়াবেটিক নেফ্রোপ্যাথি প্রতিরোধে সহায়ক' },
            { title: 'চোখের যত্ন', desc: 'ডায়াবেটিক রেটিনোপ্যাথি প্রতিরোধে সহায়ক' }
          ]
        }
      ],
      ctaText: 'এখনই অর্ডার করুন - সুস্থ জীবনের শুরু হোক আজ থেকে'
    },
    beforeAfter: {
      title: 'ডায়াবেটিক কেয়ার প্যাক ব্যবহারের আগে ও পরে',
      before: {
        title: 'ব্যবহারের আগে',
        items: ['উচ্চ রক্তে শর্করা', 'ক্লান্তি ও দুর্বলতা', 'ঘন ঘন প্রস্রাব', 'অতিরিক্ত তৃষ্ণা', 'ক্ষত শুকাতে দেরি']
      },
      after: {
        title: 'নিয়মিত ব্যবহারের পর',
        items: ['নিয়ন্ত্রিত সুগার লেভেল', 'শক্তি ও স্ফূর্তি', 'স্বাভাবিক প্রস্রাব', 'তৃষ্ণা নিয়ন্ত্রণ', 'দ্রুত ক্ষত নিরাময়']
      }
    },
    stats: {
      items: [
        { value: '৫০,০০০+', label: 'সন্তুষ্ট রোগী' },
        { value: '৯৫%', label: 'সুগার নিয়ন্ত্রণে সফল' },
        { value: '৬৪', label: 'জেলায় ডেলিভারি' },
        { value: '১০০%', label: 'প্রাকৃতিক উপাদান' }
      ]
    },
    howToUse: {
      title: 'কীভাবে সেবন করবেন?',
      subtitle: 'সঠিক নিয়মে সেবন করলে দ্রুত ফলাফল পাবেন',
      steps: [
        { step: '১', title: 'সকালে খালি পেটে', desc: 'প্রতিদিন সকালে নাস্তার ৩০ মিনিট আগে ১ চামচ' },
        { step: '২', title: 'রাতে ঘুমানোর আগে', desc: 'রাতে খাবার ২ ঘন্টা পর ১ চামচ সেবন করুন' },
        { step: '৩', title: 'নিয়মিত চেকআপ', desc: 'প্রতি সপ্তাহে সুগার লেভেল পরীক্ষা করুন' }
      ]
    },
    order: {
      title: 'আজই অর্ডার করুন',
      subtitle: 'সীমিত সময়ের জন্য বিশেষ ছাড়',
      packages: [
        { id: '1pack', name: '১ প্যাক', quantity: '১ মাসের কোর্স', price: 1450, originalPrice: 2800, savings: '৪৮% সেভ' },
        { id: '2pack', name: '২ প্যাক', quantity: '২ মাসের কোর্স', price: 2600, originalPrice: 5600, popular: true, savings: '৫৪% সেভ' },
        { id: '3pack', name: '৩ প্যাক', quantity: '৩ মাসের কোর্স', price: 3600, originalPrice: 8400, savings: '৫৭% সেভ' }
      ]
    },
    finalCta: {
      title: 'সুস্থ জীবনের জন্য আজই শুরু করুন!',
      subtitle: 'প্রাকৃতিক উপায়ে ডায়াবেটিস নিয়ন্ত্রণ করুন। হাজারো মানুষ ইতিমধ্যে সুফল পেয়েছেন।',
      ctaText: 'এখনই অর্ডার করুন'
    }
  }
};

export const getProductContent = (slug: string): ProductContent | undefined => {
  return productContents[slug];
};
