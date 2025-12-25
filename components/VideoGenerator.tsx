import React, { useState, useEffect, useRef } from 'react';
import { useVideoGenerator } from '../hooks/useVideoGenerator';
import { Loader } from './Loader';
import { UploadIcon } from './icons/UploadIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { WarningIcon } from './icons/WarningIcon';
import { RetryIcon } from './icons/RetryIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { PencilIcon } from './icons/PencilIcon';
import { VideoEditor } from './VideoEditor';
import { VideoExtender } from './VideoExtender';
import { VideoMerger } from './VideoMerger';
import { CheckCircleIconSolid } from './icons/CheckCircleIconSolid';
import { CircleIcon } from './icons/CircleIcon';
import { PlusIcon } from './icons/PlusIcon';
import { FilmStripIcon } from './icons/FilmStripIcon';

interface GeneratedVideoItemProps {
  url: string;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDownload: (url: string, index: number) => void;
  onEdit: () => void;
  onExtend: () => void;
}

const GeneratedVideoItem: React.FC<GeneratedVideoItemProps> = ({
  url, index, isSelected, onToggleSelect, onDownload, onEdit, onExtend
}) => {
  return (
    <div className={`relative bg-gray-900/50 rounded-xl overflow-hidden border-2 transition-all flex flex-col group ${isSelected ? 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-gray-700 hover:border-gray-500'}`}>
      <div className="absolute top-2 left-2 z-10">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(); }}
          className="bg-gray-900/80 rounded-full p-0.5 hover:scale-110 transition-transform"
        >
          {isSelected ? (
            <CheckCircleIconSolid className="w-6 h-6 text-cyan-400" />
          ) : (
            <CircleIcon className="w-6 h-6 text-gray-400 opacity-60 group-hover:opacity-100" />
          )}
        </button>
      </div>
      
      <video controls loop muted playsInline className="w-full aspect-video bg-black">
        <source src={url} type="video/mp4" />
      </video>
      
      <div className="p-3 grid grid-cols-3 gap-2 bg-gray-800/80">
         <button onClick={() => onDownload(url, index)} className="flex flex-col items-center gap-1 p-2 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-gray-700 hover:bg-cyan-600 transition-colors">
            <DownloadIcon className="w-4 h-4" />
            <span>Save</span>
         </button>
         <button onClick={onEdit} className="flex flex-col items-center gap-1 p-2 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-gray-700 hover:bg-purple-600 transition-colors">
            <PencilIcon className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button onClick={onExtend} className="flex flex-col items-center gap-1 p-2 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-gray-700 hover:bg-green-600 transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span>Extend</span>
          </button>
      </div>
    </div>
  );
};

