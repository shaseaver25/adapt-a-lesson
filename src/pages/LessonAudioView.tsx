import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Headphones, 
  Download, 
  Play, 
  Pause, 
  Loader2,
  CheckSquare,
  Square,
  FileArchive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecord {
  id: string;
  lesson_id: string;
  group_name: string;
  section_type: string;
  section_id: string;
  language: string;
  audio_url: string;
  storage_path: string | null;
  duration_seconds: number | null;
  characters_used: number;
  created_at: string;
}

interface VocabularyAudioRecord {
  id: string;
  lesson_id: string;
  group_name: string;
  term: string;
  definition: string | null;
  home_language: string | null;
  english_term_audio_url: string | null;
  english_definition_audio_url: string | null;
  home_language_term_audio_url: string | null;
  home_language_definition_audio_url: string | null;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇺🇸',
  'Spanish': '🇪🇸',
  'Vietnamese': '🇻🇳',
  'Chinese': '🇨🇳',
  'Somali': '🇸🇴',
  'Arabic': '🇸🇦',
  'French': '🇫🇷',
  'Portuguese': '🇧🇷',
  'Russian': '🇷🇺',
  'Hmong': '🌏',
  'Karen': '🌏',
  'Oromo': '🇪🇹',
  'Swahili': '🇰🇪',
};

const SECTION_ICONS: Record<string, string> = {
  'learning_target': '🎯',
  'instructions': '📝',
  'content': '📖',
  'vocabulary': '📚',
  'reflection': '💭',
};

