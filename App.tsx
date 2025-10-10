
import React from 'react';
import { VideoGenerator } from './components/VideoGenerator';
import { Header } from './components/Header';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-4xl flex-grow mb-8">
        <VideoGenerator />
      </main>
      <footer className="w-full max-w-4xl text-center">
        <p className="text-xs text-gray-500">
          API connection is securely managed. No API key input is required.
          <span className="mx-2 text-gray-600">|</span>
          <a
            href="https://ai.google/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            Powered by Google Gemini
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;
