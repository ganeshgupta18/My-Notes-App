import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <motion.div
        className="w-12 h-12 border-4 border-t-violet-500 border-r-fuchsia-400 border-b-violet-500 border-l-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.p
        className="mt-4 text-violet-400/80 font-medium tracking-wide text-xs"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        Synchronizing workspace...
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;
