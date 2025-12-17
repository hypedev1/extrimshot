import { Truck, Shield, Leaf, HeadphonesIcon, CreditCard, Award } from 'lucide-react';

const features = [
  {
    icon: Leaf,
    title: '১০০% অর্গানিক',
    description: 'সম্পূর্ণ প্রাকৃতিক উপাদান',
    color: 'text-accent'
  },
  {
    icon: Truck,
    title: 'দ্রুত ডেলিভারি',
    description: 'সারা বাংলাদেশে ২-৫ দিনে',
    color: 'text-primary'
  },
  {
    icon: CreditCard,
    title: 'ক্যাশ অন ডেলিভারি',
    description: 'পণ্য পেয়ে টাকা দিন',
    color: 'text-accent'
  },
  {
    icon: Shield,
    title: 'মানি ব্যাক গ্যারান্টি',
    description: 'সন্তুষ্ট না হলে টাকা ফেরত',
    color: 'text-primary'
  },
  {
    icon: HeadphonesIcon,
    title: '২৪/৭ সাপোর্ট',
    description: 'যেকোনো সময় যোগাযোগ করুন',
    color: 'text-accent'
  },
  {
    icon: Award,
    title: 'প্রিমিয়াম কোয়ালিটি',
    description: 'শুধুমাত্র সেরা মানের পণ্য',
    color: 'text-primary'
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-card/50 border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
