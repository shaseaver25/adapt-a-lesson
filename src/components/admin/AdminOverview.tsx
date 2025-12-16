import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, DollarSign, Volume2 } from 'lucide-react';

interface OverviewStats {
  totalUsers: number;
  totalLessons: number;
  totalRubrics: number;
  totalAudioCharacters: number;
  estimatedAICost: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats>({
    totalUsers: 0,
    totalLessons: 0,
    totalRubrics: 0,
    totalAudioCharacters: 0,
    estimatedAICost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch lesson count
      const { count: lessonCount } = await supabase
        .from('generated_lessons')
        .select('*', { count: 'exact', head: true });

      // Fetch rubric count
      const { count: rubricCount } = await supabase
        .from('generated_rubrics')
        .select('*', { count: 'exact', head: true });

      // Fetch audio usage
      const { data: audioData } = await supabase
        .from('audio_usage')
        .select('characters_used, estimated_cost');

      const totalAudioCharacters = audioData?.reduce((sum, row) => sum + (row.characters_used || 0), 0) || 0;
      const audioEstimatedCost = audioData?.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0) || 0;

      // Fetch AI cost logs
      const { data: aiCostData } = await supabase
        .from('ai_cost_logs')
        .select('estimated_cost');

      const aiCost = aiCostData?.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalLessons: lessonCount || 0,
        totalRubrics: rubricCount || 0,
        totalAudioCharacters,
        estimatedAICost: aiCost + audioEstimatedCost,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: 'Registered accounts',
    },
    {
      title: 'Lessons Generated',
      value: stats.totalLessons,
      icon: FileText,
      description: 'Differentiated lessons',
    },
    {
      title: 'Rubrics Created',
      value: stats.totalRubrics,
      icon: FileText,
      description: 'Assessment rubrics',
    },
    {
      title: 'Audio Characters',
      value: stats.totalAudioCharacters.toLocaleString(),
      icon: Volume2,
      description: 'TTS characters used',
    },
    {
      title: 'Estimated AI Cost',
      value: `$${stats.estimatedAICost.toFixed(2)}`,
      icon: DollarSign,
      description: 'Total AI spending',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-8 bg-muted rounded w-16 mt-2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Platform Overview</h2>
        <p className="text-muted-foreground">Key metrics at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
