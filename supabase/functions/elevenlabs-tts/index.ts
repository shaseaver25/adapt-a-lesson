import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, language } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    if (!text) {
      throw new Error('Text is required');
    }

    console.log(`Generating TTS for text length: ${text.length}, language: ${language || 'English'}`);

    // Select voice based on language (using ElevenLabs multilingual voices)
    // Default voices for different languages
    const voiceMap: Record<string, string> = {
      'English': 'EXAVITQu4vr4xnSDxMaL', // Sarah
      'Spanish': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Mandarin': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Vietnamese': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Arabic': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Tagalog': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Korean': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Haitian Creole': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Portuguese': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Russian': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
      'Other': 'pqHfZKP75CvOlQylNhV4', // Bill (multilingual)
    };

    const selectedVoice = voiceId || voiceMap[language || 'English'] || 'EXAVITQu4vr4xnSDxMaL';

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
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
            speed: 0.9, // Slightly slower for clarity in educational content
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

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
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
