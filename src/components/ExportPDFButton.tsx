import { useExportPDF } from '@/hooks/useExportPDF';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';

interface ExportPDFButtonProps {
  lessonContent: string;
  lessonTitle: string;
  subject?: string;
  grade?: string;
  groupName?: string;
  createdAt?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportPDFButton({ 
  lessonContent, 
  lessonTitle,
  subject,
  grade,
  groupName,
  createdAt,
  variant = 'outline',
  size = 'sm',
  className
}: ExportPDFButtonProps) {
  const { exportToPDF, exporting } = useExportPDF();

  const handleExport = () => {
    exportToPDF(lessonContent, {
      title: lessonTitle,
      subject,
      grade,
      groupName,
      createdAt
    });
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={exporting}
      variant={variant}
      size={size}
      className={className}
      title="Download as PDF"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
    </Button>
  );
}
