import { Zap, Brain, Heart, Battery, Smile, Shield } from 'lucide-react';
export const BenefitsSection = () => {
  return <section className="py-16 px-4">
      <div className="container">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
          <span className="text-gradient">Extrimshot</span> থেকে আপনি কী কী উপকার পেতে পারেন?
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          হাজারো সন্তুষ্ট কাস্টমারের বাস্তব অভিজ্ঞতা
        </p>

        <div className="flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1">
            <img alt="Confident Man" className="rounded-2xl shadow-xl w-full max-w-sm mx-auto" src="/lovable-uploads/aeca2ff1-3195-4d8b-ac60-1bd8bd7f9078.png" />
          </div>

          <div className="flex-1 grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                শরীর ও এনার্জি
              </h3>
              {[{
              icon: Battery,
              title: 'দ্রুত এনার্জি বুস্ট',
              desc: 'মাত্র 30 মিনিটে এনার্জি অন'
            }, {
              icon: Brain,
              title: 'ফোকাস ও কনসেনট্রেশন',
              desc: 'কাজে ব্রেইন ফগ কমাতে হেল্প করে'
            }, {
              icon: Heart,
              title: 'ব্লাড সার্কুলেশন সাপোর্ট',
              desc: 'ফ্রেশ ও সজীব অনুভূতি'
            }].map((item, i) => <div key={i} className="flex items-start gap-3 bg-card/50 rounded-xl p-4 border border-border">
                  <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>)}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                কনফিডেন্স ও পারফরম্যান্স
              </h3>
              {[{
              icon: Battery,
              title: 'স্ট্যামিনা সাপোর্ট',
              desc: 'দীর্ঘ সময় এনার্জি ধরে রাখতে সহায়ক'
            }, {
              icon: Smile,
              title: 'স্ট্রেস রিলিফ সাপোর্ট',
              desc: 'টেনশন কমিয়ে রিল্যাক্স ফিল'
            }, {
              icon: Shield,
              title: 'কনফিডেন্স বুস্ট',
              desc: 'নিজের উপর বিশ্বাস বাড়াতে সহায়ক'
            }].map((item, i) => <div key={i} className="flex items-start gap-3 bg-card/50 rounded-xl p-4 border border-border">
                  <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>)}
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <a href="#order" className="btn-primary inline-block">
            আজই ট্রাই করুন – স্টক শেষ হওয়ার আগেই
          </a>
        </div>
      </div>
    </section>;
};