import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lessonId = url.searchParams.get('lessonId');

    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'lessonId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get audio status
    const { data: status, error: statusError } = await supabase
      .from('lesson_audio_status')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      console.error('Error fetching audio status:', statusError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch audio status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get audio records count
    const { count: audioCount } = await supabase
      .from('generated_audio')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lessonId);

    // Get vocabulary audio count
    const { count: vocabCount } = await supabase
      .from('vocabulary_audio')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lessonId);

    // Get unique languages
    const { data: languages } = await supabase
      .from('generated_audio')
      .select('language')
      .eq('lesson_id', lessonId);

    const uniqueLanguages = [...new Set(languages?.map(l => l.language) || [])];

    return new Response(
      JSON.stringify({
        status: status || { status: 'pending', completed_sections: 0, total_sections: 0 },
        audioCount: audioCount || 0,
        vocabularyCount: vocabCount || 0,
        languages: uniqueLanguages
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-lesson-audio-status:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
