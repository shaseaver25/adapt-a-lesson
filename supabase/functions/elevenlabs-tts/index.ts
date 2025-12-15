import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice configuration by language and section type
const VOICE_CONFIG: Record<string, Record<string, { voiceId: string; stability: number; similarityBoost: number; style: number }>> = {
  english: {
    instructions: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',  // Sarah - warm, clear teacher voice
      stability: 0.75,
      similarityBoost: 0.75,
      style: 0.5
    },
    content: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      stability: 0.7,
      similarityBoost: 0.8,
      style: 0.4
    },
    vocabulary: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      stability: 0.85,  // More stable for clear pronunciation
      similarityBoost: 0.9,
      style: 0.3
    },
    default: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      stability: 0.75,
      similarityBoost: 0.75,
      style: 0.5
    }
  },
  spanish: {
    instructions: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',  // Bill - multilingual
      stability: 0.75,
      similarityBoost: 0.75,
      style: 0.5
    },
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.75,
      similarityBoost: 0.75,
      style: 0.5
    }
  },
  // Multilingual voices for other languages
  mandarin: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  vietnamese: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  arabic: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  tagalog: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  korean: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  portuguese: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  russian: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  french: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  somali: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  hmong: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  swahili: {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  },
  'haitian creole': {
    default: {
      voiceId: 'pqHfZKP75CvOlQylNhV4',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.4
    }
  }
};

// Language code mapping for ElevenLabs
const LANGUAGE_CODES: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'Somali': 'so',
  'Hmong': 'hmn',
  'Vietnamese': 'vi',
  'Arabic': 'ar',
  'Karen': 'kar',
  'Oromo': 'om',
  'Mandarin': 'zh',
  'Chinese Simplified': 'zh',
  'Russian': 'ru',
  'Swahili': 'sw',
  'French': 'fr',
  'Portuguese': 'pt',
  'Korean': 'ko',
  'Tagalog': 'tl',
  'Haitian Creole': 'ht',
  'Other': 'en'
};

function getVoiceConfig(language: string, sectionType: string = 'default') {
  const langKey = language.toLowerCase().replace(/\s+/g, ' ');
  const langConfig = VOICE_CONFIG[langKey] || VOICE_CONFIG.english;
  return langConfig[sectionType] || langConfig.default || VOICE_CONFIG.english.default;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      text, 
      voiceId, 
      language = 'English', 
      sectionType = 'default',
      lessonId,
      groupId,
      groupName,
      sectionId,
      storeAudio = false
    } = await req.json();
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    if (!text) {
      throw new Error('Text is required');
    }

    console.log(`Generating TTS for text length: ${text.length}, language: ${language}, sectionType: ${sectionType}`);

    // Get voice configuration
    const voiceConfig = getVoiceConfig(language, sectionType);
    const selectedVoice = voiceId || voiceConfig.voiceId;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
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
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`Generated audio size: ${audioBuffer.byteLength} bytes`);

    // Estimate duration (~128kbps MP3)
    const estimatedDuration = (audioBuffer.byteLength * 8) / (128 * 1000);
    
    // Cost tracking: ~$0.30 per 10K characters for multilingual_v2
    const estimatedCost = text.length * 0.00003;

    // If storeAudio is true and we have the necessary IDs, store in Supabase
    if (storeAudio && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && lessonId && groupName && sectionId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Upload to storage
      const fileName = `lessons/${lessonId}/${groupName.replace(/\s+/g, '-')}/${sectionId}.mp3`;
      
      const { error: uploadError } = await supabase.storage
        .from('lesson-audio')
        .upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from('lesson-audio')
          .getPublicUrl(fileName);

        // Save to generated_audio table
        await supabase.from('generated_audio').upsert({
          lesson_id: lessonId,
          group_id: groupId,
          group_name: groupName,
          section_type: sectionType,
          section_id: sectionId,
          audio_url: urlData.publicUrl,
          duration_seconds: estimatedDuration,
          language: language,
          characters_used: text.length,
        }, {
          onConflict: 'lesson_id,group_name,section_id'
        });

        // Track usage
        await supabase.from('audio_usage').insert({
          lesson_id: lessonId,
          group_id: groupId,
          section_type: sectionType,
          characters_used: text.length,
          estimated_cost: estimatedCost,
          language: language,
          audio_url: urlData.publicUrl,
          duration_seconds: estimatedDuration,
        });

        console.log(`Audio stored at: ${urlData.publicUrl}`);
      }
    }

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-Audio-Duration': estimatedDuration.toFixed(2),
        'X-Characters-Used': text.length.toString(),
        'X-Estimated-Cost': estimatedCost.toFixed(6),
      },
    });
  } catch (error) {
    console.error('Error in elevenlabs-tts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
