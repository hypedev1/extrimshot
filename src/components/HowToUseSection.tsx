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

  const stepColors = [
    'from-primary to-teal-dark',
    'from-accent to-orange',
    'from-green to-emerald-600'
  ];

  return (
    <section className="py-10 md:py-16 px-4 bg-gradient-to-b from-background to-card/30">
      <div className="container max-w-4xl">
        {/* Header - Compact */}
        <div className="text-center mb-6 md:mb-10">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-2">
            📋 ব্যবহারবিধি
          </span>
          <h2 className="text-lg md:text-3xl font-bold text-foreground mb-1 md:mb-2">
            {data.title}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {data.subtitle}
          </p>
        </div>

        {/* Steps - Compact Infographic Style */}
        <div className="relative mb-6 md:mb-10">
          {/* Horizontal timeline line - desktop only */}
          <div className="hidden md:block absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-primary via-accent to-green z-0" />
          
          {/* Steps grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-6 relative z-10">
            {data.steps.map((step, i) => (
              <div key={i} className="text-center group">
                {/* Step number circle */}
                <div className="relative inline-block mb-2 md:mb-4">
                  <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${stepColors[i]} text-white text-lg md:text-2xl font-bold flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {step.step}
                  </div>
                  {/* Pulse effect */}
                  <div className={`absolute inset-0 w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${stepColors[i]} opacity-30 animate-ping`} style={{ animationDuration: '2s' }} />
                </div>
                
                {/* Content card */}
                <div className="bg-card/80 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
                  <h3 className="font-bold text-[11px] md:text-base text-foreground mb-0.5 md:mb-1 leading-tight">{step.title}</h3>
                  <p className="text-[9px] md:text-sm text-muted-foreground leading-snug">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro tips - Compact horizontal layout */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg md:rounded-xl p-2.5 md:p-4">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-primary to-teal-dark flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-[11px] md:text-sm text-foreground mb-0.5 leading-tight">সেরা ফলাফল</h4>
                <p className="text-[9px] md:text-xs text-muted-foreground leading-snug">নিয়মিত ব্যবহার করুন</p>
              </div>
            </div>
          </div>

          <div className="bg-red/5 border border-red/20 rounded-lg md:rounded-xl p-2.5 md:p-4">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-red to-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-[11px] md:text-sm text-foreground mb-0.5 leading-tight">সতর্কতা</h4>
                <p className="text-[9px] md:text-xs text-muted-foreground leading-snug">প্রেগন্যান্ট মহিলাদের জন্য নয়</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
