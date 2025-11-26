import { jsPDF } from 'jspdf';
import { GeneratedImage } from '../types';

export const generateBatchPDF = (images: GeneratedImage[], title: string) => {
  // A4 size in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN = 10;
  const IMAGE_WIDTH = PAGE_WIDTH - (MARGIN * 2);
  const IMAGE_HEIGHT = PAGE_HEIGHT - (MARGIN * 2) - 20; // Room for title/footer

  images.forEach((img, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Add a simple header
    doc.setFontSize(16);
    doc.text("My Coloring Book", PAGE_WIDTH / 2, 15, { align: 'center' });
    
    doc.addImage(
      img.imageUrl,
      'PNG', // Assuming PNG from Gemini (or JPEG, but PNG usually works for base64)
      MARGIN,
      25,
      IMAGE_WIDTH,
      IMAGE_HEIGHT, // We might need to adjust this to preserve aspect ratio, but stretching slightly for full page is often desired for coloring books
      undefined,
      'FAST'
    );

    doc.setFontSize(10);
    doc.text(`Page ${index + 1}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
  });

  doc.save(`${title.toLowerCase().replace(/\s/g, '-')}-coloring-book.pdf`);
};
