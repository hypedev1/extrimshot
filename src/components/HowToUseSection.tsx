import { Circle, AlertTriangle } from 'lucide-react';

export const HowToUseSection = () => {
  const steps = [
    'প্রয়োজন অনুযায়ী দিনে ১ শট',
    'খালি পেটে না, হালকা খাবারের পর',
    'হাল্কা গরম পানি বা দুধের সাথে ১ চামুচ মিক্স করে খাবেন',
    '১৮+ বয়সের জন্য',
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-card/50">
      <div className="container max-w-3xl">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
          কীভাবে ব্যবহার করবেন?
        </h2>

        <div className="space-y-4 mb-8">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-4 bg-card/80 rounded-xl p-4 border border-border">
              <Circle className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
              <span>{step}</span>
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
