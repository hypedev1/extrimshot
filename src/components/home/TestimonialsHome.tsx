import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'আহমেদ হোসেন',
    location: 'ঢাকা',
    rating: 5,
    text: 'পাওয়ার বুস্টার ব্যবহার করে অনেক উপকার পেয়েছি। সত্যিই কার্যকরী পণ্য।',
    product: 'পাওয়ার বুস্টার',
    avatar: '👨'
  },
  {
    name: 'রহিমা বেগম',
    location: 'চট্টগ্রাম',
    rating: 5,
    text: 'ডায়াবেটিক প্যাক নিয়মিত খাচ্ছি, রক্তে শর্করা অনেক ভালো আছে এখন।',
    product: 'ডায়াবেটিক প্যাক',
    avatar: '👩'
  },
  {
    name: 'করিম মিয়া',
    location: 'সিলেট',
    rating: 5,
    text: 'ক্যাশ অন ডেলিভারি সুবিধা পেয়ে খুবই খুশি। পণ্যের মানও অসাধারণ।',
    product: 'ইমিউনিটি বুস্টার',
    avatar: '👨'
  },
  {
    name: 'ফাতেমা খাতুন',
    location: 'রাজশাহী',
    rating: 5,
    text: 'হার্বাল হেয়ার অয়েল ব্যবহারে চুল পড়া কমেছে। ধন্যবাদ নোবোশক্তি।',
    product: 'হার্বাল হেয়ার অয়েল',
    avatar: '👩'
  }
];

export const TestimonialsHome = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            গ্রাহক মতামত
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            আমাদের সন্তুষ্ট <span className="text-gradient">গ্রাহকদের কথা</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            হাজারো গ্রাহক আমাদের পণ্য ব্যবহার করে উপকৃত হয়েছেন
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="card-glass p-6 relative group hover:border-primary/50 transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Text */}
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Product badge */}
              <span className="inline-block text-xs bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                {testimonial.product}
              </span>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '১,০০,০০০+', label: 'সন্তুষ্ট গ্রাহক' },
            { value: '৫০+', label: 'প্রিমিয়াম পণ্য' },
            { value: '৬৪', label: 'জেলায় ডেলিভারি' },
            { value: '৪.৯/৫', label: 'গড় রেটিং' }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl bg-secondary/30">
              <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">{stat.value}</p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
