import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI debate analyst integrated into a Real-Time Debate & Fact-Checking Platform.

Your purpose is to improve debate quality, factual reliability, and logical structure.

CORE RESPONSIBILITIES:

1. FACT CHECKING
- Evaluate factual claims for verifiability
- Label claims as: "verified", "unverified", or "incorrect"
- Provide explanation and confidence score (0-1)

2. LOGICAL FALLACY DETECTION
- Identify clear logical fallacies when present
- Return fallacy name and short explanation
- Common fallacies: Ad Hominem, Straw Man, Appeal to Authority, False Dichotomy, Slippery Slope, Red Herring, Circular Reasoning, Hasty Generalization

3. ARGUMENT ANALYSIS
- Analyze argument strength and clarity
- Identify key claims and evidence
- Assess logical coherence

4. DEVIL'S ADVOCATE
- When requested, generate rational counter-arguments
- Focus on assumptions, missing evidence, or logical gaps

5. DEBATE SUMMARIZATION
- Generate topic, key arguments, strengths/weaknesses
- Provide neutral summary

RESPONSE FORMAT (JSON):
{
  "fact_checks": [
    {
      "claim": "string",
      "status": "verified" | "unverified" | "incorrect",
      "explanation": "string",
      "confidence": 0.0-1.0
    }
  ],
  "fallacies": [
    {
      "name": "string",
      "explanation": "string"
    }
  ],
  "argument_analysis": {
    "strength": "weak" | "moderate" | "strong",
    "key_points": ["string"],
    "suggestions": ["string"]
  },
  "counter_argument": "string" (optional, only if requested),
  "summary": "string" (optional, only for full debate analysis)
}

Be concise, neutral, and analytical. Do not take sides.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, type, debateContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let userPrompt = '';
    
    switch (type) {
      case 'analyze':
        userPrompt = `Analyze this debate message for fact-checking and logical fallacies:\n\n"${message}"`;
        break;
      case 'devils_advocate':
        userPrompt = `Generate a devil's advocate counter-argument for:\n\n"${message}"\n\nContext: ${debateContext || 'General debate'}`;
        break;
      case 'summarize':
        userPrompt = `Summarize this debate and provide key arguments analysis:\n\n${message}`;
        break;
      default:
        userPrompt = `Analyze this message:\n\n"${message}"`;
    }

    console.log('Calling Lovable AI with type:', type);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response received:', content?.substring(0, 200));

    // Try to parse as JSON, fallback to text response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = {
        fact_checks: [],
        fallacies: [],
        argument_analysis: {
          strength: 'moderate',
          key_points: [],
          suggestions: [content]
        }
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-debate function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
