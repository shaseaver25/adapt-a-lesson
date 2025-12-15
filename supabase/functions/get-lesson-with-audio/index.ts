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
    const groupId = url.searchParams.get('groupId');

    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'lessonId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('generated_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError) {
      console.error('Error fetching lesson:', lessonError);
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build audio query
    let audioQuery = supabase
      .from('generated_audio')
      .select('*')
      .eq('lesson_id', lessonId);

    if (groupId) {
      audioQuery = audioQuery.eq('group_id', groupId);
    }

    const { data: audioRecords, error: audioError } = await audioQuery;

    if (audioError) {
      console.error('Error fetching audio:', audioError);
    }

    // Build vocabulary audio query
    let vocabQuery = supabase
      .from('vocabulary_audio')
      .select('*')
      .eq('lesson_id', lessonId);

    if (groupId) {
      vocabQuery = vocabQuery.eq('group_id', groupId);
    }

    const { data: vocabularyAudio, error: vocabError } = await vocabQuery;

    if (vocabError) {
      console.error('Error fetching vocabulary audio:', vocabError);
    }

    // Get audio status
    const { data: audioStatus } = await supabase
      .from('lesson_audio_status')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();

    // Get student group details if groupId provided
    let studentGroup = null;
    if (groupId) {
      const { data: group } = await supabase
        .from('student_groups')
        .select('*')
        .eq('id', groupId)
        .single();
      studentGroup = group;
    }

    // Organize audio by section for easy access
    const audioBySection: Record<string, any[]> = {};
    audioRecords?.forEach(record => {
      const key = `${record.group_name}_${record.section_type}`;
      if (!audioBySection[key]) {
        audioBySection[key] = [];
      }
      audioBySection[key].push(record);
    });

    // Organize vocabulary audio by group
    const vocabularyByGroup: Record<string, any[]> = {};
    vocabularyAudio?.forEach(record => {
      if (!vocabularyByGroup[record.group_name]) {
        vocabularyByGroup[record.group_name] = [];
      }
      vocabularyByGroup[record.group_name].push(record);
    });

    return new Response(
      JSON.stringify({
        lesson,
        studentGroup,
        audio: {
          records: audioRecords || [],
          bySection: audioBySection,
          status: audioStatus
        },
        vocabulary: {
          records: vocabularyAudio || [],
          byGroup: vocabularyByGroup
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-lesson-with-audio:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
