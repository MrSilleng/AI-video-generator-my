import React, { useState, useEffect } from 'react';
import { VideoGenerator } from './components/VideoGenerator';
import { Header } from './components/Header';
import { KeyIcon } from './components/icons/KeyIcon';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected);
      setChecking(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasKey(true); // Proceed assuming success per race condition mitigation rules
  };

  if (checking) return null;

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto text-cyan-400">
            <KeyIcon className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold">API Access Required</h1>
          <p className="text-gray-400">
            To use the latest Veo 3.1 video generation models, you must select an API key from a paid GCP project.
          </p>
          <div className="bg-gray-900/50 p-4 rounded-xl text-xs text-left text-gray-400 border border-gray-700">
            <p className="font-semibold text-gray-300 mb-1">Requirements:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>A Google Cloud Project with Billing enabled</li>
              <li>Generative AI API enabled</li>
              <li>See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-cyan-400">billing documentation</a></li>
            </ul>
          </div>
          <button
            onClick={handleSelectKey}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-4xl flex-grow mb-8">
        <VideoGenerator />
      </main>
      <footer className="w-full max-w-4xl text-center">
        <p className="text-xs text-gray-500">
          Veo 3.1 Powered Sequence Generator
          <span className="mx-2 text-gray-600">|</span>
          <a href="https://ai.google/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
            Terms of Service Apply
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;
