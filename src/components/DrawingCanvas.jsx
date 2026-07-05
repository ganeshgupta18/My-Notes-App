import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoTrashOutline, IoColorPaletteOutline, IoSaveOutline } from 'react-icons/io5';
import { FaEraser, FaPaintBrush } from 'react-icons/fa';

const DrawingCanvas = ({ isOpen, onClose, onSave, initialDrawing = '' }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0f172a'); // Slate-900 black default
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const colors = [
    '#0f172a', // Slate/Black
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#0ea5e9', // Sky
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
  ];

  // Initialize canvas size and load initial sketch if editing
  useEffect(() => {
    if (isOpen && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Responsive sizing
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height || 400;

      // Draw white background on canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load initial drawing image if provided
      if (initialDrawing) {
        const img = new Image();
        img.src = initialDrawing;
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
      }
    }
  }, [isOpen, initialDrawing]);

  // Start Drawing
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse or touch coordinates
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    
    setIsDrawing(true);
  };

  // Draw Line
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop Drawing
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Clear Board
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Export Base64 PNG and Save
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  // Touch event routing to prevent scroll on draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
    };
  }, [isOpen]);

  const getCursorStyle = () => {
    if (isEraser) {
      const radius = brushSize;
      const size = Math.max(radius * 2, 8);
      const center = size / 2;
      return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' fill='none' stroke='black' stroke-width='1.5'><circle cx='${center}' cy='${center}' r='${radius - 0.75}'/></svg>") ${center} ${center}, auto`;
    }
    return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'><line x1='12' y1='4' x2='12' y2='20'/><line x1='4' y1='12' x2='20' y2='12'/></svg>") 12 12, crosshair`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Canvas Dialog Container (Styled as a 9:16 Mobile Screen) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative aspect-[9/16] h-[78vh] w-auto max-w-[95vw] rounded-3xl glass-panel bg-slate-950 border border-slate-800 shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-900 px-4 py-3 sm:px-6 shrink-0">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <FaPaintBrush className="text-violet-400 w-4 h-4" /> Canvas Draw Board
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>

            {/* Drawing Canvas Area (White Canvas Page with dynamic pointer/eraser cursor) */}
            <div 
              ref={containerRef} 
              style={{ cursor: getCursorStyle() }}
              className="flex-1 bg-white relative overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 block w-full h-full touch-none"
              />
            </div>

            {/* Actions Toolbar */}
            <div className="border-t border-slate-900 p-4 sm:px-6 flex flex-col sm:flex-row gap-3.5 sm:items-center sm:justify-between bg-slate-950/90 shrink-0">
              {/* Brush Settings */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Pencil / Eraser swap */}
                <div className="flex items-center rounded-xl bg-slate-900/60 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEraser(false)}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      !isEraser 
                        ? 'bg-violet-600/30 border border-violet-500/30 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FaPaintBrush className="w-3.5 h-3.5" /> Draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEraser(true)}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isEraser 
                        ? 'bg-violet-600/30 border border-violet-500/30 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FaEraser className="w-3.5 h-3.5" /> Eraser
                  </button>
                </div>

                {/* Color Palette Presets (hidden when using eraser) */}
                {!isEraser && (
                  <div className="flex gap-2 items-center">
                    <IoColorPaletteOutline className="w-4 h-4 text-slate-500" />
                    <div className="flex gap-1.5">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className="w-5 h-5 rounded-full border border-slate-900/50 cursor-pointer relative"
                          style={{ backgroundColor: c }}
                        >
                          {color === c && (
                            <span className="absolute inset-0.5 rounded-full border border-slate-950 bg-transparent ring-1 ring-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brush Size Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-550 uppercase">Size</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-20 accent-violet-500 h-1 rounded-lg bg-slate-900 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 font-semibold">{brushSize}px</span>
                </div>
              </div>

              {/* Clear and Save */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                >
                  Clear Screen
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/25 transition-all cursor-pointer"
                >
                  <IoSaveOutline className="w-4 h-4" /> Save Drawing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DrawingCanvas;
