import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `CREATE AN IMAGE NOW. Generate a visual educational diagram showing: ${description}

CRITICAL INSTRUCTIONS:
- You MUST output an actual image, not just text
- Create a clean, simple illustration suitable for K-12 students
- Use high contrast colors that print well in black and white
- Include all labels mentioned in the description
- Make it look like a professional textbook diagram
- DO NOT describe the image - GENERATE IT`;

    console.log(`Calling API with prompt: ${prompt.substring(0, 200)}...`);

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
      console.error("API error:", response.status, errorText);
      
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
    console.log("Response received, keys:", Object.keys(data));
    
    let imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageData) {
      console.log("Image data received, length:", imageData.length);
    } else {
      console.log("No image in response, got text:", data.choices?.[0]?.message?.content?.substring(0, 100));
      
      // Retry with stronger prompt
      console.log("Retrying with stronger prompt...");
      const retryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `OUTPUT IMAGE ONLY. Create a visual diagram image (not text) of: ${description}. This must be an actual generated image file.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        imageData = retryData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      }
    }
    
    if (!imageData) {
      console.error("No image generated after 2 attempts for:", description);
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

        // Generate storage path with hash of description
        const descHash = description.split('').reduce((a: number, b: string) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0).toString(16);
        const timestamp = Date.now();
        const storagePath = `lesson-diagrams/${lessonId}/${groupId || 'default'}/${descHash}-${timestamp}.png`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('lesson-audio')
          .upload(storagePath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else {
          // Get signed URL
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('lesson-audio')
            .createSignedUrl(storagePath, 604800); // 7 days
          
          if (signedUrlData?.signedUrl) {
            storedUrl = signedUrlData.signedUrl;
            console.log("Image stored at:", storedUrl);
            
            // Track image in lesson_images table
            const { error: trackError } = await supabase
              .from('lesson_images')
              .insert({
                lesson_id: lessonId,
                group_id: groupId || null,
                storage_path: storagePath,
                description: description,
                alt_text: description.substring(0, 255),
                file_size: imageBuffer.length,
              });
            
            if (trackError) {
              console.error("Failed to track image:", trackError);
            }
          } else {
            console.error("Failed to create signed URL:", signedUrlError);
          }
        }
      } catch (storageError) {
        console.error("Storage error, returning base64:", storageError);
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
