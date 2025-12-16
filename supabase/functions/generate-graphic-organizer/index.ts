import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Graphic organizer type configurations
const ORGANIZER_CONFIGS: Record<string, {
  prompt: string;
  labels: string[];
}> = {
  'venn-diagram': {
    prompt: 'A clean, educational Venn diagram with two overlapping circles. Black and white line art suitable for printing. Include blank lines inside each circle and the overlap area for student writing. Labels: "ONLY A", "BOTH", "ONLY B". Professional educational worksheet style.',
    labels: ['ONLY A', 'BOTH', 'ONLY B'],
  },
  't-chart': {
    prompt: 'A clean, educational T-chart graphic organizer. Simple black and white design with a vertical line dividing two columns and a horizontal line at the top for headers. Include 5-6 blank lines in each column for student writing. Professional educational worksheet style.',
    labels: ['Category A', 'Category B'],
  },
  'flow-chart': {
    prompt: 'A clean, educational flow chart with 4-5 rectangular boxes connected by arrows pointing downward. Black and white line art suitable for printing. Each box should have blank lines inside for student writing. Include "Start" at top and "End" at bottom. Professional educational worksheet style.',
    labels: ['Step 1', 'Step 2', 'Step 3', 'Step 4'],
  },
  'cause-effect': {
    prompt: 'A clean, educational cause and effect graphic organizer. Show 3 cause boxes on the left connected by arrows to 3 effect boxes on the right. Black and white line art suitable for printing. Each box has blank lines for writing. Professional educational worksheet style.',
    labels: ['CAUSE', 'EFFECT'],
  },
  'web-diagram': {
    prompt: 'A clean, educational web diagram / concept map. Central oval in the middle connected to 6 smaller ovals arranged around it. Black and white line art suitable for printing. Each oval has a blank line inside for writing. Professional educational worksheet style.',
    labels: ['Main Idea', 'Detail'],
  },
  'frayer-model': {
    prompt: 'A clean, educational Frayer Model graphic organizer. Square divided into 4 equal quadrants with an oval in the center for the vocabulary word. Quadrants labeled: Definition (top-left), Characteristics (top-right), Examples (bottom-left), Non-Examples (bottom-right). Black and white line art with blank lines in each section. Professional educational worksheet style.',
    labels: ['Definition', 'Characteristics', 'Examples', 'Non-Examples'],
  },
  'story-map': {
    prompt: 'A clean, educational story map graphic organizer. Sections for: Setting (top), Characters, Problem, Events (3 connected boxes), Solution (bottom). Black and white line art suitable for printing. Each section has blank lines for writing. Professional educational worksheet style.',
    labels: ['Setting', 'Characters', 'Problem', 'Events', 'Solution'],
  },
  'claim-evidence': {
    prompt: 'A clean, educational claim-evidence-reasoning graphic organizer. Three horizontal sections stacked: "CLAIM" at top (1 box), "EVIDENCE" in middle (3 smaller boxes side by side), "REASONING" at bottom (1 box). Black and white line art with blank lines in each section. Professional educational worksheet style.',
    labels: ['CLAIM', 'EVIDENCE', 'REASONING'],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizerType, topic, language, lessonId, groupId } = await req.json();
    
    console.log(`Generating graphic organizer: ${organizerType} for topic: ${topic}`);

    // Get the API key - try NANOBANANA first, fallback to LOVABLE
    const apiKey = Deno.env.get("NANOBANANA_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("No API key configured for image generation");
    }

    // Get organizer config
    const config = ORGANIZER_CONFIGS[organizerType] || ORGANIZER_CONFIGS['web-diagram'];
    
    // Build the prompt with topic context
    let prompt = config.prompt;
    if (topic) {
      prompt = `${prompt} Topic/Title: "${topic}".`;
    }
    if (language && language !== 'English') {
      prompt = `${prompt} Labels should be in ${language}.`;
    }
    prompt = `${prompt} Ultra high resolution. Clean minimalist style perfect for K-12 classroom use. 800x600 aspect ratio.`;

    console.log(`Calling Nano Banana API with prompt: ${prompt.substring(0, 100)}...`);

    // Call Nano Banana (Gemini 2.5 Flash Image) via Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nano Banana API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Nano Banana response received");

    // Extract the image from the response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated in response");
    }

    // If we have a lessonId, save to Supabase Storage
    let storedUrl = imageData;
    if (lessonId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Convert base64 to buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Generate storage path
        const timestamp = Date.now();
        const storagePath = `graphic-organizers/${lessonId}/${groupId || 'default'}/${organizerType}-${timestamp}.png`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lesson-audio') // Reuse existing bucket
          .upload(storagePath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // Return base64 as fallback
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('lesson-audio')
            .getPublicUrl(storagePath);
          
          storedUrl = urlData.publicUrl;
          console.log("Image stored at:", storedUrl);
        }
      } catch (storageError) {
        console.error("Storage error, returning base64:", storageError);
        // Return base64 as fallback
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: storedUrl,
        organizerType,
        topic,
        labels: config.labels,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating graphic organizer:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate graphic organizer",
        fallback: true,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
