import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, lessonId, groupId, subject } = await req.json();
    
    console.log(`Generating lesson diagram for: ${description}`);

    // Use LOVABLE_API_KEY for Lovable AI Gateway (Nano Banana model)
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build educational diagram prompt
    const prompt = `Create a clear, educational diagram for K-12 students showing: ${description}.
Style requirements:
- Clean, simple line art with high contrast
- Labeled parts with clear text
- Suitable for classroom printing (black and white friendly)
- Professional educational worksheet style
- No excessive decoration, focus on clarity
- Subject context: ${subject || 'general education'}
- 800x600 aspect ratio
Ultra high resolution.`;

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

        // Generate storage path with hash of description for uniqueness
        const descHash = description.split('').reduce((a: number, b: string) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0).toString(16);
        const timestamp = Date.now();
        const storagePath = `lesson-diagrams/${lessonId}/${groupId || 'default'}/${descHash}-${timestamp}.png`;

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
        description,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating lesson diagram:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate diagram",
        fallback: true,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
