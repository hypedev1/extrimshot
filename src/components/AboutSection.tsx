import { Check, Award, Beaker, ShieldCheck } from 'lucide-react';

interface AboutContent {
  title: string;
  image: string;
  description: string;
  tags: string[];
  additionalInfo: string;
}

interface AboutSectionProps {
  content?: AboutContent;
}

export const AboutSection = ({ content }: AboutSectionProps) => {
  const defaultContent: AboutContent = {
    title: 'Extrimshot ন্যাচারাল পাওয়ার বুস্টার',
    image: '/lovable-uploads/12a04d91-3d2a-4274-8e85-16c00eae429a.png',
    description: 'Extrimshot হলো একটি প্রাকৃতিক হার্বাল পাওয়ার বুস্টার শট।',
    tags: ['১০০% হার্বাল', 'স্টেরয়েড ফ্রি', 'নন-অ্যাডিক্টিভ'],
    additionalInfo: 'রিসার্চড ডোজে ব্যবহার করা উপাদানের জন্য এটি সেফভাবে কাজ করার জন্য তৈরি করা হয়েছে।'
  };

  const data = content || defaultContent;

  const highlights = [
    { icon: Award, text: 'প্রিমিয়াম কোয়ালিটি' },
    { icon: Beaker, text: 'ল্যাব টেস্টেড' },
    { icon: ShieldCheck, text: 'সম্পূর্ণ নিরাপদ' }
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <div className="section-divider" />
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            {data.title}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-5xl mx-auto">
          {/* Image with decorative elements */}
          <div className="flex-1 relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
            <div className="relative bg-gradient-to-br from-teal-light to-background p-8 rounded-3xl">
              <img 
                alt="Product Image" 
                className="w-full max-w-xs mx-auto drop-shadow-xl" 
                src={data.image} 
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {data.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-3">
              {data.tags.map((item, i) => (
                <span key={i} className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  {item}
                </span>
              ))}
            </div>

            <p className="text-muted-foreground">
              {data.additionalInfo}
            </p>

            {/* Highlight boxes */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {highlights.map((item, i) => (
                <div key={i} className="text-center p-4 bg-card rounded-xl border border-border">
                  <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};