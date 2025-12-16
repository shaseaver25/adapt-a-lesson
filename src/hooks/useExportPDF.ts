import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { getDocumentStyles, getDocumentContent, isArabicContent } from '@/lib/pdf/htmlBuilder';
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
    
    let container: HTMLDivElement | null = null;
    let styleElement: HTMLStyleElement | null = null;
    
    try {
      // Detect if Arabic/RTL content
      const isRTL = isArabicContent(markdown);
      const pdfOptions = { ...options, isRTL };
      
      // Get styles and content separately
      const styles = getDocumentStyles(pdfOptions);
      const content = getDocumentContent(markdown, pdfOptions);
      
      // Create style element and add to head
      styleElement = document.createElement('style');
      styleElement.id = 'pdf-export-styles';
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
      
      // Create container div in main document (visible for html2canvas to capture)
      container = document.createElement('div');
      container.id = 'pdf-export-container';
      container.className = 'pdf-export-root';
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '8.5in';
      container.style.background = 'white';
      container.style.zIndex = '9999';
      container.style.overflow = 'auto';
      container.style.maxHeight = '100vh';
      container.innerHTML = content;
      document.body.style.overflow = 'hidden';
      document.body.appendChild(container);
      
      // Wait for fonts to render
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filename = `${(options.title || 'document').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      
      // Generate PDF from container
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
      // Clean up container, styles, and body overflow
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      document.body.style.overflow = '';
      setExporting(false);
    }
  };

  return { exportToPDF, exporting };
}
