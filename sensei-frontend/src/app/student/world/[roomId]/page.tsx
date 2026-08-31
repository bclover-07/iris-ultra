'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction } from 'lucide-react';

export default function WorldRoomPage() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="comic-card bg-white dark:bg-slate-800 p-12 max-w-lg w-full flex flex-col items-center gap-6 rounded-[40px] rotate-[-1deg]"
      >
        <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center border-4 border-brutal-border dark:border-slate-600 mb-2">
          <Construction size={48} className="text-yellow-500" />
        </div>
        
        <h1 className="font-fredoka text-3xl md:text-4xl font-bold uppercase text-[var(--comic-black)]">
          Coming Soon!
        </h1>
        
        <p className="font-fredoka text-lg text-gray-500 dark:text-slate-400 font-medium">
          The 3D Virtual World is currently under construction. Get ready to explore, study, and hang out with friends in the metaverse very soon! 🚀
        </p>

        <button 
          onClick={() => router.push('/student/world')}
          className="comic-btn mt-4 px-8 py-4 bg-blue-400 hover:bg-blue-500 text-white font-fredoka font-bold text-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <ArrowLeft size={20} /> Back to Lobby
        </button>
      </motion.div>
    </div>
  );
}