export const VideoGenerator: React.FC = () => {
  const {
    prompt, setPrompt, imageFiles, addImageFromFile, removeImage,
    generateVideo, isLoading, loadingMessage, generatedVideoUrls,
    error, setError, numberOfVideos, setNumberOfVideos, aspectRatio, setAspectRatio,
    resolution, setResolution, modelType, setModelType, IMAGE_LIMIT
  } = useVideoGenerator();

  const [extendingVideo, setExtendingVideo] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [isMergerOpen, setIsMergerOpen] = useState(false);

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `veo-video-${index + 1}.mp4`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleVideoSelection = (url: string) => {
    setSelectedVideos(prev => 
      prev.includes(url) ? prev.filter(v => v !== url) : [...prev, url]
    );
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) generateVideo();
  };

  return (
    <div className="bg-gray-800/40 rounded-3xl shadow-2xl p-6 md:p-10 backdrop-blur-md border border-white/5">
      {extendingVideo && (
        <VideoExtender 
          sourceUrl={extendingVideo} 
          onClose={() => setExtendingVideo(null)} 
          onExtend={(p) => generateVideo(p, extendingVideo)}
        />
      )}

      {isMergerOpen && (
        <VideoMerger 
          videoUrls={selectedVideos} 
          prompt={prompt} 
          onClose={() => setIsMergerOpen(false)} 
        />
      )}

      <form onSubmit={handleGenerate} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-300">Generation Model</label>
                {selectedVideos.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => setIsMergerOpen(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all"
                  >
                    <FilmStripIcon className="w-3.5 h-3.5" />
                    Merge {selectedVideos.length} Clips
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModelType('veo-3.1-fast-generate-preview')}
                  className={`p-3 rounded-xl border text-sm transition-all ${modelType === 'veo-3.1-fast-generate-preview' ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-gray-900/50 border-gray-700 text-gray-400'}`}
                >
                  <span className="block font-bold">Fast Engine</span>
                  <span className="text-[10px] opacity-60">High speed, standard quality</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModelType('veo-3.1-generate-preview')}
                  className={`p-3 rounded-xl border text-sm transition-all ${modelType === 'veo-3.1-generate-preview' ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_15px_rgba(192,132,252,0.2)]' : 'bg-gray-900/50 border-gray-700 text-gray-400'}`}
                >
                  <span className="block font-bold">Pro Engine</span>
                  <span className="text-[10px] opacity-60">Deep cinematic quality</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="prompt" className="block text-sm font-semibold text-gray-300 mb-2">Prompt</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Cinematic drone shot of a hidden temple in the Andes..."
                className="w-full h-32 p-4 bg-gray-900/80 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-cyan-500 transition-all resize-none text-sm"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-300">Reference Images ({imageFiles.length}/{IMAGE_LIMIT})</label>
              <div className="flex flex-wrap gap-2">
                {imageFiles.map(img => (
                  <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                    <img src={img.objectUrl} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(img.id)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <XCircleIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < IMAGE_LIMIT && (
                  <label className="w-16 h-16 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors">
                    <UploadIcon className="w-6 h-6 text-gray-500" />
                    <input type="file" className="sr-only" onChange={addImageFromFile} accept="image/*" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Preview / Results */}
          <div className="lg:col-span-7 bg-gray-900/40 rounded-3xl border border-white/5 p-4 flex flex-col items-center justify-center min-h-[400px]">
            {isLoading ? (
              <Loader message={loadingMessage} />
            ) : error ? (
              <div className="text-center p-6 space-y-4">
                <WarningIcon className="w-12 h-12 text-red-400 mx-auto" />
                <p className="text-red-400 font-medium">{error}</p>
                <button type="button" onClick={() => generateVideo()} className="flex items-center gap-2 px-6 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors mx-auto">
                  <RetryIcon className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : generatedVideoUrls.length > 0 ? (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generatedVideoUrls.map((url, i) => (
                  editingVideo === url ? (
                    <VideoEditor key={url} videoUrl={url} prompt={prompt} videoIndex={i} onFinish={() => setEditingVideo(null)} />
                  ) : (
                    <GeneratedVideoItem 
                      key={url} 
                      url={url} 
                      index={i} 
                      isSelected={selectedVideos.includes(url)}
                      onToggleSelect={() => toggleVideoSelection(url)}
                      onDownload={handleDownload} 
                      onEdit={() => setEditingVideo(url)}
                      onExtend={() => setExtendingVideo(url)}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center space-y-2">
                <SparklesIcon className="w-10 h-10 mx-auto opacity-20" />
                <p>Your cinematic creations will appear here</p>
                <p className="text-xs opacity-50">Tip: Select multiple clips to merge them into a single movie</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-6 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ratio</label>
              <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-bold text-cyan-400 cursor-pointer">
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quality</label>
              <select value={resolution} onChange={e => setResolution(e.target.value as any)} className="bg-transparent border-none focus:ring-0 text-sm font-bold text-cyan-400 cursor-pointer">
                <option value="720p">HD (720p)</option>
                <option value="1080p">Full HD (1080p)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedVideos.length > 1 && (
              <button
                type="button"
                onClick={() => setIsMergerOpen(true)}
                className="flex-1 sm:flex-none px-6 py-4 bg-gray-700 border border-gray-600 rounded-2xl font-bold text-white hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
              >
                <FilmStripIcon className="w-5 h-5" />
                Merge ({selectedVideos.length})
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex-1 sm:flex-none px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-black text-white shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isLoading ? 'Processing...' : 'Generate Magic'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
