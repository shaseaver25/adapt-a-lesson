import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VOICE_CONFIG: Record<string, { voiceId: string; stability: number; similarityBoost: number; style: number }> = {
  'English': { voiceId: 'EXAVITQu4vr4xnSDxMaL', stability: 0.5, similarityBoost: 0.75, style: 0.3 },
  'Spanish': { voiceId: 'XrExE9yKIg1WjnnlVkGX', stability: 0.5, similarityBoost: 0.8, style: 0.3 },
  'Somali': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', stability: 0.6, similarityBoost: 0.75, style: 0.3 },
  'Hmong': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', stability: 0.6, similarityBoost: 0.75, style: 0.3 },
  'Vietnamese': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', stability: 0.6, similarityBoost: 0.75, style: 0.3 },
  'Arabic': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', stability: 0.6, similarityBoost: 0.75, style: 0.3 },
  'Mandarin': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', stability: 0.6, similarityBoost: 0.75, style: 0.3 },
};

function getVoiceConfig(language: string) {
  return VOICE_CONFIG[language] || VOICE_CONFIG['English'];
}

async function generateTTS(text: string, language: string, apiKey: string): Promise<ArrayBuffer | null> {
  const voiceConfig = getVoiceConfig(language);
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarityBoost,
            style: voiceConfig.style,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`TTS API error: ${response.status}`);
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('TTS generation error:', error);
    return null;
  }
}

async function storeAudio(
  supabase: any,
  lessonId: string,
  groupName: string,
  sectionId: string,
  language: string,
  audioBuffer: ArrayBuffer
): Promise<{ storagePath: string; signedUrl: string } | null> {
  const fileName = `lessons/${lessonId}/${groupName.replace(/\s+/g, '-')}/${sectionId}_${language}_${Date.now()}.mp3`;
  
  const { error: uploadError } = await supabase.storage
    .from('lesson-audio')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return null;
  }

  // Create signed URL valid for 7 days
  const { data: signedData, error: signedError } = await supabase.storage
    .from('lesson-audio')
    .createSignedUrl(fileName, 60 * 60 * 24 * 7);

  if (signedError) {
    console.error('Signed URL error:', signedError);
    return null;
  }

  return { storagePath: fileName, signedUrl: signedData.signedUrl };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonId, sectionIds } = await req.json();

    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'lessonId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get failed sections from status
    const { data: status } = await supabase
      .from('lesson_audio_status')
      .select('error_details')
      .eq('lesson_id', lessonId)
      .single();

    const failedSections = sectionIds || (status?.error_details as any[]) || [];
    
    if (failedSections.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No failed sections to retry', retried: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let failCount = 0;
    const newErrors: any[] = [];

    for (const section of failedSections) {
      const { groupName, sectionId, sectionType, language, text } = section;
      
      if (!text) {
        console.log(`Skipping section ${sectionId} - no text provided`);
        continue;
      }

      const audioBuffer = await generateTTS(text, language, elevenLabsKey);
      
      if (!audioBuffer) {
        failCount++;
        newErrors.push(section);
        continue;
      }

      const audioResult = await storeAudio(
        supabase,
        lessonId,
        groupName,
        sectionId,
        language,
        audioBuffer
      );

      if (!audioResult) {
        failCount++;
        newErrors.push(section);
        continue;
      }

      // Update or insert the audio record
      const { error: upsertError } = await supabase
        .from('generated_audio')
        .upsert({
          lesson_id: lessonId,
          group_name: groupName,
          section_id: sectionId,
          section_type: sectionType,
          language,
          audio_url: audioResult.signedUrl,
          storage_path: audioResult.storagePath,
          characters_used: text.length,
        }, {
          onConflict: 'lesson_id,group_name,section_id,language'
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        failCount++;
        newErrors.push(section);
      } else {
        successCount++;
      }
    }

    // Update status
    await supabase
      .from('lesson_audio_status')
      .update({
        failed_sections: failCount,
        error_details: newErrors,
        status: failCount === 0 ? 'complete' : 'partial',
        updated_at: new Date().toISOString(),
      })
      .eq('lesson_id', lessonId);

    return new Response(
      JSON.stringify({
        retried: failedSections.length,
        success: successCount,
        failed: failCount,
        remainingErrors: newErrors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in retry-audio-generation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
