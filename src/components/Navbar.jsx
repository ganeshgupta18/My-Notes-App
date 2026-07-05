import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoNotificationsOutline, 
  IoSearchOutline, 
  IoMenuOutline, 
  IoLogOutOutline, 
  IoPersonOutline, 
  IoCheckmarkDone,
  IoGridOutline,
  IoListOutline
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = ({ searchQuery, onSearchChange, onMenuToggle, onOpenProfile, viewMode, onViewModeToggle }) => {
  const { user, logout, getHeaders } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/notifications', getHeaders());
      if (res.data.success) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s for updates
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read', {}, getHeaders());
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-900 bg-slate-950/70 py-3 px-4 sm:px-6 flex items-center justify-between">
      {/* Mobile Drawer Trigger & Brand Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          aria-label="Toggle Menu"
        >
          <IoMenuOutline className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="My Notes Logo"
            className="w-9 h-9 rounded-[35%] object-cover shadow"
          />
          <span className="hidden sm:inline-block font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-400 tracking-wider font-outfit">
            My Notes
          </span>
        </div>
      </div>

      {/* Dynamic Search Box */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8">
        <div className="relative w-full">
          <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, tags, content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl glass-input bg-slate-900/40 text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Actions: Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Grid/List View Toggle */}
        <motion.button
          onClick={onViewModeToggle}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
          title={viewMode === 'grid' ? 'List View' : 'Grid View'}
        >
          {viewMode === 'grid' ? (
            <IoListOutline className="w-5 h-5" />
          ) : (
            <IoGridOutline className="w-5 h-5" />
          )}
        </motion.button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <motion.button
            onClick={() => {
              setShowNotif(!showNotif);
              if (unreadCount > 0) handleMarkAllRead();
            }}
            className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <IoNotificationsOutline className={`w-5 h-5 ${unreadCount > 0 ? 'animate-shake' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gradient-to-r from-fuchsia-500 to-rose-500 text-[10px] font-extrabold text-white flex items-center justify-center rounded-full border border-slate-950">
                {unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-80 max-h-96 overflow-y-auto rounded-2xl glass-panel bg-slate-950/95 border border-slate-800 shadow-2xl p-4 flex flex-col gap-2 origin-top-right"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1">
                  <span className="font-bold text-sm text-slate-200">Activity History</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <IoCheckmarkDone className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-2.5 rounded-xl text-xs flex flex-col gap-1 border transition-all ${
                          notif.read
                            ? 'bg-slate-900/20 border-slate-900/40 text-slate-400'
                            : 'bg-violet-950/20 border-violet-900/30 text-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium leading-relaxed">{notif.message}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              notif.type === 'success'
                                ? 'bg-emerald-500'
                                : notif.type === 'warning'
                                ? 'bg-amber-500'
                                : notif.type === 'error'
                                ? 'bg-rose-500'
                                : 'bg-blue-400'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 self-end">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <motion.button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-8 h-8 rounded-[35%] object-cover ring-2 ring-violet-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-[35%] bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-violet-500/30">
                {getInitials(user?.name)}
              </div>
            )}
            <span className="hidden md:inline-block text-xs font-semibold text-slate-300 max-w-[100px] truncate">
              {user?.name}
            </span>
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-52 rounded-2xl glass-panel bg-slate-950/95 border border-slate-800 shadow-2xl p-2 flex flex-col origin-top-right"
              >
                <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-bold text-slate-200 truncate">{user?.name}</p>
                </div>

                <button
                  onClick={() => {
                    setShowProfile(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-xs font-medium transition-colors"
                >
                  <IoPersonOutline className="w-4 h-4 text-violet-400" /> My Profile
                </button>

                <button
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/15 text-xs font-medium transition-colors mt-0.5"
                >
                  <IoLogOutOutline className="w-4 h-4 text-rose-400" /> Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
