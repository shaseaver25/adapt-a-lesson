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

interface AudioSection {
  sectionId: string;
  groupId: string;
  groupName: string;
  sectionType: 'learning-target' | 'instructions' | 'vocabulary' | 'content' | 'reflection-prompt';
  content: string;
  languages: {
    primary: 'English';
    secondary?: string;
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface StudentGroup {
  id: string;
  groupName: string;
  homeLanguage: string;
  accommodations: string[];
}

interface GenerateAudioRequest {
  lessonId: string;
  differentiatedContent: string;
  selectedGroups: StudentGroup[];
}

// Translation cache to avoid re-translating the same content
const translationCache = new Map<string, string>();

// Translate content to target language using Lovable AI
async function translateContent(
  text: string,
  targetLanguage: string,
  apiKey: string
): Promise<string> {
  if (!text || text.trim().length < 3) return text;
  if (targetLanguage.toLowerCase() === 'english') return text;

  // Check cache first
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
            content: `You are a professional translator. Translate the following educational content from English to ${targetLanguage}. 
Preserve:
- All formatting and structure
- Educational terminology (translate accurately)
- Numbers and proper nouns (keep original where appropriate)
- Sentence structure appropriate for the target language

Only output the translation, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error(`Translation API error: ${response.status}`);
      return text; // Return original if translation fails
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim() || text;
    
    // Cache the translation
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original if translation fails
  }
}

// Parse vocabulary item into term and definition
interface ParsedVocabItem {
  term: string;
  definition: string;
}

function parseVocabularyItem(vocabLine: string): ParsedVocabItem {
  // Common patterns: "Term - Definition", "Term: Definition", "Term – Definition"
  const patterns = [
    /^(.+?)\s*[-–—:]\s*(.+)$/,
    /^(.+?)\s*\((.+?)\)$/,
  ];

  for (const pattern of patterns) {
    const match = vocabLine.match(pattern);
    if (match) {
      return {
        term: match[1].trim(),
        definition: match[2].trim(),
      };
    }
  }

  // If no pattern matches, use the whole line as term
  return {
    term: vocabLine.trim(),
    definition: '',
  };
}

// Extract sections from differentiated content for a specific group
function extractGroupSections(content: string, groupName: string, homeLanguage: string): {
  learningTarget: string;
  instructions: string;
  vocabulary: string[];
  vocabularyParsed: ParsedVocabItem[];
  mainContent: string;
  reflectionPrompt: string;
} {
  const result = {
    learningTarget: '',
    instructions: '',
    vocabulary: [] as string[],
    vocabularyParsed: [] as ParsedVocabItem[],
    mainContent: '',
    reflectionPrompt: ''
  };

  // Find group section in content
  const groupRegex = new RegExp(`(?:#{1,3}.*${groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*Edition)([\\s\\S]*?)(?=#{1,3}.*(?:Edition|Group|Handout)|$)`, 'i');
  const groupMatch = content.match(groupRegex);
  
  if (!groupMatch) {
    console.log(`Could not find section for group: ${groupName}`);
    return result;
  }

  const groupContent = groupMatch[1];

  // Extract learning target
  const learningTargetMatch = groupContent.match(/(?:learning target|objetivo|today you will learn|hoy aprenderás)[:\s]*([^\n]+(?:\n(?![#\-•*])[^\n]+)*)/i);
  if (learningTargetMatch) {
    result.learningTarget = learningTargetMatch[1].trim().replace(/\*\*/g, '').substring(0, 500);
  }

  // Extract instructions (first few paragraphs after learning target)
  const instructionsMatch = groupContent.match(/(?:instructions?|directions?|steps?)[:\s]*\n?([\s\S]*?)(?:\n\n|\n(?=[#•\-*])|$)/i);
  if (instructionsMatch) {
    result.instructions = instructionsMatch[1].trim().replace(/\*\*/g, '').substring(0, 1000);
  }

  // Extract vocabulary
  const vocabMatch = groupContent.match(/(?:vocabulary|vocabulario|key terms|key words)[:\s]*\n?([\s\S]*?)(?:\n\n\n|\n(?=#{1,3})|$)/i);
  if (vocabMatch) {
    const vocabLines = vocabMatch[1].split('\n').filter(line => line.trim());
    result.vocabulary = vocabLines.slice(0, 10).map(v => v.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, '').substring(0, 200));
    result.vocabularyParsed = result.vocabulary.map(parseVocabularyItem);
  }

  // Extract main content (after vocabulary, before reflection)
  const contentMatch = groupContent.match(/(?:practice|content|lesson|main)[:\s]*\n?([\s\S]*?)(?:reflection|$)/i);
  if (contentMatch) {
    result.mainContent = contentMatch[1].trim().replace(/\*\*/g, '').substring(0, 3000);
  }

  // Extract reflection prompt
  const reflectionMatch = groupContent.match(/(?:reflection|reflexión)[:\s]*\n?([\s\S]*?)(?:\n\n\n|$)/i);
  if (reflectionMatch) {
    result.reflectionPrompt = reflectionMatch[1].trim().replace(/\*\*/g, '').substring(0, 300);
  }

  return result;
}

// Chunk content for TTS (max 5000 chars per request)
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

// Generate TTS using ElevenLabs
async function generateTTS(
  text: string,
  language: string,
  apiKey: string
): Promise<ArrayBuffer | null> {
  if (!text || text.trim().length < 3) return null;

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
          text: text.substring(0, 5000), // ElevenLabs limit
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarityBoost,
            style: voiceConfig.style,
            use_speaker_boost: true,
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

// Store audio in Supabase Storage
async function storeAudio(
  supabase: any,
  lessonId: string,
  groupName: string,
  sectionId: string,
  language: string,
  audioBuffer: ArrayBuffer
): Promise<string | null> {
  const fileName = `lessons/${lessonId}/${groupName.replace(/\s+/g, '-')}/${sectionId}-${language.toLowerCase()}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from('lesson-audio')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('lesson-audio')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonId, differentiatedContent, selectedGroups }: GenerateAudioRequest = await req.json();

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Identify groups needing audio
    const audioGroups = selectedGroups.filter(group => 
      group.accommodations?.includes('Read Aloud') || group.homeLanguage !== 'English'
    );

    if (audioGroups.length === 0) {
      return new Response(
        JSON.stringify({ 
          status: 'complete', 
          message: 'No groups require audio',
          generated: 0,
          failed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating audio for ${audioGroups.length} groups`);

    const results = {
      generated: 0,
      failed: 0,
      audioRecords: [] as any[]
    };

    // Process each group
    for (const group of audioGroups) {
      const needsHomeLanguage = group.homeLanguage !== 'English';
      // ALWAYS generate English first, then home language if different
      const languages = needsHomeLanguage ? ['English', group.homeLanguage] : ['English'];

      console.log(`Processing group: ${group.groupName}, languages: ${languages.join(', ')}`);

      // Extract sections for this group
      const sections = extractGroupSections(differentiatedContent, group.groupName, group.homeLanguage);

      // Generate audio for each section in each language
      const sectionConfigs = [
        { id: 'learning-target', content: sections.learningTarget, priority: 'critical' },
        { id: 'instructions', content: sections.instructions, priority: 'critical' },
        { id: 'reflection', content: sections.reflectionPrompt, priority: 'medium' },
      ];

      // Add vocabulary items (combined term + definition for general audio)
      sections.vocabulary.forEach((vocab, idx) => {
        sectionConfigs.push({
          id: `vocabulary-${idx}`,
          content: vocab,
          priority: 'high'
        });
      });

      // Add main content chunks
      const contentChunks = chunkContent(sections.mainContent);
      contentChunks.forEach((chunk, idx) => {
        sectionConfigs.push({
          id: `content-${idx}`,
          content: chunk,
          priority: 'medium'
        });
      });

      // Generate bilingual vocabulary audio (separate term + definition)
      if (sections.vocabularyParsed && sections.vocabularyParsed.length > 0) {
        console.log(`Generating bilingual vocabulary audio for ${sections.vocabularyParsed.length} terms`);
        
        for (let idx = 0; idx < sections.vocabularyParsed.length; idx++) {
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

            // Generate English term audio
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

            // Generate English definition audio
            if (vocabItem.definition) {
              const defBuffer = await generateTTS(vocabItem.definition, 'English', ELEVENLABS_API_KEY);
              if (defBuffer) {
                const defUrl = await storeAudio(supabase, lessonId, group.groupName, `${vocabId}-def`, 'english', defBuffer);
                if (defUrl) {
                  vocabRecord.english_definition_audio_url = defUrl;
                  results.generated++;
                }
              }
            }

            // Generate home language audio if needed
            if (needsHomeLanguage && LOVABLE_API_KEY) {
              // Translate term
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

              // Translate and generate definition audio
              if (vocabItem.definition) {
                const translatedDef = await translateContent(vocabItem.definition, group.homeLanguage, LOVABLE_API_KEY);
                vocabRecord.translated_definition = translatedDef;
                
                const hlDefBuffer = await generateTTS(translatedDef, group.homeLanguage, ELEVENLABS_API_KEY);
                if (hlDefBuffer) {
                  const hlDefUrl = await storeAudio(supabase, lessonId, group.groupName, `${vocabId}-def`, group.homeLanguage.toLowerCase(), hlDefBuffer);
                  if (hlDefUrl) {
                    vocabRecord.home_language_definition_audio_url = hlDefUrl;
                    results.generated++;
                  }
                }
              }
            }

            // Save to vocabulary_audio table
            const { error: vocabDbError } = await supabase.from('vocabulary_audio').upsert(vocabRecord, {
              onConflict: 'lesson_id,group_name,vocab_id'
            });

            if (vocabDbError) {
              console.error('Vocab audio DB insert error:', vocabDbError);
            } else {
              console.log(`Generated vocabulary audio: ${group.groupName}/${vocabId}`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
            
          } catch (error) {
            console.error(`Error generating vocab audio ${idx} for ${group.groupName}:`, error);
            results.failed++;
          }
        }
      }

      for (const section of sectionConfigs) {
        if (!section.content || section.content.trim().length < 3) continue;

        for (const language of languages) {
          try {
            const sectionId = `${section.id}-${language.toLowerCase()}`;
            
            // Get content - translate if not English
            let textToSpeak = section.content;
            if (language !== 'English' && LOVABLE_API_KEY) {
              console.log(`Translating ${section.id} to ${language}...`);
              textToSpeak = await translateContent(section.content, language, LOVABLE_API_KEY);
            }
            
            // Generate TTS with appropriate content
            const audioBuffer = await generateTTS(textToSpeak, language, ELEVENLABS_API_KEY);
            
            if (!audioBuffer) {
              results.failed++;
              continue;
            }

            // Store in Supabase Storage
            const audioUrl = await storeAudio(
              supabase,
              lessonId,
              group.groupName,
              section.id,
              language,
              audioBuffer
            );

            if (!audioUrl) {
              results.failed++;
              continue;
            }

            // Estimate duration (~128kbps MP3)
            const estimatedDuration = (audioBuffer.byteLength * 8) / (128 * 1000);
            const estimatedCost = textToSpeak.length * 0.00003;

            // Save to generated_audio table
            const { error: dbError } = await supabase.from('generated_audio').upsert({
              lesson_id: lessonId,
              group_id: group.id,
              group_name: group.groupName,
              section_type: section.id.split('-')[0],
              section_id: sectionId,
              audio_url: audioUrl,
              duration_seconds: estimatedDuration,
              language: language,
              characters_used: textToSpeak.length,
            }, {
              onConflict: 'lesson_id,group_name,section_id'
            });

            if (dbError) {
              console.error('DB insert error:', dbError);
            }

            // Track usage
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
            results.audioRecords.push({
              groupName: group.groupName,
              sectionId,
              language,
              audioUrl,
              duration: estimatedDuration
            });

            console.log(`Generated: ${group.groupName}/${sectionId}`);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            console.error(`Error generating ${section.id} for ${group.groupName}:`, error);
            results.failed++;
          }
        }
      }
    }

    console.log(`Audio generation complete. Generated: ${results.generated}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        status: results.failed === 0 ? 'complete' : 'partial',
        generated: results.generated,
        failed: results.failed,
        audioRecords: results.audioRecords
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-lesson-audio:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed',
        generated: 0,
        failed: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
