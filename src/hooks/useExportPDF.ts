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
    
    let iframe: HTMLIFrameElement | null = null;
    
    try {
      // Detect if Arabic/RTL content
      const isRTL = isArabicContent(markdown);
      
      // Build HTML from markdown
      const html = buildLessonHTML(markdown, {
        ...options,
        isRTL
      });
      
      // Create hidden iframe for proper HTML document rendering
      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-10000px';
      iframe.style.top = '-10000px';
      iframe.style.width = '8.5in';
      iframe.style.height = '11in';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      // Write full HTML document to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe document');
      
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      // Wait for fonts and content to load
      await new Promise(resolve => setTimeout(resolve, 800));
      if (iframeDoc.fonts) {
        await iframeDoc.fonts.ready;
      }
      
      const filename = `${(options.title || 'document').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      
      // Generate PDF from iframe body
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
        .from(iframeDoc.body)
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
      // Clean up iframe
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      setExporting(false);
    }
  };

  return { exportToPDF, exporting };
}
