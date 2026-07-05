import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoJournalOutline, IoPinOutline, IoArchiveOutline, IoTrashOutline, IoCloseOutline, IoPricetagOutline } from 'react-icons/io5';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, tagsList = [] }) => {
  const menuItems = [
    { id: 'all', label: 'All Notes', icon: IoJournalOutline, color: 'text-violet-400' },
    { id: 'pinned', label: 'Pinned Notes', icon: IoPinOutline, color: 'text-amber-400' },
    { id: 'archive', label: 'Archive', icon: IoArchiveOutline, color: 'text-sky-400' },
    { id: 'trash', label: 'Trash', icon: IoTrashOutline, color: 'text-rose-400' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950/80 border-r border-slate-900 w-64 lg:w-72 shrink-0 p-4">
      {/* Brand Header */}
      <div className="flex items-center justify-between lg:justify-center border-b border-slate-900 pb-5 mb-5 mt-2 px-2">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="My Notes Logo"
            className="w-10 h-10 rounded-[35%] object-cover shadow shadow-slate-950/20"
          />
          <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-400 tracking-wider font-outfit">
            My Notes
          </span>
        </div>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          aria-label="Close Menu"
        >
          <IoCloseOutline className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Core Tabs */}
      <nav className="flex flex-col gap-1.5 mb-4">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-sidebar-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/10 border border-violet-500/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 z-10 ${isActive ? item.color : 'text-slate-400 group-hover:text-slate-300'}`} />
              <span className="z-10 tracking-wide">{item.label}</span>
              {isActive && (
                <span className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-md shadow-violet-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Dynamic Labels (Tags) Section */}
      {tagsList.length > 0 && (
        <div className="flex-1 overflow-y-auto border-t border-slate-900 pt-4 flex flex-col gap-1 select-none pr-1">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase ml-4 mb-2 block">
            Labels
          </span>
          <div className="flex flex-col gap-1">
            {tagsList.map((tag) => {
              const tagId = `label:${tag}`;
              const isActive = activeTab === tagId;

              return (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTab(tagId);
                    onClose();
                  }}
                  className={`relative flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300 group cursor-pointer ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar-pill"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/10 border border-violet-500/30"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <IoPricetagOutline className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 z-10 ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                  <span className="z-10 truncate">#{tag}</span>
                  {isActive && (
                    <span className="absolute right-3.5 w-1 h-1 rounded-full bg-violet-400 shadow-md shadow-violet-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-auto border-t border-slate-900 pt-4 px-2 text-center shrink-0">
        <p className="text-[9px] text-slate-650 tracking-wider font-semibold uppercase">
          © {new Date().getFullYear()} My Notes. All rights reserved.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="lg:hidden fixed top-0 bottom-0 left-0 z-50 w-64 shadow-2xl flex"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
