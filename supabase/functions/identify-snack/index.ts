import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, userInput, suggestions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Handle spelling correction/fuzzy matching
    if (userInput && suggestions) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that finds the best matching snack name from a list. Return only the exact matched name or "none" if no good match.'
            },
            {
              role: 'user',
              content: `User typed: "${userInput}"\n\nAvailable snacks: ${suggestions.join(', ')}\n\nWhich snack did they most likely mean? Return only the exact name from the list, or "none" if no match is close enough.`
            }
          ],
        }),
      });

      const data = await response.json();
      const bestMatch = data.choices?.[0]?.message?.content?.trim();

      return new Response(
        JSON.stringify({ bestMatch: bestMatch !== 'none' ? bestMatch : null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'No data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this snack or food item. Return ONLY the name of the snack in a short format (e.g., "Doritos", "Chips Ahoy", "Apple"). Be specific but concise. If you cannot identify it clearly, return "Unknown Snack".'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to identify snack' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const snackName = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ snackName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
