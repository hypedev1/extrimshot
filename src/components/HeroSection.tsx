import { Check, Zap, Dumbbell, FlaskConical, Lock } from 'lucide-react';
import productImage from '@/assets/nobosokti-product.png';
export const HeroSection = () => {
  return <section className="py-12 md:py-20 px-4">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            ডক্টর এ আর খান এর রেকমেন্ডেড প্রডাক্ট এক্সট্রিমশট, যা খেলে যৌন জীবন হবে শান্তিপূর্ণ ইনশা আল্লাহ
            <span className="text-gradient"></span>
          </h1>
          
          {/* YouTube Shorts Video */}
          <div className="flex justify-center mb-8">
            <div className="w-[300px] h-[533px] md:w-[360px] md:h-[640px] rounded-2xl overflow-hidden shadow-2xl">
              <iframe src="https://www.youtube.com/embed/iOaQbkKdlYA?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=iOaQbkKdlYA&playsinline=1" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Product Video" />
            </div>
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            দিনের ক্লান্তি, স্ট্রেস, লো এনার্জি… সব ভুলে আবারও অনুভব করুন তরুন উদ্যম, স্ট্রং পারফরম্যান্স আর কনফিডেন্ট{' '}
            <span className="text-primary font-semibold">পূনর্বল – ন্যাচারাল পাওয়ার বুস্টার</span> এর সাথে।
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Product Image */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <img alt="Nobosokti Product" className="relative z-10 rounded-2xl shadow-2xl max-w-[350px] md:max-w-[400px] animate-float" src="/lovable-uploads/acfcf931-2261-40e7-b2ab-6d20cc99533f.png" />
            </div>
          </div>

          {/* Features */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
              {[{
              icon: Check,
              text: 'কোন প্রকার কেমিকেল নেই',
              color: 'text-accent'
            }, {
              icon: Check,
              text: 'Cash on Delivery',
              color: 'text-accent'
            }, {
              icon: Check,
              text: '100000+ কাস্টমার',
              color: 'text-accent'
            }].map((item, i) => <div key={i} className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>)}
            </div>

            <a href="#order" className="btn-primary block text-center text-lg pulse-glow">
              এখনই অর্ডার করুন – ৫০% ডিসকাউন্ট
            </a>

            <p className="text-center text-red font-medium animate-pulse">
              ⏰ স্টক সীমিত – মাত্র 49 টি বাকি!
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              {[{
              icon: Zap,
              title: 'তাৎক্ষণিক এনার্জি',
              desc: '৩০ মিনিটে পাওয়ার বুস্ট'
            }, {
              icon: Dumbbell,
              title: 'স্ট্যামিনা সাপোর্ট',
              desc: 'দীর্ঘক্ষণ এনার্জি ধরে রাখুন'
            }, {
              icon: FlaskConical,
              title: '১০০% ন্যাচারাল',
              desc: 'স্টেরয়েড ও কেমিক্যাল মুক্ত'
            }, {
              icon: Lock,
              title: 'ডিসক্রিট প্যাকেজিং',
              desc: 'সম্পূর্ণ গোপনীয়তা'
            }].map((item, i) => <div key={i} className="card-glass p-4 text-center">
                  <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </section>;
};