const READING_LEVEL_EMOJIS: Record<string, string> = {
  'Embers': '🔥',
  'Sparks': '✨',
  'Flames': '🔥',
  'Blazers': '🌟',
  'Supernovas': '💫',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function AudioPlayer({ url, onPlay }: { url: string; onPlay?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      <div 
        className="flex-1 h-2 bg-muted rounded-full cursor-pointer"
        onClick={handleSeek}
      >
        <div 
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
      </div>
      
      <span className="text-xs text-muted-foreground min-w-[70px] text-right">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </div>
  );
}

export default function LessonAudioView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Fetch lesson details
  const { data: lesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_lessons')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch audio records
  const { data: audioRecords = [], isLoading: loadingAudio } = useQuery({
    queryKey: ['lesson-audio', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_audio')
        .select('*')
        .eq('lesson_id', id)
        .order('group_name')
        .order('section_type');
      if (error) throw error;
      return data as AudioRecord[];
    },
    enabled: !!id,
  });

  // Fetch vocabulary audio
  const { data: vocabAudio = [], isLoading: loadingVocab } = useQuery({
    queryKey: ['vocab-audio', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocabulary_audio')
        .select('*')
        .eq('lesson_id', id)
        .order('group_name');
      if (error) throw error;
      return data as VocabularyAudioRecord[];
    },
    enabled: !!id,
  });

  // Refresh signed URLs for audio files
  useEffect(() => {
    const refreshUrls = async () => {
      const urls: Record<string, string> = {};
      
      for (const record of audioRecords) {
        if (record.storage_path) {
          const { data } = await supabase.storage
            .from('lesson-audio')
            .createSignedUrl(record.storage_path, 3600);
          if (data?.signedUrl) {
            urls[record.id] = data.signedUrl;
          }
        } else if (record.audio_url) {
          urls[record.id] = record.audio_url;
        }
      }
      
      // Add vocabulary audio URLs
      for (const vocab of vocabAudio) {
        if (vocab.english_term_audio_url) {
          urls[`vocab-${vocab.id}-en-term`] = vocab.english_term_audio_url;
        }
        if (vocab.english_definition_audio_url) {
          urls[`vocab-${vocab.id}-en-def`] = vocab.english_definition_audio_url;
        }
        if (vocab.home_language_term_audio_url) {
          urls[`vocab-${vocab.id}-hl-term`] = vocab.home_language_term_audio_url;
        }
        if (vocab.home_language_definition_audio_url) {
          urls[`vocab-${vocab.id}-hl-def`] = vocab.home_language_definition_audio_url;
        }
      }
      
      setSignedUrls(urls);
    };
    
    if (audioRecords.length > 0 || vocabAudio.length > 0) {
      refreshUrls();
    }
  }, [audioRecords, vocabAudio]);

  // Group audio by student group
  const groupedAudio = audioRecords.reduce((acc, record) => {
    if (!acc[record.group_name]) {
      acc[record.group_name] = [];
    }
    acc[record.group_name].push(record);
    return acc;
  }, {} as Record<string, AudioRecord[]>);

  // Group vocabulary by student group
  const groupedVocab = vocabAudio.reduce((acc, record) => {
    if (!acc[record.group_name]) {
      acc[record.group_name] = [];
    }
    acc[record.group_name].push(record);
    return acc;
  }, {} as Record<string, VocabularyAudioRecord[]>);

  const allGroups = [...new Set([...Object.keys(groupedAudio), ...Object.keys(groupedVocab)])];

  // Build list of all selectable items
  const allSelectableItems: { id: string; label: string; url: string; filename: string }[] = [];
  
  audioRecords.forEach(record => {
    const url = signedUrls[record.id];
    if (url) {
      allSelectableItems.push({
        id: record.id,
        label: `${record.group_name} - ${record.section_type} (${record.language})`,
        url,
        filename: `${record.group_name}-${record.section_type}-${record.language}.mp3`.replace(/\s+/g, '-').toLowerCase(),
      });
    }
  });
  
  vocabAudio.forEach(vocab => {
    const keys = [
      { key: `vocab-${vocab.id}-en-term`, label: `${vocab.group_name} - Vocab: "${vocab.term}" (English)`, filename: `${vocab.group_name}-vocab-${vocab.term}-en.mp3` },
      { key: `vocab-${vocab.id}-en-def`, label: `${vocab.group_name} - Vocab Def: "${vocab.term}" (English)`, filename: `${vocab.group_name}-vocab-${vocab.term}-def-en.mp3` },
      { key: `vocab-${vocab.id}-hl-term`, label: `${vocab.group_name} - Vocab: "${vocab.term}" (${vocab.home_language})`, filename: `${vocab.group_name}-vocab-${vocab.term}-${vocab.home_language}.mp3` },
      { key: `vocab-${vocab.id}-hl-def`, label: `${vocab.group_name} - Vocab Def: "${vocab.term}" (${vocab.home_language})`, filename: `${vocab.group_name}-vocab-${vocab.term}-def-${vocab.home_language}.mp3` },
    ];
    
    keys.forEach(({ key, label, filename }) => {
      const url = signedUrls[key];
      if (url) {
        allSelectableItems.push({
          id: key,
          label,
          url,
          filename: filename.replace(/\s+/g, '-').toLowerCase(),
        });
      }
    });
  });

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(allSelectableItems.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const downloadSingle = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download the audio file.',
        variant: 'destructive',
      });
    }
  };

  const downloadSelectedAsZip = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const selectedItems = allSelectableItems.filter(item => selectedIds.has(item.id));
      
      for (const item of selectedItems) {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          zip.file(item.filename, blob);
        } catch (error) {
          console.error(`Failed to fetch ${item.filename}:`, error);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${lesson?.lesson_title || 'lesson'}-audio.zip`.replace(/\s+/g, '-').toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: 'Download complete',
        description: `Downloaded ${selectedItems.length} audio files.`,
      });
    } catch (error) {
      console.error('ZIP download failed:', error);
      toast({
        title: 'Download failed',
        description: 'Could not create the ZIP file.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const isLoading = loadingAudio || loadingVocab;
  const hasAudio = audioRecords.length > 0 || vocabAudio.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/saved-lessons">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Lessons
                </Button>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-primary" />
                <h1 className="font-display font-bold text-xl truncate max-w-[300px]">
                  {lesson?.lesson_title || 'Lesson'} - Audio
                </h1>
              </div>
            </div>
            
            {hasAudio && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedIds.size === allSelectableItems.length ? deselectAll : selectAll}
                  className="gap-2"
                >
                  {selectedIds.size === allSelectableItems.length ? (
                    <>
                      <Square className="h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Select All
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={downloadSelectedAsZip}
                  disabled={selectedIds.size === 0 || isDownloading}
                  className="gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileArchive className="h-4 w-4" />
                  )}
                  Download ({selectedIds.size})
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading audio files...</p>
          </div>
        ) : !hasAudio ? (
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl mb-2">No Audio Generated</h2>
              <p className="text-muted-foreground">
                This lesson doesn't have any audio files yet. Generate audio from the lesson view.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {allGroups.map((groupName) => {
              const groupAudio = groupedAudio[groupName] || [];
              const groupVocab = groupedVocab[groupName] || [];
              
              // Extract reading level from group name
              const levelMatch = groupName.match(/\((.*?)\)/);
              const levelName = levelMatch ? levelMatch[1] : null;
              const levelEmoji = levelName ? READING_LEVEL_EMOJIS[levelName] || '' : '';
              
              return (
                <Card key={groupName}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {levelEmoji && <span>{levelEmoji}</span>}
                      {groupName}
                      <Badge variant="secondary" className="ml-auto">
                        {groupAudio.length + groupVocab.length} files
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Section Audio */}
                    {groupAudio.map((record) => {
                      const url = signedUrls[record.id];
                      if (!url) return null;
                      
                      const item = allSelectableItems.find(i => i.id === record.id);
                      
                      return (
                        <div 
                          key={record.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <Checkbox
                            checked={selectedIds.has(record.id)}
                            onCheckedChange={() => toggleSelection(record.id)}
                          />
                          
                          <span className="text-lg">
                            {SECTION_ICONS[record.section_type] || '🎵'}
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm capitalize">
                                {record.section_type.replace(/_/g, ' ')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {LANGUAGE_FLAGS[record.language] || '🌐'} {record.language}
                              </Badge>
                            </div>
                            <AudioPlayer url={url} />
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => item && downloadSingle(url, item.filename)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    
                    {/* Vocabulary Audio */}
                    {groupVocab.map((vocab) => {
                      const vocabUrls = [
                        { key: `vocab-${vocab.id}-en-term`, label: `"${vocab.term}"`, lang: 'English', type: 'term' },
                        { key: `vocab-${vocab.id}-en-def`, label: `Definition`, lang: 'English', type: 'def' },
                        { key: `vocab-${vocab.id}-hl-term`, label: `"${vocab.term}"`, lang: vocab.home_language || '', type: 'term' },
                        { key: `vocab-${vocab.id}-hl-def`, label: `Definition`, lang: vocab.home_language || '', type: 'def' },
                      ].filter(v => signedUrls[v.key]);
                      
                      if (vocabUrls.length === 0) return null;
                      
                      return (
                        <div key={vocab.id} className="border-t pt-3 mt-3 first:border-0 first:pt-0 first:mt-0">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            📚 Vocabulary: {vocab.term}
                          </div>
                          {vocabUrls.map(({ key, label, lang, type }) => {
                            const url = signedUrls[key];
                            const item = allSelectableItems.find(i => i.id === key);
                            
                            return (
                              <div 
                                key={key}
                                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors ml-4 mb-2"
                              >
                                <Checkbox
                                  checked={selectedIds.has(key)}
                                  onCheckedChange={() => toggleSelection(key)}
                                />
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm">
                                      {label} {type === 'def' ? '(definition)' : ''}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {LANGUAGE_FLAGS[lang] || '🌐'} {lang}
                                    </Badge>
                                  </div>
                                  <AudioPlayer url={url} />
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => item && downloadSingle(url, item.filename)}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
