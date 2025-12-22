import { Users, Package, Repeat, Star } from 'lucide-react';

interface StatsContent {
  items: { value: string; label: string }[];
}

interface StatsSectionProps {
  content?: StatsContent;
}

const iconList = [Users, Package, Repeat, Star];

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
    <section className="py-16 md:py-20 px-4 bg-primary">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-3">
            সন্তুষ্ট কাস্টমার
          </h2>
          <p className="text-primary-foreground/80">
            আপনার মতোই সাধারণ মানুষের বাস্তব অভিজ্ঞতা
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {data.items.map((stat, i) => {
            const IconComponent = iconList[i % iconList.length];
            return (
              <div key={i} className="text-center bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
                <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  {stat.value}
                </div>
                <p className="text-sm text-primary-foreground/80">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};