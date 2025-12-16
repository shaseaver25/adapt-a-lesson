import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { buildLessonHTML, isArabicContent } from '@/lib/pdf/htmlBuilder';
import { useToast } from '@/hooks/use-toast';

interface ExportOptions {
  title: string;
  subject?: string;
  grade?: string;
  groupName?: string;
  createdAt?: string;
}

export function useExportPDF() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async (markdown: string, options: ExportOptions) => {
    setExporting(true);
    
    try {
      // Detect if Arabic/RTL content
      const isRTL = isArabicContent(markdown);
      
      // Build HTML from markdown
      const html = buildLessonHTML(markdown, {
        ...options,
        isRTL
      });
      
      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      const filename = `${(options.title || 'document').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      
      // Generate PDF using html2pdf.js
      await html2pdf()
        .set({
          margin: [0.5, 0.75, 0.5, 0.75],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
          },
          jsPDF: { 
            unit: 'in', 
            format: 'letter', 
            orientation: 'portrait' 
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        })
        .from(container)
        .save();
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your document has been exported successfully.'
      });
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not generate PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      // Clean up container
      const tempContainer = document.querySelector('div[style*="-9999px"]');
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
      setExporting(false);
    }
  };

  return { exportToPDF, exporting };
}
