import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

export const exportToPDF = async (elementId, filename = 'dashboard.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Element not found: " + elementId);
    return;
  }

  try {
    // Generate JPEG instead of PNG to drastically reduce size 
    // and prevent browser Blob UUID naming issues for large files
    const dataUrl = await toJpeg(element, {
      backgroundColor: '#1A0F5A',
      width: 1400,
      height: 800,
      pixelRatio: 2, // High quality
      quality: 0.95 // JPEG quality
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1400, 800]
    });

    pdf.addImage(dataUrl, 'JPEG', 0, 0, 1400, 800);
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error exporting PDF: ' + error.message);
  }
};
