import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice configuration by language
const VOICE_CONFIG: Record<string, { voiceId: string; stability: number; similarityBoost: number; style: number }> = {
  english: { voiceId: 'EXAVITQu4vr4xnSDxMaL', stability: 0.75, similarityBoost: 0.75, style: 0.5 },
  spanish: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.75, similarityBoost: 0.75, style: 0.5 },
  mandarin: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  vietnamese: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  arabic: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  somali: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  french: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  portuguese: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  russian: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  korean: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  tagalog: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  hmong: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  swahili: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  'haitian creole': { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  karen: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
  oromo: { voiceId: 'pqHfZKP75CvOlQylNhV4', stability: 0.8, similarityBoost: 0.8, style: 0.4 },
};

function getVoiceConfig(language: string) {
  const langKey = language.toLowerCase().replace(/\s+/g, ' ');
  return VOICE_CONFIG[langKey] || VOICE_CONFIG.english;
}

interface StudentGroup {
  id: string;
  groupName: string;
  homeLanguage: string;
  accommodations: string[];
}

interface GenerateGroupAudioRequest {
  lessonId: string;
  differentiatedContent: string;
  group: StudentGroup;
  retryFailedOnly?: boolean;
}

// Translation cache
const translationCache = new Map<string, string>();

async function translateContent(text: string, targetLanguage: string, apiKey: string): Promise<string> {
  if (!text || text.trim().length < 3) return text;
  if (targetLanguage.toLowerCase() === 'english') return text;

  const cacheKey = `${text.substring(0, 100)}_${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following educational content from English to ${targetLanguage}. Only output the translation, nothing else.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return text;
    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim() || text;
    translationCache.set(cacheKey, translatedText);
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

function parseVocabularyItem(vocabLine: string): { term: string; definition: string } {
  const patterns = [/^(.+?)\s*[-–—:]\s*(.+)$/, /^(.+?)\s*\((.+?)\)$/];
  for (const pattern of patterns) {
    const match = vocabLine.match(pattern);
    if (match) return { term: match[1].trim(), definition: match[2].trim() };
  }
  return { term: vocabLine.trim(), definition: '' };
}

function extractGroupSections(content: string, groupName: string): {
  learningTarget: string;
  instructions: string;
  vocabulary: string[];
  vocabularyParsed: { term: string; definition: string }[];
  mainContent: string;
  reflectionPrompt: string;
} {
  const result = {
    learningTarget: '',
    instructions: '',
    vocabulary: [] as string[],
    vocabularyParsed: [] as { term: string; definition: string }[],
    mainContent: '',
    reflectionPrompt: ''
  };

  const groupRegex = new RegExp(`(?:#{1,3}.*${groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*Edition)([\\s\\S]*?)(?=#{1,3}.*(?:Edition|Group|Handout)|$)`, 'i');
  const groupMatch = content.match(groupRegex);
  if (!groupMatch) return result;

  const groupContent = groupMatch[1];

  const learningTargetMatch = groupContent.match(/(?:learning target|objetivo|today you will learn)[:\s]*([^\n]+(?:\n(?![#\-•*])[^\n]+)*)/i);
  if (learningTargetMatch) result.learningTarget = learningTargetMatch[1].trim().replace(/\*\*/g, '').substring(0, 500);

  const instructionsMatch = groupContent.match(/(?:instructions?|directions?|steps?)[:\s]*\n?([\s\S]*?)(?:\n\n|\n(?=[#•\-*])|$)/i);
  if (instructionsMatch) result.instructions = instructionsMatch[1].trim().replace(/\*\*/g, '').substring(0, 1000);

  const vocabMatch = groupContent.match(/(?:vocabulary|vocabulario|key terms)[:\s]*\n?([\s\S]*?)(?:\n\n\n|\n(?=#{1,3})|$)/i);
  if (vocabMatch) {
    const vocabLines = vocabMatch[1].split('\n').filter(line => line.trim());
    result.vocabulary = vocabLines.slice(0, 10).map(v => v.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, '').substring(0, 200));
    result.vocabularyParsed = result.vocabulary.map(parseVocabularyItem);
  }

  const contentMatch = groupContent.match(/(?:practice|content|lesson|main)[:\s]*\n?([\s\S]*?)(?:reflection|$)/i);
  if (contentMatch) result.mainContent = contentMatch[1].trim().replace(/\*\*/g, '').substring(0, 3000);

  const reflectionMatch = groupContent.match(/(?:reflection|reflexión)[:\s]*\n?([\s\S]*?)(?:\n\n\n|$)/i);
  if (reflectionMatch) result.reflectionPrompt = reflectionMatch[1].trim().replace(/\*\*/g, '').substring(0, 300);

  return result;
}

function chunkContent(content: string, maxChars = 2000): string[] {
  if (content.length <= maxChars) return [content];
  const chunks: string[] = [];
  const sentences = content.split(/(?<=[.!?])\s+/);
  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChars) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

async function generateTTS(text: string, language: string, apiKey: string): Promise<ArrayBuffer | null> {
  if (!text || text.trim().length < 3) return null;
  const voiceConfig = getVoiceConfig(language);
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.substring(0, 5000),
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: voiceConfig.stability,
          similarity_boost: voiceConfig.similarityBoost,
          style: voiceConfig.style,
          use_speaker_boost: true,
        },
      }),
    });

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

async function storeAudio(supabase: any, lessonId: string, groupName: string, sectionId: string, language: string, audioBuffer: ArrayBuffer): Promise<string | null> {
  const fileName = `lessons/${lessonId}/${groupName.replace(/\s+/g, '-')}/${sectionId}-${language.toLowerCase()}.mp3`;
  const { error: uploadError } = await supabase.storage.from('lesson-audio').upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });
  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return null;
  }
  const { data: urlData } = supabase.storage.from('lesson-audio').getPublicUrl(fileName);
  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonId, differentiatedContent, group, retryFailedOnly }: GenerateGroupAudioRequest = await req.json();

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log(`Processing single group: ${group.groupName}`);

    // Check existing audio for this group if retrying
    let existingSectionIds: string[] = [];
    if (retryFailedOnly) {
      const { data: existingAudio } = await supabase
        .from('generated_audio')
        .select('section_id')
        .eq('lesson_id', lessonId)
        .eq('group_name', group.groupName);
      existingSectionIds = (existingAudio || []).map((a: any) => a.section_id);
      console.log(`Found ${existingSectionIds.length} existing audio files, skipping those`);
    }

    const results = { generated: 0, failed: 0, audioRecords: [] as any[] };
    const needsHomeLanguage = group.homeLanguage !== 'English';
    const languages = needsHomeLanguage ? ['English', group.homeLanguage] : ['English'];
    
    const sections = extractGroupSections(differentiatedContent, group.groupName);

    // Build section configs (limit to essential sections to avoid timeout)
    const sectionConfigs = [
      { id: 'instructions', content: sections.instructions, priority: 'critical' },
    ];

    // Add max 5 vocabulary items
    sections.vocabulary.slice(0, 5).forEach((vocab, idx) => {
      sectionConfigs.push({ id: `vocabulary-${idx}`, content: vocab, priority: 'high' });
    });

    // Add max 2 content chunks
    const contentChunks = chunkContent(sections.mainContent);
    contentChunks.slice(0, 2).forEach((chunk, idx) => {
      sectionConfigs.push({ id: `content-${idx}`, content: chunk, priority: 'medium' });
    });

    // Process sections
    for (const section of sectionConfigs) {
      if (!section.content || section.content.trim().length < 3) continue;

      for (const language of languages) {
        const sectionId = `${section.id}-${language.toLowerCase()}`;
        
        // Skip if already exists and retrying
        if (retryFailedOnly && existingSectionIds.includes(sectionId)) {
          console.log(`Skipping existing: ${sectionId}`);
          continue;
        }

        try {
          let textToSpeak = section.content;
          if (language !== 'English' && LOVABLE_API_KEY) {
            console.log(`Translating ${section.id} to ${language}...`);
            textToSpeak = await translateContent(section.content, language, LOVABLE_API_KEY);
          }
          
          const audioBuffer = await generateTTS(textToSpeak, language, ELEVENLABS_API_KEY);
          if (!audioBuffer) {
            results.failed++;
            continue;
          }

          const audioUrl = await storeAudio(supabase, lessonId, group.groupName, section.id, language, audioBuffer);
          if (!audioUrl) {
            results.failed++;
            continue;
          }

          const estimatedDuration = (audioBuffer.byteLength * 8) / (128 * 1000);
          const estimatedCost = textToSpeak.length * 0.00003;

          await supabase.from('generated_audio').upsert({
            lesson_id: lessonId,
            group_id: group.id,
            group_name: group.groupName,
            section_type: section.id.split('-')[0],
            section_id: sectionId,
            audio_url: audioUrl,
            duration_seconds: estimatedDuration,
            language: language,
            characters_used: textToSpeak.length,
          }, { onConflict: 'lesson_id,group_name,section_id' });

          await supabase.from('audio_usage').insert({
            lesson_id: lessonId,
            group_id: group.id,
            section_type: section.id.split('-')[0],
            characters_used: textToSpeak.length,
            estimated_cost: estimatedCost,
            language: language,
            audio_url: audioUrl,
            duration_seconds: estimatedDuration,
          });

          results.generated++;
          results.audioRecords.push({ groupName: group.groupName, sectionId, language, audioUrl, duration: estimatedDuration });
          console.log(`Generated: ${group.groupName}/${sectionId}`);

          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error generating ${section.id} for ${group.groupName}:`, error);
          results.failed++;
        }
      }
    }

    // Generate bilingual vocabulary (limited to 3 items)
    if (sections.vocabularyParsed && sections.vocabularyParsed.length > 0) {
      for (let idx = 0; idx < Math.min(3, sections.vocabularyParsed.length); idx++) {
        const vocabItem = sections.vocabularyParsed[idx];
        const vocabId = `vocab-${idx}`;
        
        try {
          const vocabRecord: any = {
            lesson_id: lessonId,
            group_id: group.id,
            group_name: group.groupName,
            vocab_id: vocabId,
            term: vocabItem.term,
            definition: vocabItem.definition || '',
            home_language: needsHomeLanguage ? group.homeLanguage : 'English',
          };

          if (vocabItem.term) {
            const termBuffer = await generateTTS(vocabItem.term, 'English', ELEVENLABS_API_KEY);
            if (termBuffer) {
              const termUrl = await storeAudio(supabase, lessonId, group.groupName, `${vocabId}-term`, 'english', termBuffer);
              if (termUrl) {
                vocabRecord.english_term_audio_url = termUrl;
                results.generated++;
              }
            }
          }

          if (needsHomeLanguage && LOVABLE_API_KEY && vocabItem.term) {
            const translatedTerm = await translateContent(vocabItem.term, group.homeLanguage, LOVABLE_API_KEY);
            vocabRecord.translated_term = translatedTerm;
            const hlTermBuffer = await generateTTS(translatedTerm, group.homeLanguage, ELEVENLABS_API_KEY);
            if (hlTermBuffer) {
              const hlTermUrl = await storeAudio(supabase, lessonId, group.groupName, `${vocabId}-term`, group.homeLanguage.toLowerCase(), hlTermBuffer);
              if (hlTermUrl) {
                vocabRecord.home_language_term_audio_url = hlTermUrl;
                results.generated++;
              }
            }
          }

          await supabase.from('vocabulary_audio').upsert(vocabRecord, { onConflict: 'lesson_id,group_name,vocab_id' });
          console.log(`Generated vocabulary audio: ${group.groupName}/${vocabId}`);
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Error generating vocab audio ${idx}:`, error);
          results.failed++;
        }
      }
    }

    console.log(`Group ${group.groupName} complete. Generated: ${results.generated}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        status: results.failed === 0 ? 'complete' : 'partial',
        groupName: group.groupName,
        generated: results.generated,
        failed: results.failed,
        audioRecords: results.audioRecords
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-group-audio:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', status: 'failed', generated: 0, failed: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
