export const StatsSection = () => {
  const stats = [
    { value: '৯৩%', label: 'স্যাটিস্ফাইড কাস্টমার' },
    { value: '১০,০০০+', label: 'বোতল সোল্ড (৩০ দিনে)' },
    { value: '৬৫%', label: 'রিপিট অর্ডার করেছেন' },
  ];

  return (
    <section className="py-12 px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
      <div className="container">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
          ১০০০০+ সন্তুষ্ট কাস্টমার
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          আপনার মতোই সাধারণ মানুষের বাস্তব অভিজ্ঞতা
        </p>

        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-gradient mb-2">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
