import { Header } from '@/components/home/Header';
import { HeroBanner } from '@/components/home/HeroBanner';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { ProductsSection } from '@/components/home/ProductsSection';
import { TestimonialsHome } from '@/components/home/TestimonialsHome';
import { Footer } from '@/components/home/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 animate-grid-glow opacity-30" 
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} 
      />
      
      {/* Gradient overlays */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 50% -20%, hsl(var(--primary) / 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 80% 50% at 80% 100%, hsl(var(--accent) / 0.08) 0%, transparent 50%)
          `
        }} 
      />
      
      <div className="relative z-10">
        <Header />
        <main>
          <HeroBanner />
          <FeaturesSection />
          <ProductsSection />
          <TestimonialsHome />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Home;
