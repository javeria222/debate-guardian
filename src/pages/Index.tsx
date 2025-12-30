import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DebateDemo from "@/components/DebateDemo";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <DebateDemo />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
