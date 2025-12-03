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
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <RecentPurchasePopup />
      <HeroSection />
      <AboutSection />
      <BenefitsSection />
      <TargetAudienceSection />
      <BeforeAfterSection />
      <StatsSection />
      <TestimonialsSection />
      <HowToUseSection />
      <QualitySection />
      <OrderSection />
      <FinalCTASection />
    </div>
  );
};

export default Index;
