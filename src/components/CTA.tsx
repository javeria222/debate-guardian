import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex p-4 rounded-2xl bg-accent/20 mb-8">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>

          {/* Headline */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform
            <br />
            Your Debates?
          </h2>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 font-body max-w-xl mx-auto">
            Join thousands of critical thinkers using AI-powered analysis 
            to elevate discourse and pursue truth.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="group">
              Get Started Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              variant="heroOutline" 
              size="xl"
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Schedule Demo
            </Button>
          </div>

          {/* Trust note */}
          <p className="mt-8 text-sm text-primary-foreground/50 font-body">
            No credit card required • Free tier available • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
