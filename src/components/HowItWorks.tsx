import { Users, MessageSquare, Brain, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Create or Join a Room",
    description: "Set up a debate room with your chosen topic, invite participants, and define the format—from formal Oxford-style to open discussion.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Present Your Arguments",
    description: "Speakers take turns presenting their positions. Every claim is captured and prepared for analysis in real-time.",
  },
  {
    number: "03",
    icon: Brain,
    title: "AI Analysis in Action",
    description: "Our AI moderator continuously checks facts, identifies fallacies, and evaluates argument strength without interrupting the flow.",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Review & Archive",
    description: "Get comprehensive summaries, performance insights, and archived transcripts for future reference and improvement.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm tracking-wide uppercase mb-4 block">
            Simple Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How Veritas Works
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            From room creation to final analysis, our platform guides you through 
            structured, productive debate.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative group"
                style={{ 
                  animationDelay: `${index * 0.15}s`,
                  opacity: 0,
                  animation: 'fade-up 0.6s ease-out forwards'
                }}
              >
                <div className="flex gap-6">
                  {/* Number & Icon */}
                  <div className="shrink-0">
                    <div className="relative">
                      <span className="block font-display text-6xl font-bold text-muted/50 group-hover:text-accent/30 transition-colors">
                        {step.number}
                      </span>
                      <div className="absolute -bottom-2 -right-2 p-3 rounded-xl bg-card border border-border shadow-md group-hover:shadow-lg group-hover:border-accent/50 transition-all">
                        <step.icon className="w-5 h-5 text-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-2">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground font-body leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector line (hidden on last item in each column) */}
                {index < steps.length - 2 && (
                  <div className="hidden md:block absolute left-10 top-24 w-px h-16 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
