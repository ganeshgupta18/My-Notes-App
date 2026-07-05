import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoMicOutline, IoMicOffOutline, IoPlayOutline, IoPauseOutline, IoSaveOutline, IoTrashOutline } from 'react-icons/io5';

const AudioRecorder = ({ isOpen, onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPreviewRef = useRef(null);

  // Clean timers and recorders on close
  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Format Time (00:00)
  const formatTime = (timeInSecs) => {
    const mins = Math.floor(timeInSecs / 60);
    const secs = timeInSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Voice Recording
  const startRecording = async () => {
    setAudioBlob(null);
    setAudioUrl('');
    setIsPlayingPreview(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      
      // Fallback for Safari/iOS which might not support webm
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const compiledBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(compiledBlob);
        setAudioUrl(URL.createObjectURL(compiledBlob));
        
        // Stop all audio track streams to release microphone hardware access
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer interval
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Audio hardware permission error:', err);
      alert('Microphone hardware access was denied or is unavailable.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  // Play Preview Clip
  const togglePlayPreview = () => {
    if (!audioPreviewRef.current) return;
    const player = audioPreviewRef.current;
    
    if (isPlayingPreview) {
      player.pause();
      setIsPlayingPreview(false);
    } else {
      player.play();
      setIsPlayingPreview(true);
      player.onended = () => {
        setIsPlayingPreview(false);
      };
    }
  };

  // Convert Blob to Base64 and trigger Save
  const handleSave = async () => {
    if (!audioBlob) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result;
      onSave(base64Audio);
      onClose();
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleDiscard = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setIsPlayingPreview(false);
    setRecordingTime(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => !isRecording && onClose()}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-sm rounded-3xl glass-panel bg-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-6 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 w-full shrink-0">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <IoMicOutline className="text-violet-400 w-4.5 h-4.5 animate-pulse" /> Voice Memo Recorder
              </h3>
              <button
                disabled={isRecording}
                onClick={onClose}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>

            {/* Recorder Status / Visualizer */}
            <div className="flex flex-col items-center justify-center gap-3 w-full py-6 bg-slate-900/30 rounded-2xl border border-slate-900">
              {isRecording ? (
                /* Animated visualizer dots */
                <div className="flex items-center gap-1.5 h-8">
                  {[0.4, 0.9, 0.3, 0.8, 0.5, 0.7, 0.3].map((delay, idx) => (
                    <motion.span
                      key={idx}
                      animate={{ height: ['8px', '32px', '8px'] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: delay * 0.5, ease: 'easeInOut' }}
                      className="w-1 rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400"
                    />
                  ))}
                </div>
              ) : audioUrl ? (
                /* Playback helper link */
                <button
                  onClick={togglePlayPreview}
                  className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                >
                  {isPlayingPreview ? <IoPauseOutline className="w-6 h-6" /> : <IoPlayOutline className="w-6 h-6 ml-0.5" />}
                </button>
              ) : (
                /* Inactive mic state */
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-500">
                  <IoMicOffOutline className="w-5 h-5" />
                </div>
              )}

              {/* Timer */}
              <span className="text-xl font-bold tracking-wide text-slate-200">
                {formatTime(recordingTime)}
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                {isRecording ? 'Recording Live' : audioUrl ? 'Voice Preview Ready' : 'Ready to record'}
              </span>

              {/* Secret Audio Preview Anchor */}
              {audioUrl && (
                <audio
                  ref={audioPreviewRef}
                  src={audioUrl}
                  className="hidden"
                />
              )}
            </div>

            {/* Core Recording Actions */}
            <div className="flex items-center justify-center gap-5 w-full">
              {isRecording ? (
                /* Stop Trigger */
                <motion.button
                  onClick={stopRecording}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-2.5 rounded-xl border border-rose-500/20 bg-rose-950/10 text-rose-400 text-xs font-bold transition-all cursor-pointer hover:bg-rose-950/20"
                >
                  Stop Recording
                </motion.button>
              ) : audioUrl ? (
                /* Save or Delete Preview options */
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleDiscard}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <IoTrashOutline className="w-4 h-4" /> Discard
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-violet-500/20 transition-all cursor-pointer"
                  >
                    <IoSaveOutline className="w-4 h-4" /> Save Memo
                  </button>
                </div>
              ) : (
                /* Start Trigger */
                <motion.button
                  onClick={startRecording}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 transition-all cursor-pointer"
                >
                  <IoMicOutline className="w-4.5 h-4.5" /> Start Recording
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AudioRecorder;
