import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoCloseOutline, IoAddOutline, IoClose, IoColorPaletteOutline, 
  IoImageOutline, IoBrushOutline, IoMicOutline, IoListOutline, IoTrashOutline,
  IoShareSocialOutline
} from 'react-icons/io5';
import DrawingCanvas from './DrawingCanvas';
import AudioRecorder from './AudioRecorder';

const NoteModal = ({ note, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState('#1e293b');

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
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleShare = async (e) => {
    if (e) e.preventDefault();
    const shareText = isChecklist
      ? checklistItems.map((item) => `${item.completed ? '✓' : '☐'} ${item.text}`).join('\n')
      : content;
    const shareData = {
      title: title || 'Shared Note',
      text: `${title || 'Shared Note'}\n\n${shareText || ''}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Web Share API error:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}`);
        alert('Note contents copied to clipboard!');
      } catch (err) {
        console.error('Clipboard copy error:', err);
        alert('Failed to copy note contents.');
      }
    }
  };

  const colorPresets = [
    '#1e293b', // Default Slate
    '#3b0764', // Deep Violet
    '#0c4a6e', // Deep Blue
    '#064e3b', // Deep Emerald
    '#4c0519', // Deep Rose
    '#451a03', // Deep Amber
    '#4a044e', // Deep Fuchsia
  ];

  // Set initial fields when note edits change
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags || []);
      setColor(note.color || '#1e293b');
      setDrawing(note.drawing || '');
      setAudio(note.audio || '');
      setImage(note.image || '');
      setIsChecklist(note.isChecklist || false);
      setChecklistItems(note.checklistItems || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setColor('#1e293b');
      setDrawing('');
      setAudio('');
      setImage('');
      setIsChecklist(false);
      setChecklistItems([]);
    }
    setNewItemText('');
    setShowColorPicker(false);
  }, [note, isOpen]);

  // Key press to escape modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isCanvasOpen && !isAudioOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCanvasOpen, isAudioOpen, onClose]);

  // Click outside color picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Image upload
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

  // Tags list
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
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasChecklistItems = isChecklist && checklistItems.length > 0;
    const hasAttachments = drawing || audio || image;

    if (!title.trim() && !content.trim() && !hasChecklistItems && !hasAttachments) return;

    onSave({
      title: title.trim() || 'Untitled Note',
      content: isChecklist ? '' : content.trim(),
      tags,
      color,
      drawing,
      audio,
      image,
      isChecklist,
      checklistItems,
    });
  };

  const modalBgStyle = color === '#1e293b' 
    ? {} 
    : { backgroundColor: `${color}25`, borderColor: `${color}77` };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Panel (Styled as a 9:16 Mobile Screen) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            style={modalBgStyle}
            className="relative w-full max-w-md md:max-w-lg rounded-3xl glass-panel bg-slate-950 border border-slate-800 shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-5 shrink-0">
              <h2 className="font-extrabold text-lg md:text-xl text-slate-100">
                {note ? 'Edit Note' : 'Create New Note'}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            {/* Media Attachment Previews inside editor */}
            {(drawing || image) && (
              <div className="w-full max-h-[165px] overflow-hidden rounded-2xl relative bg-slate-950/50 border border-slate-900 flex items-center justify-center p-2 mb-4 group/modalheader shrink-0">
                <img
                  src={drawing || image}
                  alt="attachment header"
                  className="max-h-[145px] object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDrawing('');
                    setImage('');
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/85 border border-slate-800 text-rose-400 hover:text-rose-300 opacity-0 group-hover/modalheader:opacity-100 transition-opacity cursor-pointer shadow-md"
                  title="Remove Image"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
              {/* Title */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase ml-1">
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="Enter a descriptive title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl glass-input bg-slate-900/30 text-slate-100 placeholder-slate-600 text-sm font-semibold"
                />
              </div>

              {/* Content / Checklist */}
              <div className="flex flex-col gap-1.5 flex-1 min-h-[140px] overflow-y-auto">
                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase ml-1">
                  Content
                </label>
                {isChecklist ? (
                  /* Checklist Manager inside Edit Modal */
                  <div className="flex flex-col gap-2 p-1.5 bg-slate-900/20 border border-slate-900 rounded-2xl p-3">
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
                          className={`flex-1 bg-transparent border-none outline-none text-xs font-semibold ${
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
                    <div className="flex items-center gap-2 border-t border-slate-900/60 pt-2.5 mt-1">
                      <IoAddOutline className="text-slate-500 w-4.5 h-4.5 shrink-0" />
                      <input
                        type="text"
                        placeholder="Add checklist item..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={handleChecklistKeyDown}
                        className="w-full bg-transparent border-none outline-none text-xs text-slate-300 placeholder-slate-600 font-semibold"
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
                  /* Standard text notes */
                  <textarea
                    placeholder="Start writing note details here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[140px] px-4 py-3 rounded-2xl glass-input bg-slate-900/30 text-slate-100 placeholder-slate-600 text-sm leading-relaxed resize-none flex-1"
                  />
                )}
              </div>

              {/* Audio preview inside editor */}
              {audio && (
                <div className="w-full mt-1 rounded-xl bg-slate-950/65 p-2 border border-slate-850/60 flex items-center justify-between group/audio shrink-0">
                  <audio
                    src={audio}
                    controls
                    onLoadedMetadata={(e) => {
                      const audioEl = e.currentTarget;
                      if (audioEl.duration === Infinity || isNaN(audioEl.duration)) {
                        audioEl.currentTime = 1e101;
                        audioEl.ontimeupdate = () => {
                          audioEl.ontimeupdate = null;
                          audioEl.currentTime = 0;
                        };
                      }
                    }}
                    className="w-full h-8 scale-95 accent-violet-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAudio('')}
                    className="p-1.5 rounded-full text-rose-400 hover:text-rose-300 bg-slate-900 border border-slate-800 ml-2 cursor-pointer shadow"
                    title="Remove Audio Memo"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                  </button>
                </div>
              )}



              {/* Bottom Actions toolbar */}
              <div className="flex flex-col gap-4 border-t border-slate-900 pt-5 mt-2 shrink-0">
                {/* Keep Quick Media Actions + Color presets */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Color Palette trigger */}
                    <div className="relative" ref={colorPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Change Theme Color"
                      >
                        <IoColorPaletteOutline className="w-5 h-5" />
                      </button>

                      {/* Popover list */}
                      <AnimatePresence>
                        {showColorPicker && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                            className="absolute bottom-10 left-0 z-20 flex gap-1.5 p-2 rounded-xl glass-panel bg-slate-950 border border-slate-800 shadow-xl"
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

                    {/* Toggle checklist mode button inside modal */}
                    <button
                      type="button"
                      onClick={() => setIsChecklist(!isChecklist)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isChecklist ? 'text-violet-400 bg-violet-950/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                      }`}
                      title="Toggle Checklist Mode"
                    >
                      <IoListOutline className="w-5 h-5" />
                    </button>

                    {/* Canvas Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsCanvasOpen(true)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Sketch on Canvas"
                    >
                      <IoBrushOutline className="w-5 h-5" />
                    </button>

                    {/* Photo upload trigger */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Upload Photo"
                    >
                      <IoImageOutline className="w-5 h-5" />
                    </button>

                    {/* Voice memo trigger */}
                    <button
                      type="button"
                      onClick={() => setIsAudioOpen(true)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Record Voice Memo"
                    >
                      <IoMicOutline className="w-5 h-5" />
                    </button>

                    {/* Share trigger */}
                    <button
                      type="button"
                      onClick={handleShare}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Share Note"
                    >
                      <IoShareSocialOutline className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Confirm Actions */}
                <div className="flex items-center justify-end gap-3 mt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-2xl hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20 transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Sketch Canvas Modal Overlay */}
      <DrawingCanvas
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSave={setDrawing}
        initialDrawing={drawing}
      />

      {/* Audio Voice Memo Modal Overlay */}
      <AudioRecorder
        isOpen={isAudioOpen}
        onClose={() => setIsAudioOpen(false)}
        onSave={setAudio}
      />
    </AnimatePresence>
  );
};

export default NoteModal;
