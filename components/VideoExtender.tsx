import React, { useState } from 'react';
import { XCircleIcon } from './icons/XCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface VideoExtenderProps {
  sourceUrl: string;
  onClose: () => void;
  onExtend: (prompt: string) => void;
}

export const VideoExtender: React.FC<VideoExtenderProps> = ({ sourceUrl, onClose, onExtend }) => {
  const [prompt, setPrompt] = useState('');

  const handleExtend = () => {
    if (prompt.trim()) {
      onExtend(prompt);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 w-full max-w-xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-cyan-400" />
              Extend Sequence
            </h2>
            <p className="text-xs text-gray-400 mt-1">Add 7 seconds to your video with a new prompt</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircleIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-700 bg-black">
            <video src={sourceUrl} muted loop autoPlay className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-900/80 px-4 py-2 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider">
                Original Sequence
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-300">What happens next?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="The camera pans left to reveal a hidden waterfall..."
              className="w-full h-24 p-4 bg-gray-900 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 transition-all resize-none text-sm"
            />
          </div>

          <button
            onClick={handleExtend}
            disabled={!prompt.trim()}
            className="w-full py-4 bg-green-600 rounded-2xl font-bold text-white shadow-lg shadow-green-900/20 hover:bg-green-500 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            Apply Extension
          </button>
        </div>
      </div>
    </div>
  );
};
