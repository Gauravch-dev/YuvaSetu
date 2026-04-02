import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { CompanyCarousel } from '@/components/CompanyCarousel';
import { FeaturedJobsSection } from '@/components/sections/FeaturedJobsSection';
import { FlowGraph3DSection } from '@/components/sections/FlowGraph3DSection';
import { MatchingEngineSection } from '@/components/sections/MatchingEngineSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { Footer } from '@/components/Footer';
import { FloatingCTA } from '@/components/FloatingCTA';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>YuvaSetu - AI-Powered Job Recommendation Engine | End Opportunity Fatigue</title>
        <meta name="description" content="YuvaSetu is an AI-powered career platform that eliminates opportunity fatigue with transparent job matching. Get matched with your top 5 relevant jobs using Explainable AI." />
        <meta name="keywords" content="job portal, AI job matching, career platform, student jobs, YuvaSetu, Team Havoc" />
      </Helmet>
      
      <main className="bg-background">
        <Navbar />
        <HeroSection />
        <CompanyCarousel />
        <FeaturedJobsSection />
        <FlowGraph3DSection />
        <MatchingEngineSection />
        <TestimonialsSection />
        <FAQSection />
        <Footer />
        <FloatingCTA />
      </main>
    </>
  );
};

export default Index;
