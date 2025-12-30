import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Scale, Plus, Users, Trophy, Target, LogOut, 
  MessageSquare, Clock, CheckCircle, XCircle 
} from 'lucide-react';

interface Debate {
  id: string;
  title: string;
  topic: string;
  status: string;
  current_participants: number;
  max_participants: number;
  created_at: string;
}

interface Profile {
  username: string;
  debates_participated: number;
  debates_won: number;
  credibility_score: number;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [debates, setDebates] = useState<Debate[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch debates
      const { data: debatesData } = await supabase
        .from('debates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (debatesData) {
        setDebates(debatesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateDebate = () => {
    navigate('/debate/new');
  };

  const handleJoinDebate = (debateId: string) => {
    navigate(`/debate/${debateId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-500';
      case 'active': return 'text-green-500';
      case 'completed': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="h-4 w-4" />;
      case 'active': return <MessageSquare className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 py-4 px-6 sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-2xl font-display font-bold text-foreground">Veritas</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {profile?.username || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Debates</span>
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {profile?.debates_participated || 0}
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Wins</span>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {profile?.debates_won || 0}
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Credibility</span>
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {profile?.credibility_score || 50}%
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Active Rooms</span>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {debates.filter(d => d.status === 'active' || d.status === 'waiting').length}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Debate Rooms
          </h2>
          <Button onClick={handleCreateDebate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Debate
          </Button>
        </div>

        {/* Debates List */}
        <div className="space-y-4">
          {debates.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No debates yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first debate room to get started
              </p>
              <Button onClick={handleCreateDebate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Debate
              </Button>
            </div>
          ) : (
            debates.map((debate) => (
              <div
                key={debate.id}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleJoinDebate(debate.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {debate.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {debate.topic}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`flex items-center space-x-1 ${getStatusColor(debate.status)}`}>
                        {getStatusIcon(debate.status)}
                        <span className="capitalize">{debate.status}</span>
                      </span>
                      <span className="text-muted-foreground flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{debate.current_participants}/{debate.max_participants}</span>
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {debate.status === 'waiting' ? 'Join' : 'View'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
