
import React from 'react';
import { FilmIcon } from './icons/FilmIcon';

export const Header: React.FC = () => {
  return (
    <header className="w-full max-w-4xl mb-8 text-center">
      <div className="flex items-center justify-center gap-4">
        <FilmIcon className="w-10 h-10 text-cyan-400"/>
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          AI Video Generator
        </h1>
      </div>
      <p className="mt-2 text-gray-400">Bring your ideas to life with generative video.</p>
    </header>
  );
};
