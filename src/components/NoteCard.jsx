import React from 'react';
import { motion } from 'framer-motion';
import { IoPin, IoPinOutline, IoArchiveOutline, IoTrashOutline, IoCreateOutline, IoRefreshOutline, IoTrashBinOutline, IoShareSocialOutline } from 'react-icons/io5';

const NoteCard = ({ note, onEdit, onPin, onArchive, onTrash, onDelete, onRestore, onChecklistToggle }) => {
  const { title, content, tags, color, isPinned, isArchived, isTrashed, drawing, audio, image, isChecklist, checklistItems } = note;

  const handleShare = async (e) => {
    e.stopPropagation();
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

  // Format date
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Preset check: if color doesn't start with '#', default to a glass slate look
  const customBgStyle = color && color.startsWith('#') && color !== '#1e293b'
    ? { backgroundColor: `${color}33`, borderColor: `${color}77` }
    : {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)' }}
      transition={{ type: 'spring', duration: 0.4 }}
      style={customBgStyle}
      className={`relative group rounded-3xl p-5 border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between min-h-[200px] overflow-hidden transition-all ${
        !color || !color.startsWith('#') ? 'hover:border-slate-700/60' : ''
      }`}
    >
      {/* Dynamic Colored Accent Bar */}
      {color && color.startsWith('#') && (
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 opacity-80"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Note Header Image (drawing or attached image) */}
      {(drawing || image) && (
        <div className="w-full max-h-[160px] overflow-hidden rounded-t-2xl mb-4 -mx-5 -mt-5 relative border-b border-slate-950/60 bg-slate-950/40 flex items-center justify-center">
          <img
            src={drawing || image}
            alt="Note attachment"
            className="w-full h-full object-contain max-h-[160px]"
          />
        </div>
      )}

      {/* Main Body content */}
      <div>
        {/* Title & Pin Action */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3 className="font-extrabold text-base text-slate-100 group-hover:text-violet-200 transition-colors line-clamp-1">
            {title}
          </h3>

          {!isTrashed && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onPin(note);
              }}
              whileTap={{ scale: 0.85 }}
              className={`p-1.5 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer ${
                isPinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isPinned ? <IoPin className="w-4 h-4" /> : <IoPinOutline className="w-4 h-4" />}
            </motion.button>
          )}
        </div>

        {/* Content Section (Checklist or Text) */}
        {isChecklist ? (
          <div className="flex flex-col gap-1.5 mb-4 max-h-[180px] overflow-y-auto">
            {checklistItems.slice(0, 5).map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation(); // Avoid triggering full edit modal
                }}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => onChecklistToggle && onChecklistToggle(note, idx)}
                  className="custom-checkbox shrink-0"
                  disabled={isTrashed}
                />
                <span className={`truncate ${item.completed ? 'line-through text-slate-500 font-medium' : 'text-slate-300 font-semibold'}`}>
                  {item.text || ' '}
                </span>
              </div>
            ))}
            {checklistItems.length > 5 && (
              <span className="text-[10px] text-slate-500 font-bold pl-7 mt-0.5">
                + {checklistItems.length - 5} more items
              </span>
            )}
          </div>
        ) : (
          content && (
            <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap line-clamp-4 mb-4">
              {content}
            </p>
          )
        )}

        {/* Audio Memo player */}
        {audio && (
          <div 
            className="w-full mt-2 mb-4 rounded-xl bg-slate-950/60 p-1.5 border border-slate-850/60 flex items-center"
            onClick={(e) => e.stopPropagation()} // Prevent card modal popups during play click
          >
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
          </div>
        )}
      </div>

      {/* Footer (Tags, Date & Actions) */}
      <div className="mt-auto">
        {/* Tags Row */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3.5">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-950/60 text-slate-400 border border-slate-800/50 group-hover:border-violet-500/20 group-hover:text-violet-300 transition-all"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-550 font-medium">
            {formatDate(note.updatedAt)}
          </span>

          {/* Hover Actions toolbar */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:opacity-0 max-md:opacity-100">
            {isTrashed ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(note);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  title="Restore Note"
                >
                  <IoRefreshOutline className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note._id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  title="Delete Permanently"
                >
                  <IoTrashBinOutline className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(note);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  title="Edit Note"
                >
                  <IoCreateOutline className="w-4 h-4" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  title="Share Note"
                >
                  <IoShareSocialOutline className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(note);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  title={isArchived ? 'Unarchive' : 'Archive'}
                >
                  <IoArchiveOutline className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrash(note);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  title="Move to Trash"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;
