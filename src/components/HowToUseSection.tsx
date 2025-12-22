import { AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <div className="section-divider" />
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            {data.title}
          </h2>
          <p className="text-muted-foreground">
            {data.subtitle}
          </p>
        </div>

        {/* Steps - Infographic Timeline Style */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {data.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="bg-background p-2 inline-block mb-4">
                  <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground text-3xl font-bold flex items-center justify-center mx-auto shadow-lg">
                    {step.step}
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                  <h3 className="font-bold text-lg text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro tips */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-1">সেরা ফলাফলের জন্য</h4>
                <p className="text-sm text-muted-foreground">নিয়মিত ব্যবহার করুন এবং স্বাস্থ্যকর জীবনযাপন বজায় রাখুন।</p>
              </div>
            </div>
          </div>

          <div className="bg-red/5 border border-red/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red" />
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-1">সতর্কতা</h4>
                <p className="text-sm text-muted-foreground">প্রেগন্যান্ট ও সিরিয়াস মেডিকেল কন্ডিশন থাকলে অবশ্যই ডাক্তারের পরামর্শ নিন।</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};