import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Scale, ArrowLeft } from 'lucide-react';

const CreateDebate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to create a debate.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('debates')
        .insert({
          title,
          topic,
          description,
          max_participants: maxParticipants,
          created_by: user.id,
          current_participants: 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as first participant
      await supabase
        .from('debate_participants')
        .insert({
          debate_id: data.id,
          user_id: user.id,
          side: 'for',
        });

      toast({
        title: 'Debate created!',
        description: 'Your debate room is ready.',
      });

      navigate(`/debate/${data.id}`);
    } catch (error: any) {
      console.error('Error creating debate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create debate.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-2xl font-display font-bold text-foreground">Veritas</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Create New Debate
          </h1>
          <p className="text-muted-foreground mb-8">
            Set up a debate room with AI-powered fact-checking
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Debate Title</Label>
              <Input
                id="title"
                placeholder="e.g., Climate Change Policy Discussion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Position</Label>
              <Input
                id="topic"
                placeholder="e.g., Should carbon taxes be implemented globally?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide additional context or rules for the debate..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Maximum Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min={2}
                max={10}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                How many people can join this debate (2-10)
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Debate'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateDebate;
