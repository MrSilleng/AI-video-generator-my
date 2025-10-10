
import React from 'react';
import { LOADING_MESSAGES } from '../hooks/useVideoGenerator';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  const totalSteps = LOADING_MESSAGES.length;
  const currentStep = LOADING_MESSAGES.indexOf(message) + 1;
  const progress = Math.max(0, (currentStep / totalSteps) * 100);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 text-gray-300 w-full">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      
      <div className="w-full max-w-xs">
        <div className="bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          ></div>
        </div>
      </div>

      <p className="text-lg font-medium">Generating Video</p>
      <p className="text-sm text-gray-400 max-w-xs h-8">{message}</p>
    </div>
  );
};
