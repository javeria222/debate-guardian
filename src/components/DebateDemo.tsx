import { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Bot,
  ChevronRight,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  speaker: string;
  role: "pro" | "con" | "ai";
  content: string;
  factCheck?: {
    status: "verified" | "unverified" | "incorrect";
    note: string;
  };
  fallacy?: {
    name: string;
    explanation: string;
  };
}

const demoMessages: Message[] = [
  {
    id: 1,
    speaker: "Speaker A",
    role: "pro",
    content: "Renewable energy sources now provide over 30% of global electricity generation, making the transition away from fossil fuels not just possible, but economically viable.",
    factCheck: {
      status: "verified",
      note: "IEA 2023 data confirms renewables reached 30% of global electricity in 2023."
    }
  },
  {
    id: 2,
    speaker: "Speaker B",
    role: "con",
    content: "That's misleading. Renewables are unreliable and every country that's tried to go 100% renewable has failed. Germany's energy costs have skyrocketed.",
    factCheck: {
      status: "unverified",
      note: "Claim about '100% renewable failures' lacks specificity. German energy costs increased due to multiple factors."
    },
    fallacy: {
      name: "Hasty Generalization",
      explanation: "Drawing broad conclusions from limited or cherry-picked examples without sufficient evidence."
    }
  },
  {
    id: 3,
    speaker: "AI Analysis",
    role: "ai",
    content: "Speaker B's response contains a hasty generalization. While energy costs in some countries have increased, attributing this solely to renewables oversimplifies a complex economic picture involving gas prices, infrastructure investments, and policy decisions. A stronger counter-argument would address specific technical limitations of renewable intermittency.",
  },
];

const DebateDemo = () => {
  const [activeMessage, setActiveMessage] = useState<number | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "incorrect":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-success/10 border-success/30 text-success";
      case "incorrect":
        return "bg-destructive/10 border-destructive/30 text-destructive";
      default:
        return "bg-warning/10 border-warning/30 text-warning";
    }
  };

  return (
    <section id="demo" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm tracking-wide uppercase mb-4 block">
            Live Preview
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            See Veritas in Action
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Watch how our AI moderator analyzes arguments, checks facts, 
            and identifies logical fallacies in real-time.
          </p>
        </div>

        {/* Demo Container */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
            {/* Demo Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Debate Room: Climate Policy
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-6">
              {demoMessages.map((message) => (
                <div
                  key={message.id}
                  className={`group cursor-pointer transition-all duration-200 ${
                    activeMessage === message.id ? "scale-[1.01]" : ""
                  }`}
                  onClick={() => setActiveMessage(activeMessage === message.id ? null : message.id)}
                >
                  <div className={`flex gap-4 ${message.role === "ai" ? "bg-accent/5 -mx-6 px-6 py-4 border-l-4 border-accent" : ""}`}>
                    {/* Avatar */}
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      message.role === "ai" 
                        ? "bg-accent text-accent-foreground" 
                        : message.role === "pro" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground"
                    }`}>
                      {message.role === "ai" ? (
                        <Bot className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-foreground">
                          {message.speaker}
                        </span>
                        {message.role === "ai" && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded-full">
                            AI Moderator
                          </span>
                        )}
                      </div>
                      <p className="text-foreground/90 leading-relaxed font-body">
                        {message.content}
                      </p>

                      {/* Fact Check Badge */}
                      {message.factCheck && (
                        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(message.factCheck.status)}`}>
                          {getStatusIcon(message.factCheck.status)}
                          <span className="capitalize">{message.factCheck.status}</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${activeMessage === message.id ? "rotate-90" : ""}`} />
                        </div>
                      )}

                      {/* Fallacy Badge */}
                      {message.fallacy && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-destructive/10 border border-destructive/30 text-destructive ml-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{message.fallacy.name}</span>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {activeMessage === message.id && (
                        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border animate-scale-in">
                          {message.factCheck && (
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-foreground">Fact Check Note:</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {message.factCheck.note}
                                </p>
                              </div>
                            </div>
                          )}
                          {message.fallacy && (
                            <div className="flex items-start gap-3 mt-3">
                              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-foreground">Fallacy Detected:</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {message.fallacy.explanation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Click on messages to see detailed analysis
                </span>
                <Button variant="hero" size="sm">
                  Try It Live
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DebateDemo;
