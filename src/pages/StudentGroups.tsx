import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DraggableStudentGroupCard } from '@/components/DraggableStudentGroupCard';
import { ClassFolderCard, type ClassFolder } from '@/components/ClassFolderCard';
import { StudentGroupFormModal } from '@/components/StudentGroupFormModal';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { Plus, Search, ArrowLeft, Users, FolderPlus } from 'lucide-react';
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
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

function dbToStudentGroup(db: DBStudentGroup): StudentGroup & { id: string; folderId: string | null } {
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
    folderId: db.folder_id,
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
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<(StudentGroup & { id: string }) | null>(null);
  const [editingFolder, setEditingFolder] = useState<ClassFolder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch student groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
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

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['class-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClassFolder[];
    },
  });

  // Group mutations
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

  const moveToFolderMutation = useMutation({
    mutationFn: async ({ groupId, folderId }: { groupId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from('student_groups')
        .update({ folder_id: folderId })
        .eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-groups'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to move group', description: error.message, variant: 'destructive' });
    },
  });

  // Folder mutations
  const createFolderMutation = useMutation({
    mutationFn: async (folder: { folder_name: string; color: string }) => {
      const { error } = await supabase
        .from('class_folders')
        .insert(folder);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-folders'] });
      toast({ title: 'Class created successfully' });
      setIsFolderModalOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Failed to create class', description: error.message, variant: 'destructive' });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, folder }: { id: string; folder: { folder_name: string; color: string } }) => {
      const { error } = await supabase
        .from('class_folders')
        .update(folder)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-folders'] });
      toast({ title: 'Class updated successfully' });
      setEditingFolder(null);
    },
    onError: (error) => {
      toast({ title: 'Failed to update class', description: error.message, variant: 'destructive' });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('class_folders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-folders'] });
      queryClient.invalidateQueries({ queryKey: ['student-groups'] });
      toast({ title: 'Class deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete class', description: error.message, variant: 'destructive' });
    },
  });

  // Filter and organize groups
  const filteredGroups = groups.filter((group) =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get folder info for a group
  const getFolderForGroup = (folderId: string | null) => 
    folders.find((f) => f.id === folderId);

  const ungroupedGroups = filteredGroups.filter((g) => !g.folderId);
  const getGroupsInFolder = (folderId: string) => 
    filteredGroups.filter((g) => g.folderId === folderId);

  const handleSave = (group: StudentGroup) => {
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, group });
    } else {
      createMutation.mutate(group);
    }
  };

  const handleFolderSave = (folder: { folder_name: string; color: string }) => {
    if (editingFolder) {
      updateFolderMutation.mutate({ id: editingFolder.id, folder });
    } else {
      createFolderMutation.mutate(folder);
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

  const handleDeleteFolder = (id: string) => {
    if (confirm('Are you sure you want to delete this class? Groups inside will be moved out.')) {
      deleteFolderMutation.mutate(id);
    }
  };

  const handleDropToFolder = (folderId: string, groupId: string) => {
    moveToFolderMutation.mutate({ groupId, folderId });
  };

  const handleRemoveFromFolder = (groupId: string) => {
    moveToFolderMutation.mutate({ groupId, folderId: null });
  };

  const isLoading = groupsLoading || foldersLoading;

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFolderModalOpen(true)} className="gap-2">
              <FolderPlus className="h-4 w-4" />
              New Class
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Group
            </Button>
          </div>
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

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Folders */}
            {folders.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-foreground">Classes</h2>
                <div className="grid gap-4">
                  {folders.map((folder) => (
                    <ClassFolderCard
                      key={folder.id}
                      folder={folder}
                      groups={getGroupsInFolder(folder.id)}
                      onEdit={() => setEditingFolder(folder)}
                      onDelete={() => handleDeleteFolder(folder.id)}
                      onDrop={(groupId) => handleDropToFolder(folder.id, groupId)}
                      onRemoveGroup={handleRemoveFromFolder}
                      renderGroup={(group) => (
                        <DraggableStudentGroupCard
                          group={group}
                          onEdit={() => handleEdit(group)}
                          onDelete={() => handleDelete(group.id)}
                          compact
                        />
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ungrouped Groups */}
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground">
                {folders.length > 0 ? 'Ungrouped' : 'All Groups'}
              </h2>
              {ungroupedGroups.length === 0 && groups.length === 0 ? (
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
              ) : ungroupedGroups.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  All groups are organized into classes. Drag groups here to remove them from a class.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ungroupedGroups.map((group) => (
                    <DraggableStudentGroupCard
                      key={group.id}
                      group={group}
                      onEdit={() => handleEdit(group)}
                      onDelete={() => handleDelete(group.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Group Modal */}
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

      {/* Create/Edit Folder Modal */}
      <CreateFolderModal
        isOpen={isFolderModalOpen || !!editingFolder}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={handleFolderSave}
        initialData={editingFolder || undefined}
        isLoading={createFolderMutation.isPending || updateFolderMutation.isPending}
      />
    </div>
  );
}
