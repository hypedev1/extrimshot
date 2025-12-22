import { Users, Package, MapPin, Headphones } from 'lucide-react';

interface StatsContent {
  items: { value: string; label: string }[];
}

interface StatsSectionProps {
  content?: StatsContent;
}

const iconList = [Users, Package, MapPin, Headphones];
const colorList = [
  'from-white/20 to-white/10',
  'from-accent/30 to-accent/20',
  'from-green/30 to-green/20',
  'from-white/20 to-white/10'
];

export const StatsSection = ({ content }: StatsSectionProps) => {
  const defaultContent: StatsContent = {
    items: [
      { value: '৯৩%', label: 'স্যাটিস্ফাইড কাস্টমার' },
      { value: '১০,০০০+', label: 'বোতল সোল্ড (৩০ দিনে)' },
      { value: '৬৫%', label: 'রিপিট অর্ডার করেছেন' },
      { value: '৪.৯', label: 'গড় রেটিং' }
    ]
  };

  const data = content || defaultContent;

  return (
    <section className="py-8 md:py-14 px-4 bg-gradient-to-br from-primary via-primary to-teal-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container max-w-4xl relative z-10">
        {/* Header - Compact */}
        <div className="text-center mb-5 md:mb-8">
          <h2 className="text-lg md:text-2xl font-bold text-primary-foreground mb-1">
            সন্তুষ্ট কাস্টমার
          </h2>
          <p className="text-xs md:text-sm text-primary-foreground/70">
            আপনার মতোই সাধারণ মানুষের বাস্তব অভিজ্ঞতা
          </p>
        </div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {data.items.map((stat, i) => {
            const IconComponent = iconList[i % iconList.length];
            return (
              <div 
                key={i} 
                className="text-center bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-2 md:p-5 border border-white/20 hover:bg-white/15 transition-all duration-300 group"
              >
                {/* Icon */}
                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${colorList[i]} flex items-center justify-center mx-auto mb-1.5 md:mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-4 h-4 md:w-6 md:h-6 text-white" />
                </div>
                
                {/* Value */}
                <div className="text-base md:text-2xl font-bold text-white mb-0.5 md:mb-1">
                  {stat.value}
                </div>
                
                {/* Label */}
                <p className="text-[8px] md:text-xs text-white/70 leading-tight">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
