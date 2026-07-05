import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { IoMailOutline, IoArrowBackOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline } from 'react-icons/io5';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMessage('');
    setError('');
    setDevToken('');

    try {
      const res = await axios.post('/api/auth/forgotpassword', { email });
      if (res.data.success) {
        setMessage(res.data.message);
        if (res.data.devToken) {
          setDevToken(res.data.devToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-grid overflow-hidden">
      {/* Aurora glow */}
      <div className="absolute top-1/3 left-1/2 w-96 h-96 rounded-full aurora-glow-1 -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 180 }}
        className="w-full max-w-md rounded-3xl glass-panel bg-slate-950/80 p-6 sm:p-10 shadow-2xl relative z-10"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-slate-450 hover:text-slate-200 text-xs font-semibold mb-6 transition-colors"
        >
          <IoArrowBackOutline className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="flex flex-col items-center mb-6 text-center">
          <motion.img
            initial={{ rotate: -15, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            src="/logo.png"
            alt="My Notes Logo"
            className="w-14 h-14 rounded-[35%] object-cover shadow-xl mb-4"
          />
          <h1 className="text-xl font-extrabold text-slate-100">Reset Password</h1>
          <p className="text-xs text-slate-500 mt-1">We will send you instructions to reset your password</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3 text-xs leading-relaxed"
          >
            <IoAlertCircleOutline className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex flex-col gap-2 text-xs leading-relaxed"
          >
            <div className="flex items-start gap-3">
              <IoCheckmarkCircleOutline className="w-5 h-5 shrink-0" />
              <span className="font-semibold">{message}</span>
            </div>
            {devToken && (
              <div className="mt-2.5 pt-2.5 border-t border-emerald-800/20">
                <p className="text-slate-350 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                  Development Bypass Mode
                </p>
                <Link
                  to={`/reset-password/${devToken}`}
                  className="text-violet-400 hover:text-violet-300 underline font-bold transition-colors"
                >
                  Click here to proceed directly to Password Reset Page →
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 tracking-wider uppercase ml-1">
                Account Email
              </label>
              <div className="relative">
                <IoMailOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  placeholder="enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input bg-slate-900/30 text-slate-200 placeholder-slate-650 text-sm font-semibold"
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
