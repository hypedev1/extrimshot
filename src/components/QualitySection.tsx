import { FlaskConical, Award, CheckCircle, Package } from 'lucide-react';

export const QualitySection = () => {
  const features = [
    { icon: FlaskConical, text: 'ল্যাব টেস্টেড ফর্মুলা' },
    { icon: Award, text: 'GMP স্ট্যান্ডার্ড ফ্যাসিলিটিতে প্রডাকশন' },
    { icon: CheckCircle, text: 'প্রত্যেক ব্যাচ কোয়ালিটি চেকের মাধ্যমে রিলিজ' },
    { icon: Package, text: 'হাইজেনিক, সিলড প্যাকেজিং' },
  ];

  return (
    <section className="py-16 px-4">
      <div className="container max-w-4xl">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
          কোয়ালিটি ও সেফটি – আমরা কেন আলাদা?
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {features.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-card/80 rounded-xl p-5 border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
