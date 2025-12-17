import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const HeroBanner = () => {
  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 text-sm animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">বাংলাদেশের #১ অর্গানিক ব্র্যান্ড</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-up">
              প্রকৃতির শক্তি,{' '}
              <span className="text-gradient">আপনার সুস্থতায়</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 animate-slide-up delay-100">
              ১০০% প্রাকৃতিক ও অর্গানিক পণ্যের সমাহার। কোন কেমিক্যাল নেই, শুধু বিশুদ্ধতা ও ভালোবাসা।
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up delay-200">
              <Link to="/powerbooster">
                <Button className="btn-primary text-lg px-8 py-6 group">
                  পণ্য দেখুন
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-secondary/50">
                আমাদের সম্পর্কে
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-4 animate-fade-in delay-300">
              {[
                { icon: Shield, text: '১০০% অরিজিনাল' },
                { icon: Truck, text: 'ক্যাশ অন ডেলিভারি' },
                { icon: Sparkles, text: '৫০% ছাড়' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-accent" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image/visual */}
          <div className="relative animate-float">
            <div className="relative mx-auto w-80 h-80 md:w-96 md:h-96">
              {/* Glowing background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 rounded-full blur-2xl animate-pulse" />
              
              {/* Decorative circles */}
              <div className="absolute inset-4 border-2 border-primary/20 rounded-full animate-spin-slow" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-8 border-2 border-accent/20 rounded-full animate-spin-slow" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
              
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl md:text-7xl mb-4">🌿</div>
                  <p className="text-xl md:text-2xl font-bold text-gradient">অর্গানিক</p>
                  <p className="text-muted-foreground">বাংলাদেশ</p>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl p-3 shadow-lg animate-bounce-slow">
                <div className="text-2xl">⚡</div>
                <p className="text-xs font-medium">শক্তি</p>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-3 shadow-lg animate-bounce-slow delay-500">
                <div className="text-2xl">💚</div>
                <p className="text-xs font-medium">স্বাস্থ্য</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
