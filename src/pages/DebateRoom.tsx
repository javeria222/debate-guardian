import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Scale, ArrowLeft, Send, Users, Bot, 
  CheckCircle, XCircle, AlertTriangle, Loader2,
  Sparkles, AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  user_id: string | null;
  is_ai_response: boolean;
  created_at: string;
  profile?: {
    username: string;
  };
}

interface FactCheck {
  id: string;
  message_id: string;
  claim: string;
  status: string;
  explanation: string;
  confidence_score: number;
}

interface Fallacy {
  id: string;
  message_id: string;
  fallacy_name: string;
  explanation: string;
}

interface Debate {
  id: string;
  title: string;
  topic: string;
  status: string;
  current_participants: number;
  max_participants: number;
}

const DebateRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [debate, setDebate] = useState<Debate | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [factChecks, setFactChecks] = useState<Record<string, FactCheck[]>>({});
  const [fallacies, setFallacies] = useState<Record<string, Fallacy[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDebate();
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDebate = async () => {
    const { data, error } = await supabase
      .from('debates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching debate:', error);
      toast({
        title: 'Error',
        description: 'Debate not found.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    setDebate(data);
    setIsLoading(false);
  };

  const fetchMessages = async () => {
    const { data: messagesData } = await supabase
      .from('debate_messages')
      .select('*')
      .eq('debate_id', id)
      .order('created_at', { ascending: true });

    if (messagesData) {
      // Fetch profiles for messages
      const userIds = [...new Set(messagesData.map(m => m.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const messagesWithProfiles = messagesData.map(m => ({
        ...m,
        profile: m.user_id ? profileMap.get(m.user_id) : null,
      }));

      setMessages(messagesWithProfiles);

      // Fetch fact checks and fallacies
      const messageIds = messagesData.map(m => m.id);
      
      const { data: factChecksData } = await supabase
        .from('fact_checks')
        .select('*')
        .in('message_id', messageIds);

      const { data: fallaciesData } = await supabase
        .from('logical_fallacies')
        .select('*')
        .in('message_id', messageIds);

      if (factChecksData) {
        const grouped: Record<string, FactCheck[]> = {};
        factChecksData.forEach(fc => {
          if (!grouped[fc.message_id]) grouped[fc.message_id] = [];
          grouped[fc.message_id].push(fc);
        });
        setFactChecks(grouped);
      }

      if (fallaciesData) {
        const grouped: Record<string, Fallacy[]> = {};
        fallaciesData.forEach(f => {
          if (!grouped[f.message_id]) grouped[f.message_id] = [];
          grouped[f.message_id].push(f);
        });
        setFallacies(grouped);
      }
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`debate-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'debate_messages',
          filter: `debate_id=eq.${id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Fetch profile for new message
          if (newMsg.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, username')
              .eq('user_id', newMsg.user_id)
              .single();
            newMsg.profile = profile || undefined;
          }
          
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fact_checks',
        },
        (payload) => {
          const fc = payload.new as FactCheck;
          setFactChecks(prev => ({
            ...prev,
            [fc.message_id]: [...(prev[fc.message_id] || []), fc],
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'logical_fallacies',
        },
        (payload) => {
          const f = payload.new as Fallacy;
          setFallacies(prev => ({
            ...prev,
            [f.message_id]: [...(prev[f.message_id] || []), f],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from('debate_messages')
        .insert({
          debate_id: id,
          user_id: user.id,
          content: messageContent,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Trigger AI analysis
      setIsAnalyzing(true);
      
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-debate', {
        body: {
          message: messageContent,
          type: 'analyze',
          debateContext: debate?.topic,
        },
      });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
      } else if (analysisData) {
        // Store fact checks
        if (analysisData.fact_checks?.length > 0) {
          for (const fc of analysisData.fact_checks) {
            await supabase.from('fact_checks').insert({
              message_id: messageData.id,
              claim: fc.claim,
              status: fc.status,
              explanation: fc.explanation,
              confidence_score: fc.confidence,
            });
          }
        }

        // Store fallacies
        if (analysisData.fallacies?.length > 0) {
          for (const f of analysisData.fallacies) {
            await supabase.from('logical_fallacies').insert({
              message_id: messageData.id,
              fallacy_name: f.name,
              explanation: f.explanation,
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
      setIsAnalyzing(false);
    }
  };

  const requestDevilsAdvocate = async () => {
    if (!selectedMessage) return;
    
    const message = messages.find(m => m.id === selectedMessage);
    if (!message) return;

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-debate', {
        body: {
          message: message.content,
          type: 'devils_advocate',
          debateContext: debate?.topic,
        },
      });

      if (error) throw error;

      if (data?.counter_argument) {
        // Add AI response as a message
        await supabase.from('debate_messages').insert({
          debate_id: id,
          content: `🤖 Devil's Advocate:\n\n${data.counter_argument}`,
          is_ai_response: true,
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate counter-argument.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setSelectedMessage(null);
    }
  };

  const getFactCheckIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'incorrect': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 py-4 px-6 sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display font-bold text-foreground">
                {debate?.title}
              </h1>
              <p className="text-sm text-muted-foreground">{debate?.topic}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {debate?.current_participants}/{debate?.max_participants}
            </span>
            {isAnalyzing && (
              <span className="text-sm text-primary flex items-center">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                AI Analyzing...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No messages yet. Start the debate!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.user_id === user?.id;
              const messageFacts = factChecks[message.id] || [];
              const messageFallacies = fallacies[message.id] || [];
              const hasAnalysis = messageFacts.length > 0 || messageFallacies.length > 0;

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 cursor-pointer transition-all ${
                      message.is_ai_response
                        ? 'bg-primary/10 border border-primary/20'
                        : isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                    } ${selectedMessage === message.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedMessage(
                      selectedMessage === message.id ? null : message.id
                    )}
                  >
                    {!message.is_ai_response && (
                      <p className={`text-xs mb-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {message.profile?.username || 'Anonymous'}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {hasAnalysis && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        {messageFacts.map((fc) => (
                          <div key={fc.id} className="flex items-start space-x-2 text-sm">
                            {getFactCheckIcon(fc.status)}
                            <div>
                              <p className="font-medium">{fc.claim}</p>
                              <p className={`text-xs ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {fc.explanation}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {messageFallacies.map((f) => (
                          <div key={f.id} className="flex items-start space-x-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="font-medium">{f.fallacy_name}</p>
                              <p className={`text-xs ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {f.explanation}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedMessage === message.id && !message.is_ai_response && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={requestDevilsAdvocate}
                        disabled={isAnalyzing}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Devil's Advocate
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="border-t border-border/50 p-4 bg-background">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex space-x-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your argument..."
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !newMessage.trim()}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DebateRoom;
