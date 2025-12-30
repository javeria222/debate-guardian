import { 
  CheckCircle2, 
  AlertTriangle, 
  Brain, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck 
} from "lucide-react";

const features = [
  {
    icon: CheckCircle2,
    title: "Real-Time Fact Checking",
    description: "Instant verification of claims against trusted knowledge bases. Every statement is analyzed and labeled as Verified, Unverified, or Potentially Incorrect.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: AlertTriangle,
    title: "Logical Fallacy Detection",
    description: "AI identifies common logical fallacies like ad hominem, straw man, and false dichotomies, helping maintain intellectual rigor.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: ShieldCheck,
    title: "Source Credibility",
    description: "Automatic assessment of cited sources with credibility ratings from High to Low, ensuring arguments are backed by reliable evidence.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Brain,
    title: "AI Devil's Advocate",
    description: "On-demand counter-arguments that challenge assumptions, expose logical gaps, and strengthen overall debate quality.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: MessageSquare,
    title: "Structured Analysis",
    description: "Each argument is broken down by clarity, relevance, and logical strength, providing actionable feedback for improvement.",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  {
    icon: BarChart3,
    title: "Debate Archives",
    description: "Complete transcripts with AI summaries, key arguments, and performance analytics stored for future reference and learning.",
    color: "text-foreground",
    bgColor: "bg-secondary",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm tracking-wide uppercase mb-4 block">
            Core Capabilities
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            AI-Powered Tools for
            <br />
            <span className="text-accent">Better Discourse</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Every feature designed to elevate debate quality, ensure factual accuracy, 
            and promote logical reasoning in real-time.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                animation: 'fade-up 0.6s ease-out forwards'
              }}
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-6 transition-transform group-hover:scale-110`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                {feature.description}
              </p>

              {/* Hover accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-accent/0 group-hover:bg-accent transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
