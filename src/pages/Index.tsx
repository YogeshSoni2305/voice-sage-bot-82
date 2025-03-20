
import React from 'react';
import VoiceAssistant from '@/components/VoiceAssistant';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <main className="flex-1 flex items-center justify-center p-4">
        <VoiceAssistant />
      </main>
      
      <footer className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>Voice Assistant powered by AI</p>
      </footer>
    </div>
  );
};

export default Index;
