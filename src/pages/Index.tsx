import { AnnouncementBar } from '@/components/AnnouncementBar';
import { RecentPurchasePopup } from '@/components/RecentPurchasePopup';
import { HeroSection } from '@/components/HeroSection';
import { AboutSection } from '@/components/AboutSection';
import { BenefitsSection } from '@/components/BenefitsSection';
import { TargetAudienceSection } from '@/components/TargetAudienceSection';
import { BeforeAfterSection } from '@/components/BeforeAfterSection';
import { StatsSection } from '@/components/StatsSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { HowToUseSection } from '@/components/HowToUseSection';
import { QualitySection } from '@/components/QualitySection';
import { OrderSection } from '@/components/OrderSection';
import { FinalCTASection } from '@/components/FinalCTASection';
const Index = () => {
  return <div className="min-h-screen bg-background relative">
      {/* Background Grid Pattern with Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 animate-grid-glow" style={{
      backgroundImage: `
            linear-gradient(to right, hsl(var(--primary) / 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.15) 1px, transparent 1px)
          `,
      backgroundSize: '60px 60px'
    }} />
      {/* Gradient overlay for depth */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
      background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 100%, hsl(var(--accent) / 0.05) 0%, transparent 50%)
          `
    }} />
      <div className="relative z-10">
        <AnnouncementBar />
        <RecentPurchasePopup />
        <HeroSection />
        <AboutSection />
        <BenefitsSection />
        
        <BeforeAfterSection />
        <StatsSection />
        <TestimonialsSection />
        <HowToUseSection />
        <QualitySection />
        <OrderSection />
        <FinalCTASection />
      </div>
    </div>;
};
export default Index;