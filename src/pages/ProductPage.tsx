import { useParams, Navigate } from 'react-router-dom';
import { products } from '@/data/products';
import { getProductContent } from '@/data/productContent';
import { Header } from '@/components/home/Header';
import { Footer } from '@/components/home/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { RecentPurchasePopup } from '@/components/RecentPurchasePopup';
import { HeroSection } from '@/components/HeroSection';
import { AboutSection } from '@/components/AboutSection';
import { BenefitsSection } from '@/components/BenefitsSection';
import { BeforeAfterSection } from '@/components/BeforeAfterSection';
import { StatsSection } from '@/components/StatsSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { HowToUseSection } from '@/components/HowToUseSection';
import { OrderSection } from '@/components/OrderSection';
import { FinalCTASection } from '@/components/FinalCTASection';

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const product = products.find(p => p.slug === slug);
  const productContent = slug ? getProductContent(slug) : undefined;
  
  if (!product) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div 
        className="fixed inset-0 pointer-events-none z-0 animate-grid-glow" 
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary) / 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} 
      />
      
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 100%, hsl(var(--accent) / 0.05) 0%, transparent 50%)
          `
        }} 
      />
      
      <div className="relative z-10">
        {slug !== 'diabeticpack' && <Header />}
        <AnnouncementBar />
        <RecentPurchasePopup />
        <HeroSection content={productContent?.hero} />
        <AboutSection content={productContent?.about} />
        <BenefitsSection content={productContent?.benefits} />
        <BeforeAfterSection content={productContent?.beforeAfter} />
        <StatsSection content={productContent?.stats} />
        <TestimonialsSection />
        <HowToUseSection content={productContent?.howToUse} />
        <OrderSection content={productContent?.order} />
        <FinalCTASection content={productContent?.finalCta} />
        <Footer />
      </div>
    </div>
  );
};

export default ProductPage;
