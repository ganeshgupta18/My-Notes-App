import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoAddOutline, IoTrashOutline, IoDocumentTextOutline, IoPersonOutline, 
  IoCameraOutline, IoAlertCircle, IoCheckmarkCircle, IoInformationCircle,
  IoImageOutline, IoBrushOutline, IoMicOutline, IoListOutline, IoCloseOutline
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/NoteCard';
import NoteModal from '../components/NoteModal';
import LoadingSpinner from '../components/LoadingSpinner';
import KeepNoteCreator from '../components/KeepNoteCreator';
import DrawingCanvas from '../components/DrawingCanvas';
import AudioRecorder from '../components/AudioRecorder';

const Dashboard = () => {
  const { user, getHeaders, updateProfile, deleteAccount } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Notes Modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isChecklist, setIsChecklist] = useState(false); // Mobile quick list toggle
  const [editingNote, setEditingNote] = useState(null);

  // Quick Media Actions State
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Profile Modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync profile details if auth state updates
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  // Load Notes
  const fetchNotes = async () => {
    try {
      const res = await axios.get('/api/notes', getHeaders());
      if (res.data.success) {
        setNotes(res.data.notes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  // Profile Updates Handler
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1.5) {
        setProfileError('Profile avatar must be smaller than 1.5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const updateData = { name: profileName, email: profileEmail, profileImage };
      if (profilePassword.trim()) {
        if (profilePassword.length < 6) {
          setProfileError('Password must be at least 6 characters.');
          setProfileLoading(false);
          return;
        }
        updateData.password = profilePassword;
      }
      await updateProfile(updateData);
      setProfileSuccess('Profile settings updated successfully!');
      setProfilePassword('');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile settings.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch (err) {
      setProfileError(err.message || 'Failed to purge account.');
    }
  };

  // Notes actions
  const handleCreateOrUpdateNote = async (noteData) => {
    try {
      if (editingNote) {
        // Edit existing
        const res = await axios.put(`/api/notes/${editingNote._id}`, noteData, getHeaders());
        if (res.data.success) {
          setNotes(notes.map((n) => (n._id === editingNote._id ? res.data.note : n)));
        }
      } else {
        // Create new
        const res = await axios.post('/api/notes', noteData, getHeaders());
        if (res.data.success) {
          setNotes([res.data.note, ...notes]);
        }
      }
      setIsNoteModalOpen(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handlePinNote = async (noteToPin) => {
    try {
      const updatedPinned = !noteToPin.isPinned;
      const res = await axios.put(
        `/api/notes/${noteToPin._id}`,
        { isPinned: updatedPinned },
        getHeaders()
      );
      if (res.data.success) {
        setNotes(notes.map((n) => (n._id === noteToPin._id ? res.data.note : n)));
      }
    } catch (error) {
      console.error('Error pinning note:', error);
    }
  };

  const handleArchiveNote = async (noteToArchive) => {
    try {
      const updatedArchived = !noteToArchive.isArchived;
      const res = await axios.put(
        `/api/notes/${noteToArchive._id}`,
        { isArchived: updatedArchived, isPinned: false }, // Pin auto-cleared when archived
        getHeaders()
      );
      if (res.data.success) {
        setNotes(notes.map((n) => (n._id === noteToArchive._id ? res.data.note : n)));
      }
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  const handleTrashNote = async (noteToTrash) => {
    try {
      const res = await axios.put(
        `/api/notes/${noteToTrash._id}`,
        { isTrashed: true, isPinned: false, isArchived: false },
        getHeaders()
      );
      if (res.data.success) {
        setNotes(notes.map((n) => (n._id === noteToTrash._id ? res.data.note : n)));
      }
    } catch (error) {
      console.error('Error trashing note:', error);
    }
  };

  const handleRestoreNote = async (noteToRestore) => {
    try {
      const res = await axios.put(
        `/api/notes/${noteToRestore._id}`,
        { isTrashed: false },
        getHeaders()
      );
      if (res.data.success) {
        setNotes(notes.map((n) => (n._id === noteToRestore._id ? res.data.note : n)));
      }
    } catch (error) {
      console.error('Error restoring note:', error);
    }
  };

  const handleDeleteNotePermanently = async (noteId) => {
    try {
      const res = await axios.delete(`/api/notes/${noteId}`, getHeaders());
      if (res.data.success) {
        setNotes(notes.filter((n) => n._id !== noteId));
      }
    } catch (error) {
      console.error('Error deleting note permanently:', error);
    }
  };

  const handleClearTrash = async () => {
    try {
      const res = await axios.delete('/api/notes/trash/clear', getHeaders());
      if (res.data.success) {
        setNotes(notes.filter((n) => !n.isTrashed));
      }
    } catch (error) {
      console.error('Error clearing trash:', error);
    }
  };

  const handleChecklistToggle = async (noteToToggle, itemIdx) => {
    try {
      const updatedItems = noteToToggle.checklistItems.map((item, idx) =>
        idx === itemIdx ? { ...item, completed: !item.completed } : item
      );
      const res = await axios.put(
        `/api/notes/${noteToToggle._id}`,
        { checklistItems: updatedItems },
        getHeaders()
      );
      if (res.data.success) {
        setNotes(notes.map((n) => (n._id === noteToToggle._id ? res.data.note : n)));
      }
    } catch (err) {
      console.error('Error toggling checklist:', err);
    }
  };

  const handleQuickMediaSave = async (mediaData, mediaType) => {
    const body = {
      title: `Quick ${mediaType}`,
      content: '',
      tags: [],
      color: '#1e293b',
    };
    if (mediaType === 'Checklist') {
      body.isChecklist = true;
      body.checklistItems = [];
    } else if (mediaType === 'Drawing') {
      body.drawing = mediaData;
    } else if (mediaType === 'Audio') {
      body.audio = mediaData;
    } else if (mediaType === 'Image') {
      body.image = mediaData;
    }

    try {
      const res = await axios.post('/api/notes', body, getHeaders());
      if (res.data.success) {
        setNotes([res.data.note, ...notes]);
      }
    } catch (err) {
      console.error(`Error saving quick ${mediaType}:`, err);
    }
  };

  const handleQuickImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1.5) {
        alert('Images must be smaller than 1.5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleQuickMediaSave(reader.result, 'Image');
      };
      reader.readAsDataURL(file);
    }
    setIsFabOpen(false);
  };

  // Compute displayed list
  const getFilteredNotes = () => {
    // 1. Filter by category tabs
    let result = notes;
    if (activeTab === 'all') {
      result = notes.filter((n) => !n.isArchived && !n.isTrashed);
    } else if (activeTab === 'pinned') {
      result = notes.filter((n) => n.isPinned && !n.isArchived && !n.isTrashed);
    } else if (activeTab === 'archive') {
      result = notes.filter((n) => n.isArchived && !n.isTrashed);
    } else if (activeTab === 'trash') {
      result = notes.filter((n) => n.isTrashed);
    } else if (activeTab.startsWith('label:')) {
      const labelName = activeTab.split(':')[1];
      result = notes.filter((n) => !n.isArchived && !n.isTrashed && n.tags.includes(labelName));
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  };

  const filteredNotesList = getFilteredNotes();
  const tagsList = [...new Set(notes.filter(n => !n.isTrashed && !n.isArchived).flatMap(n => n.tags || []).filter(t => t && t.trim() !== ''))].sort();
  
  const showPinnedSplit = activeTab === 'all' || activeTab.startsWith('label:');
  const pinnedList = filteredNotesList.filter((n) => n.isPinned && showPinnedSplit);
  const othersList = filteredNotesList.filter((n) => !n.isPinned || !showPinnedSplit);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 bg-grid relative overflow-x-hidden">
      {/* Aurora glow indicators */}
      <div className="absolute top-1/6 left-1/3 w-80 h-80 rounded-full aurora-glow-1 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/5 right-1/4 w-80 h-80 rounded-full aurora-glow-2 blur-3xl pointer-events-none" />

      {/* Responsive Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tagsList={tagsList}
      />

      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        {/* Navbar */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenProfile={() => setIsProfileOpen(true)}
          viewMode={viewMode}
          onViewModeToggle={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
        />

        {/* Dashboard Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto relative">
          
          {/* Inline Note Creator (Google Keep Style) */}
          {activeTab !== 'trash' && activeTab !== 'archive' && (
            <KeepNoteCreator onSave={handleCreateOrUpdateNote} />
          )}

          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-200 capitalize">
                {activeTab === 'all' 
                  ? 'My Note Space' 
                  : activeTab.startsWith('label:') 
                  ? `#${activeTab.split(':')[1]}` 
                  : `${activeTab} notes`}
              </h2>
              <p className="text-xs text-slate-500">
                {filteredNotesList.length} note(s) found in this view
              </p>
            </div>

            {/* Actions for specific tabs */}
            {activeTab === 'trash' && filteredNotesList.length > 0 && (
              <button
                onClick={handleClearTrash}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-950/15 hover:bg-rose-950/30 text-rose-400 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-950/10"
              >
                <IoTrashOutline className="w-4 h-4" /> Clear Trash
              </button>
            )}
          </div>

          {loadingNotes ? (
            <LoadingSpinner />
          ) : filteredNotesList.length === 0 ? (
            /* Beautiful empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl glass-panel bg-slate-900/10 border border-slate-900"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5 text-slate-500">
                <IoDocumentTextOutline className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-200">No notes to display</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                {searchQuery
                  ? "We couldn't find any matches. Refine your query or check your search keywords."
                  : activeTab === 'trash'
                  ? 'Trash is clean! Discarded notes appear here.'
                  : activeTab === 'archive'
                  ? 'Archives are empty. Safekeeping files will show up here.'
                  : 'Start writing down your ideas, outlines, or quick snippets!'}
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Pinned Section */}
              {pinnedList.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-505 tracking-widest uppercase ml-1">
                    Pinned
                  </span>
                  <motion.div 
                    layout 
                    className={viewMode === 'grid' 
                      ? "columns-1 sm:columns-2 lg:columns-3 gap-4 w-full" 
                      : "flex flex-col gap-4 max-w-2xl mx-auto w-full"
                    }
                  >
                    <AnimatePresence mode="popLayout">
                      {pinnedList.map((note) => (
                        <div 
                          key={note._id}
                          className={viewMode === 'grid' ? "break-inside-avoid inline-block w-full mb-4" : "w-full"}
                        >
                          <NoteCard
                            note={note}
                            onEdit={(n) => {
                              setEditingNote(n);
                              setIsNoteModalOpen(true);
                            }}
                            onPin={handlePinNote}
                            onArchive={handleArchiveNote}
                            onTrash={handleTrashNote}
                            onDelete={handleDeleteNotePermanently}
                            onRestore={handleRestoreNote}
                            onChecklistToggle={handleChecklistToggle}
                          />
                        </div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {/* All / Unpinned Section */}
              <div className="flex flex-col gap-3">
                {pinnedList.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-505 tracking-widest uppercase ml-1">
                    Other Notes
                  </span>
                )}
                <motion.div 
                  layout 
                  className={viewMode === 'grid' 
                    ? "columns-1 sm:columns-2 lg:columns-3 gap-4 w-full" 
                    : "flex flex-col gap-4 max-w-2xl mx-auto w-full"
                  }
                >
                  <AnimatePresence mode="popLayout">
                    {othersList.map((note) => (
                      <div 
                        key={note._id}
                        className={viewMode === 'grid' ? "break-inside-avoid inline-block w-full mb-4" : "w-full"}
                      >
                        <NoteCard
                          key={note._id}
                          note={note}
                          onEdit={(n) => {
                            setEditingNote(n);
                            setIsNoteModalOpen(true);
                          }}
                          onPin={handlePinNote}
                          onArchive={handleArchiveNote}
                          onTrash={handleTrashNote}
                          onDelete={handleDeleteNotePermanently}
                          onRestore={handleRestoreNote}
                          onChecklistToggle={handleChecklistToggle}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          )}

          {/* Mobile Expanding FAB Menu (Google Keep Style) */}
          {activeTab !== 'trash' && activeTab !== 'archive' && (
            <div className="fixed bottom-6 right-6 lg:hidden z-30 flex flex-col items-end gap-3 select-none">
              
              {/* Backdrop safety clicks (only for mobile, hides menu on click outside) */}
              {isFabOpen && (
                <div 
                  className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-10"
                  onClick={() => setIsFabOpen(false)}
                />
              )}

              {/* Action Buttons list (expanding upwards) */}
              <AnimatePresence>
                {isFabOpen && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{
                      visible: { transition: { staggerChildren: 0.05 } },
                      hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
                    }}
                    className="flex flex-col items-end gap-3 z-20 pr-1.5"
                  >
                    {/* Image Action */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: 15, scale: 0.8 },
                        visible: { opacity: 1, y: 0, scale: 1 }
                      }}
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-emerald-850 text-white font-extrabold text-xs shadow-xl cursor-pointer hover:bg-emerald-800 transition-colors"
                    >
                      <IoImageOutline className="w-4.5 h-4.5" /> Image
                    </motion.button>

                    {/* Drawing Action */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: 15, scale: 0.8 },
                        visible: { opacity: 1, y: 0, scale: 1 }
                      }}
                      onClick={() => {
                        setIsCanvasOpen(true);
                        setIsFabOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-emerald-850 text-white font-extrabold text-xs shadow-xl cursor-pointer hover:bg-emerald-800 transition-colors"
                    >
                      <IoBrushOutline className="w-4.5 h-4.5" /> Drawing
                    </motion.button>

                    {/* Audio Action */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: 15, scale: 0.8 },
                        visible: { opacity: 1, y: 0, scale: 1 }
                      }}
                      onClick={() => {
                        setIsAudioOpen(true);
                        setIsFabOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-emerald-850 text-white font-extrabold text-xs shadow-xl cursor-pointer hover:bg-emerald-800 transition-colors"
                    >
                      <IoMicOutline className="w-4.5 h-4.5" /> Audio
                    </motion.button>

                    {/* Checklist/List Action */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: 15, scale: 0.8 },
                        visible: { opacity: 1, y: 0, scale: 1 }
                      }}
                      onClick={() => {
                        setEditingNote(null);
                        setIsChecklist(true);
                        setIsNoteModalOpen(true);
                        setIsFabOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-emerald-850 text-white font-extrabold text-xs shadow-xl cursor-pointer hover:bg-emerald-800 transition-colors"
                    >
                      <IoListOutline className="w-4.5 h-4.5" /> List
                    </motion.button>

                    {/* Text Action */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: 15, scale: 0.8 },
                        visible: { opacity: 1, y: 0, scale: 1 }
                      }}
                      onClick={() => {
                        setEditingNote(null);
                        setIsChecklist(false);
                        setIsNoteModalOpen(true);
                        setIsFabOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-emerald-850 text-white font-extrabold text-xs shadow-xl cursor-pointer hover:bg-emerald-800 transition-colors"
                    >
                      <IoDocumentTextOutline className="w-4.5 h-4.5" /> Text
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Circular Trigger Toggle Button (lime green when active) */}
              <motion.button
                onClick={() => setIsFabOpen(!isFabOpen)}
                animate={{ rotate: isFabOpen ? 135 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border border-emerald-500/20 z-20 cursor-pointer ${
                  isFabOpen 
                    ? 'bg-emerald-300 text-emerald-950 hover:bg-emerald-250' 
                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-violet-500/30'
                }`}
              >
                {isFabOpen ? <IoCloseOutline className="w-7 h-7" /> : <IoAddOutline className="w-7 h-7" />}
              </motion.button>
            </div>
          )}
        </main>
      </div>

      {/* Note Editor Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        note={editingNote}
        onClose={() => {
          setIsNoteModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleCreateOrUpdateNote}
      />

        {/* Hidden File Input for mobile uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleQuickImageUpload}
          className="hidden"
        />

        {/* Drawings Canvas Overlay Modal */}
        <DrawingCanvas
          isOpen={isCanvasOpen}
          onClose={() => setIsCanvasOpen(false)}
          onSave={(data) => handleQuickMediaSave(data, 'Drawing')}
        />

        {/* Audio Memo Voice Recorder Overlay Modal */}
        <AudioRecorder
          isOpen={isAudioOpen}
          onClose={() => setIsAudioOpen(false)}
          onSave={(data) => handleQuickMediaSave(data, 'Audio')}
        />

      {/* Animated Profile Settings Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!profileLoading) {
                  setIsProfileOpen(false);
                  setShowDeleteConfirm(false);
                }
              }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Profile Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 25 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md rounded-3xl glass-panel bg-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[85vh] overflow-y-auto z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3.5 mb-5">
                <h3 className="font-extrabold text-base text-slate-100">My Profile Options</h3>
                <button
                  disabled={profileLoading}
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowDeleteConfirm(false);
                  }}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  <IoAddOutline className="w-6 h-6 rotate-45" />
                </button>
              </div>

              {profileError && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-start gap-2.5 text-xs">
                  <IoAlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-semibold leading-relaxed">{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-start gap-2.5 text-xs">
                  <IoCheckmarkCircle className="w-5 h-5 shrink-0" />
                  <span className="font-semibold leading-relaxed">{profileSuccess}</span>
                </div>
              )}

              {showDeleteConfirm ? (
                /* Delete Confirmation layout */
                <div className="flex flex-col gap-4 text-center py-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                    <IoAlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-200">Delete Account Permanently?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    This action is final. Your account profile, along with all of your notes and notification history, will be purged from the database forever.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-4 border-t border-slate-900 pt-4">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Keep Account
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/30 transition-all cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit details layout */
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                  {/* Photo Edit */}
                  <div className="flex flex-col items-center gap-2 mb-3">
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        disabled={profileLoading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      />
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Avatar Preview"
                          className="w-16 h-16 rounded-[35%] object-cover ring-2 ring-violet-500/40"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-[35%] bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-450 group-hover:text-white transition-all">
                          <IoPersonOutline className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">Upload</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-[35%] items-center justify-center hidden group-hover:flex">
                        <IoCameraOutline className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>



                  {/* Password change */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 tracking-wider uppercase ml-1 flex items-center gap-1">
                      New Password <span className="text-[10px] text-slate-500 font-semibold lowercase italic">(optional)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      disabled={profileLoading}
                      className="w-full px-4 py-2.5 rounded-2xl glass-input bg-slate-900/30 text-slate-100 placeholder-slate-600 text-xs font-semibold"
                    />
                  </div>

                  {/* Save */}
                  <motion.button
                    type="submit"
                    disabled={profileLoading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 cursor-pointer mt-1"
                  >
                    {profileLoading ? 'Saving Settings...' : 'Save Profile Details'}
                  </motion.button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={profileLoading}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 mt-3 border border-rose-500/20 hover:border-rose-550 bg-rose-950/10 hover:bg-rose-950/20 text-rose-450 hover:text-rose-400 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                  >
                    Delete Account & Notes
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
