import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ArrowLeft, Undo, Redo, 
  PaintBucket, Brush, Pen, ZoomIn, ZoomOut, Maximize, 
  Trash2, Download
} from 'lucide-react';

interface Props {
  imageUrl: string;
  onBack: () => void;
  topicName: string;
}

// Full 20-Color Palette
const PALETTE = [
  '#FF0000', // Red
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#00AA00', // Green
  '#FFA500', // Orange
  '#800080', // Purple
  '#A52A2A', // Brown
  '#000000', // Black
  '#FFFFFF', // White
  '#808080', // Gray
  '#FFC0CB', // Pink
  '#ADD8E6', // Light Blue
  '#90EE90', // Light Green
  '#FFD700', // Gold
  '#FFDAB9', // Peach
  '#000080', // Navy
  '#800000', // Maroon
  '#008080', // Teal
  '#E6E6FA', // Lavender
  '#F4A460', // Sand
];

type ToolType = 'pencil' | 'brush' | 'fill';

export const OnlineColoring: React.FC<Props> = ({ imageUrl, onBack, topicName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
  const [activeTool, setActiveTool] = useState<ToolType>('fill');
  const [brushSize, setBrushSize] = useState<number>(12); // Default for brush
  const [zoom, setZoom] = useState<number>(1);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Logic to fit image to screen initially
      const maxWidth = Math.min(window.innerWidth - 32, 1200);
      const maxHeight = window.innerHeight * 0.7; // 70% of screen height
      
      let newWidth = img.width;
      let newHeight = img.height;

      const ratio = Math.min(maxWidth / newWidth, maxHeight / newHeight);
      if (ratio < 1) {
        newWidth = Math.floor(newWidth * ratio);
        newHeight = Math.floor(newHeight * ratio);
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw outline
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Save initial state (Index 0 is clean outline)
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      setHistoryStep(0);
      setImageLoaded(true);
    };
  }, [imageUrl]);

  // --- History (Undo/Redo) ---
  
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1); // Remove redoable future
    
    // Limit stack
    if (newHistory.length > 15) newHistory.shift();
    
    const updatedHistory = [...newHistory, newData];
    setHistory(updatedHistory);
    setHistoryStep(updatedHistory.length - 1);
  }, [history, historyStep]);

  const restoreState = (stepIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !history[stepIndex]) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.putImageData(history[stepIndex], 0, 0);
  };

  const handleUndo = () => {
    if (historyStep <= 0) return;
    const newStep = historyStep - 1;
    restoreState(newStep);
    setHistoryStep(newStep);
  };

  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    restoreState(newStep);
    setHistoryStep(newStep);
  };

  const handleClear = () => {
    if (history.length === 0) return;
    const cleanState = history[0]; // Index 0 is original clean image
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.putImageData(cleanState, 0, 0);
    saveState(); // Save "clear" as an action
  };

  // --- Zoom Logic ---

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  // --- Tool Logic ---

  const switchTool = (tool: ToolType) => {
    setActiveTool(tool);
    // Set default sizes for convenience
    if (tool === 'pencil') setBrushSize(3);
    if (tool === 'brush') setBrushSize(15);
  };

  // --- Drawing Logic (Mouse & Touch) ---

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Determine scale ratio (Internal Canvas Pixels / Visual CSS Pixels)
    // getBoundingClientRect returns the visual size (including Zoom transform)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool === 'fill') {
      const { x, y } = getCoordinates(e);
      handleFill(Math.floor(x), Math.floor(y));
      return;
    }

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // 'multiply' blends color with black lines properly (lines stay black)
    ctx.globalCompositeOperation = 'multiply'; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = selectedColor;
    
    ctx.lineTo(x, y); // Draw dot
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || activeTool === 'fill') return;
    if (e.cancelable) e.preventDefault(); // Prevent scroll on touch

    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.beginPath();
      saveState();
    }
  };

  // --- Fill Logic ---

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const handleFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.globalCompositeOperation = 'source-over'; // Fill must cover

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const { r: fillR, g: fillG, b: fillB } = hexToRgb(selectedColor);
    
    const startPos = (startY * width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];

    const tolerance = 60;

    // Optimization: Don't fill if color matches or if clicking black line
    if (
      (Math.abs(startR - fillR) < 10 && Math.abs(startG - fillG) < 10 && Math.abs(startB - fillB) < 10) ||
      (startR < 50 && startG < 50 && startB < 50)
    ) return;

    const stack = [[startX, startY]];
    const processed = new Int8Array(width * height);

    while (stack.length) {
      const [x, y] = stack.pop()!;
      const idx = y * width + x;
      if (processed[idx]) continue;
      
      let pixelPos = idx * 4;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const r = data[pixelPos];
      const g = data[pixelPos + 1];
      const b = data[pixelPos + 2];
      
      const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB);

      if (diff < tolerance) {
        data[pixelPos] = fillR;
        data[pixelPos + 1] = fillG;
        data[pixelPos + 2] = fillB;
        data[pixelPos + 3] = 255;
        processed[idx] = 1;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveState();
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `my-art-${topicName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-fredoka">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="bg-white shadow-md p-2 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-2">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="hidden md:block font-bold text-lg text-slate-700">{topicName}</h2>
        </div>

        {/* Center Tools */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 space-x-1">
          <button
            onClick={() => switchTool('pencil')}
            className={`p-2 rounded-md flex flex-col items-center min-w-[3rem] ${activeTool === 'pencil' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <Pen size={18} />
            <span className="text-[9px] font-bold uppercase mt-1">Pencil</span>
          </button>
          <button
            onClick={() => switchTool('brush')}
            className={`p-2 rounded-md flex flex-col items-center min-w-[3rem] ${activeTool === 'brush' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <Brush size={18} />
            <span className="text-[9px] font-bold uppercase mt-1">Brush</span>
          </button>
          <button
            onClick={() => switchTool('fill')}
            className={`p-2 rounded-md flex flex-col items-center min-w-[3rem] ${activeTool === 'fill' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <PaintBucket size={18} />
            <span className="text-[9px] font-bold uppercase mt-1">Fill</span>
          </button>
          
          <div className="w-px h-8 bg-slate-300 mx-1"></div>

          <button onClick={handleUndo} disabled={historyStep <= 0} className="p-2 text-slate-600 hover:text-blue-600 disabled:opacity-30">
            <Undo size={20} />
          </button>
          <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 text-slate-600 hover:text-blue-600 disabled:opacity-30">
            <Redo size={20} />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleClear}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
            title="Clear All"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={handleDownload}
            className="bg-green-500 hover:bg-green-600 text-white p-2 md:px-4 md:py-2 rounded-full font-bold shadow-md text-sm flex items-center"
          >
            <Download size={18} className="md:mr-2" /> 
            <span className="hidden md:inline">Save</span>
          </button>
        </div>
      </div>

      {/* --- SUB TOOLBAR (Size & Zoom) --- */}
      <div className="bg-white border-b border-slate-200 p-2 flex items-center justify-center space-x-6 text-sm overflow-x-auto shrink-0 z-10">
        
        {/* Brush Size Slider (Only for pencil/brush) */}
        {activeTool !== 'fill' && (
          <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            <span className="text-slate-400 font-bold uppercase text-xs">Size</span>
            <input 
              type="range" 
              min="2" 
              max="50" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div 
              className="rounded-full bg-slate-800" 
              style={{ width: brushSize, height: brushSize, minWidth: 4, minHeight: 4, maxHeight: 24, maxWidth: 24 }}
            />
          </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
          <button onClick={handleZoomOut} className="p-1 hover:bg-white rounded text-slate-600"><ZoomOut size={16} /></button>
          <span className="font-mono w-12 text-center text-slate-600 font-bold">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1 hover:bg-white rounded text-slate-600"><ZoomIn size={16} /></button>
          <button onClick={handleResetZoom} className="ml-2 p-1 hover:bg-white rounded text-slate-600" title="Reset"><Maximize size={16} /></button>
        </div>
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Palette Sidebar */}
        <div className="w-16 md:w-20 bg-white border-r border-slate-200 overflow-y-auto shrink-0 flex flex-col items-center py-4 space-y-2 z-10">
          {PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`
                w-10 h-10 md:w-12 md:h-12 rounded-full shadow-sm transition-transform
                ${selectedColor === color ? 'scale-110 ring-4 ring-blue-400 z-10' : 'hover:scale-105'}
                ${color === '#FFFFFF' ? 'border border-gray-200' : ''}
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Canvas Area - Scrollable Container */}
        <div className="flex-1 bg-slate-200 overflow-auto flex items-center justify-center p-4 relative cursor-crosshair touch-none">
          <div 
            ref={containerRef}
            className="shadow-2xl bg-white transition-transform duration-100 ease-linear origin-center"
            style={{ transform: `scale(${zoom})` }}
          >
             {!imageLoaded && (
               <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold bg-white z-20">
                 Loading Canvas...
               </div>
             )}
             <canvas
               ref={canvasRef}
               onMouseDown={startDrawing}
               onMouseMove={draw}
               onMouseUp={stopDrawing}
               onMouseLeave={stopDrawing}
               onTouchStart={startDrawing}
               onTouchMove={draw}
               onTouchEnd={stopDrawing}
               className="block"
             />
          </div>
        </div>

      </div>
    </div>
  );
};