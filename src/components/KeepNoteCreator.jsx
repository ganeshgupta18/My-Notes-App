import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoPin, IoPinOutline, IoAddOutline, IoClose, 
  IoColorPaletteOutline, IoImageOutline, IoBrushOutline, 
  IoMicOutline, IoListOutline, IoTrashOutline, IoCheckmarkCircleOutline 
} from 'react-icons/io5';
import DrawingCanvas from './DrawingCanvas';
import AudioRecorder from './AudioRecorder';

const KeepNoteCreator = ({ onSave }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState('#1e293b'); // default slate-800 look
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Rich Media Attachments
  const [drawing, setDrawing] = useState('');
  const [audio, setAudio] = useState('');
  const [image, setImage] = useState('');
  const [isChecklist, setIsChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  // Modals Visibility
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);

  const containerRef = useRef(null);
  const colorPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const colorPresets = [
    '#1e293b', // Default Slate
    '#3b0764', // Deep Violet
    '#0c4a6e', // Deep Blue
    '#064e3b', // Deep Emerald
    '#4c0519', // Deep Rose
    '#451a03', // Deep Amber
    '#4a044e', // Deep Fuchsia
  ];

  // Save Note & Collapse
  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    const hasChecklistItems = isChecklist && checklistItems.length > 0;
    const hasAttachments = drawing || audio || image;

    if (trimmedTitle || trimmedContent || hasChecklistItems || hasAttachments) {
      onSave({
        title: trimmedTitle || 'Untitled Note',
        content: isChecklist ? '' : trimmedContent,
        tags,
        color,
        isPinned,
        drawing,
        audio,
        image,
        isChecklist,
        checklistItems,
      });
    }

    // Reset everything
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setIsPinned(false);
    setColor('#1e293b');
    setDrawing('');
    setAudio('');
    setImage('');
    setIsChecklist(false);
    setChecklistItems([]);
    setNewItemText('');
    setIsExpanded(false);
    setShowColorPicker(false);
  };

  // Click Outside detector
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't auto-save if any overlay modals (Canvas/Audio) are currently active
      if (isCanvasOpen || isAudioOpen) return;

      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isExpanded) {
          handleSave();
        }
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, isCanvasOpen, isAudioOpen, title, content, tags, isPinned, color, drawing, audio, image, isChecklist, checklistItems]);

  // Image Upload reader
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1.5) {
        alert('Images must be smaller than 1.5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setIsExpanded(true); // Open creator to preview
      };
      reader.readAsDataURL(file);
    }
  };

  // Checklist utilities
  const handleAddChecklistItem = () => {
    if (newItemText.trim()) {
      setChecklistItems([...checklistItems, { text: newItemText.trim(), completed: false }]);
      setNewItemText('');
    }
  };

  const handleChecklistKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChecklistItem();
    }
  };

  const handleRemoveChecklistItem = (idxToRemove) => {
    setChecklistItems(checklistItems.filter((_, idx) => idx !== idxToRemove));
  };

  const handleToggleChecklistItem = (idxToToggle) => {
    setChecklistItems(
      checklistItems.map((item, idx) =>
        idx === idxToToggle ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Tag list helpers
  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Color preset background styles
  const bgStyle = color === '#1e293b' 
    ? {} 
    : { backgroundColor: `${color}44`, borderColor: `${color}aa` };

  return (
    <div className="w-full flex justify-center mb-10 px-2 sm:px-4">
      <motion.div
        ref={containerRef}
        layout
        style={bgStyle}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className={`w-full max-w-xl rounded-2xl glass-panel bg-slate-900/30 border border-slate-800/80 p-4 shadow-xl transition-colors ${
          !isExpanded ? 'hover:border-slate-700/60' : ''
        }`}
      >
        <AnimatePresence initial={false}>
          {!isExpanded ? (
            /* COLLAPSED QUICK-ADD PANEL (Google Keep Style) */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between text-slate-500 hover:text-slate-400"
              onClick={() => setIsExpanded(true)}
            >
              <span className="text-sm font-semibold pl-2 cursor-pointer select-none">Take a note...</span>
              <div className="flex items-center gap-1">
                {/* Checklist shortcut */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChecklist(true);
                    setIsExpanded(true);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-900 transition-colors text-slate-400 hover:text-white cursor-pointer"
                  title="Checklist Note"
                >
                  <IoListOutline className="w-5 h-5" />
                </button>

                {/* Canvas shortcut */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCanvasOpen(true);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-900 transition-colors text-slate-400 hover:text-white cursor-pointer"
                  title="Drawing Sketch"
                >
                  <IoBrushOutline className="w-5 h-5" />
                </button>

                {/* Photo shortcut */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="p-2 rounded-xl hover:bg-slate-900 transition-colors text-slate-400 hover:text-white cursor-pointer"
                  title="Attach Photo"
                >
                  <IoImageOutline className="w-5 h-5" />
                </button>

                {/* Audio shortcut */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAudioOpen(true);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-900 transition-colors text-slate-400 hover:text-white cursor-pointer"
                  title="Record Voice Memo"
                >
                  <IoMicOutline className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* EXPANDED FULL EDITOR PANEL */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {/* Render Image or Drawing Header preview at the top of the card */}
              {(drawing || image) && (
                <div className="w-full max-h-[160px] overflow-hidden rounded-xl relative bg-slate-950/50 border border-slate-800/80 flex items-center justify-center p-2 mb-1 group/header">
                  <img
                    src={drawing || image}
                    alt="attachment header"
                    className="max-h-[140px] object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setDrawing('');
                      setImage('');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-rose-400 hover:text-rose-300 opacity-0 group-hover/header:opacity-100 transition-opacity cursor-pointer"
                    title="Remove Image"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Title Input & Pin toggle */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 font-bold text-base py-1 px-1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded-xl hover:bg-slate-850 transition-colors cursor-pointer ${
                    isPinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isPinned ? <IoPin className="w-4.5 h-4.5" /> : <IoPinOutline className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Note Content (Checklist Manager or Text Block) */}
              {isChecklist ? (
                <div className="flex flex-col gap-2 px-1">
                  {/* checklist item list */}
                  {checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(idx)}
                        className="custom-checkbox"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updated = [...checklistItems];
                          updated[idx].text = e.target.value;
                          setChecklistItems(updated);
                        }}
                        className={`flex-1 bg-transparent border-none outline-none text-xs ${
                          item.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <IoClose className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add Checklist Item input */}
                  <div className="flex items-center gap-2 border-t border-slate-900/60 pt-2.5 mt-1">
                    <IoAddOutline className="text-slate-500 w-4.5 h-4.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add checklist item..."
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={handleChecklistKeyDown}
                      className="w-full bg-transparent border-none outline-none text-xs text-slate-300 placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold hover:text-white transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <textarea
                  placeholder="Take a note..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-550 text-sm leading-relaxed resize-none py-1 px-1"
                />
              )}

              {/* Render Audio memo preview */}
              {audio && (
                <div className="w-full mt-1.5 mb-2 rounded-xl bg-slate-950/65 p-2 border border-slate-850/60 flex items-center justify-between group/audio">
                  <audio
                    src={audio}
                    controls
                    className="w-full h-8 scale-95 accent-violet-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAudio('')}
                    className="p-1.5 rounded-full text-rose-400 hover:text-rose-300 bg-slate-900 border border-slate-800 ml-2 cursor-pointer"
                    title="Remove Audio Memo"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                  </button>
                </div>
              )}



              {/* Toolbar Actions */}
              <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 mt-1.5 relative">
                <div className="flex items-center gap-2 sm:gap-3.5">
                  {/* Color Palette Button */}
                  <div className="relative" ref={colorPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-850 transition-colors cursor-pointer"
                      title="Change Color"
                    >
                      <IoColorPaletteOutline className="w-4.5 h-4.5" />
                    </button>

                    {/* Popover Color list */}
                    <AnimatePresence>
                      {showColorPicker && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 5 }}
                          className="absolute bottom-9 left-0 z-20 flex gap-1.5 p-2 rounded-xl glass-panel bg-slate-950 border border-slate-800 shadow-xl"
                        >
                          {colorPresets.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setColor(preset)}
                              className="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center relative cursor-pointer"
                              style={{ backgroundColor: preset }}
                            >
                              {color === preset && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Toggle checklist mode button inside editor */}
                  <button
                    type="button"
                    onClick={() => setIsChecklist(!isChecklist)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isChecklist ? 'text-violet-400 bg-violet-950/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-850'
                    }`}
                    title="Toggle Checklist Mode"
                  >
                    <IoListOutline className="w-4.5 h-4.5" />
                  </button>

                  {/* Canvas button inside editor */}
                  <button
                    type="button"
                    onClick={() => setIsCanvasOpen(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-850 transition-colors cursor-pointer"
                    title="Draw on Canvas"
                  >
                    <IoBrushOutline className="w-4.5 h-4.5" />
                  </button>

                  {/* Photo button inside editor */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-850 transition-colors cursor-pointer"
                    title="Upload Photo"
                  >
                    <IoImageOutline className="w-4.5 h-4.5" />
                  </button>

                  {/* Voice memo button inside editor */}
                  <button
                    type="button"
                    onClick={() => setIsAudioOpen(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-850 transition-colors cursor-pointer"
                    title="Record Voice Memo"
                  >
                    <IoMicOutline className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Close/Save trigger */}
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-bold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Canvas Drawing Board Modal Overlay */}
      <DrawingCanvas
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSave={setDrawing}
        initialDrawing={drawing}
      />

      {/* Audio Memo Recorder Modal Overlay */}
      <AudioRecorder
        isOpen={isAudioOpen}
        onClose={() => setIsAudioOpen(false)}
        onSave={setAudio}
      />
    </div>
  );
};

export default KeepNoteCreator;
