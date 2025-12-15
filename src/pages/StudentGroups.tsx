import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudentGroupCard } from '@/components/StudentGroupCard';
import { StudentGroupFormModal } from '@/components/StudentGroupFormModal';
import { Plus, Search, ArrowLeft, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';

interface DBStudentGroup {
  id: string;
  group_name: string;
  num_students: number;
  reading_level_label: string;
  reading_level_lexile: string | null;
  home_language: string;
  ell_status: string;
  iep_504_status: string;
  learning_preferences: string[];
  accommodations: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function dbToStudentGroup(db: DBStudentGroup): StudentGroup & { id: string } {
  return {
    id: db.id,
    groupName: db.group_name,
    numStudents: db.num_students,
    readingLevelLabel: db.reading_level_label as StudentGroup['readingLevelLabel'],
    readingLevelLexile: db.reading_level_lexile || '',
    homeLanguage: db.home_language,
    ellStatus: db.ell_status as StudentGroup['ellStatus'],
    iep504Status: db.iep_504_status as StudentGroup['iep504Status'],
    learningPreferences: db.learning_preferences || [],
    accommodations: db.accommodations || [],
    notes: db.notes || '',
  };
}

function studentGroupToDB(group: StudentGroup) {
  return {
    group_name: group.groupName,
    num_students: group.numStudents,
    reading_level_label: group.readingLevelLabel,
    reading_level_lexile: group.readingLevelLexile || null,
    home_language: group.homeLanguage,
    ell_status: group.ellStatus,
    iep_504_status: group.iep504Status,
    learning_preferences: group.learningPreferences,
    accommodations: group.accommodations,
    notes: group.notes || null,
  };
}

export default function StudentGroups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<(StudentGroup & { id: string }) | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DBStudentGroup[]).map(dbToStudentGroup);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (group: StudentGroup) => {
      const { error } = await supabase
        .from('student_groups')
        .insert(studentGroupToDB(group));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-groups'] });
      toast({ title: 'Student group created successfully' });
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Failed to create student group', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, group }: { id: string; group: StudentGroup }) => {
      const { error } = await supabase
        .from('student_groups')
        .update(studentGroupToDB(group))
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-groups'] });
      toast({ title: 'Student group updated successfully' });
      setEditingGroup(null);
    },
    onError: (error) => {
      toast({ title: 'Failed to update student group', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-groups'] });
      toast({ title: 'Student group deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete student group', description: error.message, variant: 'destructive' });
    },
  });

  const filteredGroups = groups.filter((group) =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (group: StudentGroup) => {
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, group });
    } else {
      createMutation.mutate(group);
    }
  };

  const handleEdit = (group: StudentGroup & { id: string }) => {
    setEditingGroup(group);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student group?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="font-display font-bold text-xl text-foreground">Student Groups</h1>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Group
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">
              {searchQuery ? 'No groups found' : 'No student groups yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first student group to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Group
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <StudentGroupCard
                key={group.id}
                group={group}
                onEdit={() => handleEdit(group)}
                onDelete={() => handleDelete(group.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      <StudentGroupFormModal
        isOpen={isModalOpen || !!editingGroup}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGroup(null);
        }}
        onSave={handleSave}
        initialData={editingGroup || undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
