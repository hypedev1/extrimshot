import { Circle, AlertTriangle } from 'lucide-react';

interface HowToUseContent {
  title: string;
  subtitle: string;
  steps: { step: string; title: string; desc: string }[];
}

interface HowToUseSectionProps {
  content?: HowToUseContent;
}

export const HowToUseSection = ({ content }: HowToUseSectionProps) => {
  const defaultContent: HowToUseContent = {
    title: 'কীভাবে ব্যবহার করবেন?',
    subtitle: 'সঠিক নিয়মে ব্যবহার করলে সেরা ফলাফল পাবেন',
    steps: [
      { step: '১', title: 'দিনে ১ চামুচ', desc: 'প্রতিদিন ১ চামচ সেবন করুন' },
      { step: '২', title: 'হালকা খাবারের পর', desc: 'খালি পেটে না, হালকা খাবারের পর খান' },
      { step: '৩', title: 'পানি বা দুধের সাথে', desc: 'হাল্কা গরম পানি বা দুধের সাথে মিক্স করে খাবেন' }
    ]
  };

  const data = content || defaultContent;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-card/50">
      <div className="container max-w-3xl">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
          {data.title}
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          {data.subtitle}
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {data.steps.map((step, i) => (
            <div key={i} className="text-center bg-card/80 rounded-xl p-6 border border-border">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                {step.step}
              </div>
              <h3 className="font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-red/10 border border-red/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            প্রেগন্যান্ট ও সিরিয়াস মেডিকেল কন্ডিশন থাকলে অবশ্যই ডাক্তারের পরামর্শ নিন।
          </p>
        </div>
      </div>
    </section>
  );
};
