import React from 'react';
import { Download, RefreshCw, Printer, Palette } from 'lucide-react';
import { GeneratedImage } from '../types';
import { generateBatchPDF } from '../utils/pdfUtils';
import { jsPDF } from 'jspdf';

interface Props {
  images: GeneratedImage[];
  onReset: () => void;
  onColor: (img: GeneratedImage) => void;
  topicName: string;
}

export const ResultGallery: React.FC<Props> = ({ images, onReset, onColor, topicName }) => {
  
  const handleDownloadSingle = (img: GeneratedImage, index: number) => {
    // Create a temporary link to download
    const link = document.createElement('a');
    link.href = img.imageUrl;
    link.download = `coloring-page-${topicName}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSingle = (img: GeneratedImage) => {
    const doc = new jsPDF();
    doc.addImage(img.imageUrl, 'PNG', 10, 10, 190, 277); // A4 roughly
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleBatchDownload = () => {
    generateBatchPDF(images, topicName);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-pink-500 mb-2">🎉 Your Coloring Book is Ready! 🎉</h2>
        <p className="text-slate-600">Print them out or color them right here!</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        <button
          onClick={handleBatchDownload}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center transform transition hover:-translate-y-1"
        >
          <Download className="w-5 h-5 mr-2" />
          Download All (PDF)
        </button>
        <button
          onClick={onReset}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center transform transition hover:-translate-y-1"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Make Another Book
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full px-4">
        {images.map((img, idx) => (
          <div key={img.id} className="bg-white p-4 rounded-2xl shadow-xl border-4 border-sky-200 flex flex-col items-center transition-transform hover:scale-[1.02]">
            <div className="w-full aspect-[1/1.41] bg-gray-50 mb-4 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 relative group">
              <img 
                src={img.imageUrl} 
                alt={`Coloring page ${idx + 1}`}
                className="w-full h-full object-contain p-2"
              />
            </div>
            
            <div className="flex flex-col w-full gap-3">
               <button
                  onClick={() => onColor(img)}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center text-sm transition-all shadow-md transform active:scale-95"
                >
                  <Palette className="w-4 h-4 mr-2" /> Paint Online
                </button>

              <div className="flex space-x-2 w-full">
                <button
                  onClick={() => handleDownloadSingle(img, idx)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 px-4 rounded-xl flex items-center justify-center text-sm transition-colors"
                  title="Download Image"
                >
                  <Download className="w-4 h-4 mr-1" /> PNG
                </button>
                <button
                  onClick={() => handlePrintSingle(img)}
                  className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold py-2 px-4 rounded-xl flex items-center justify-center text-sm transition-colors"
                  title="Print Page"
                >
                  <Printer className="w-4 h-4 mr-1" /> Print
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};