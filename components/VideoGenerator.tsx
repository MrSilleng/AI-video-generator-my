import React, { useState, useEffect, useRef } from 'react';
import { useVideoGenerator } from '../hooks/useVideoGenerator';
import { Loader } from './Loader';
import { UploadIcon } from './icons/UploadIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { WarningIcon } from './icons/WarningIcon';
import { RetryIcon } from './icons/RetryIcon';
import { ImageGallery } from './ImageGallery';
import { LinkIcon } from './icons/LinkIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { PencilIcon } from './icons/PencilIcon';
import { VideoEditor } from './VideoEditor';
import { VideoMerger } from './VideoMerger';
import { FilmStripIcon } from './icons/FilmStripIcon';
import { CircleIcon } from './icons/CircleIcon';
import { CheckCircleIconSolid } from './icons/CheckCircleIconSolid';

// FIX: Define props with an interface and use React.FC for better type checking with special React props like 'key'.
interface GeneratedVideoItemProps {
  url: string;
  index: number;
  isSelected: boolean;
  showSelection: boolean;
  onToggleSelection: (url: string) => void;
  onDownload: (url: string, index: number) => void;
  onEdit: () => void;
}

// This component handles rendering and auto-playing a single generated video.
const GeneratedVideoItem: React.FC<GeneratedVideoItemProps> = ({
  url,
  index,
  isSelected,
  showSelection,
  onToggleSelection,
  onDownload,
  onEdit,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Use IntersectionObserver to play/pause video when it enters/leaves the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoElement.play().catch(error => {
            console.error("Video autoplay was prevented:", error);
          });
        } else {
          videoElement.pause();
        }
      },
      {
        threshold: 0.2, // Play when at least 20% of the video is visible for a quicker response.
      }
    );

    observer.observe(videoElement);

    return () => {
      if (videoElement) {
        observer.unobserve(videoElement);
      }
    };
  }, [url]);

  return (
    <div className={`relative bg-gray-900/50 rounded-lg overflow-hidden border ${isSelected ? 'border-cyan-500' : 'border-gray-700'} flex flex-col transition-colors`}>
      {showSelection && (
          <button
              onClick={() => onToggleSelection(url)}
              aria-pressed={isSelected}
              aria-label={`Select video ${index + 1}`}
              className="absolute top-2 right-2 z-20 p-1 bg-black/50 rounded-full text-white hover:bg-black/75 transition-colors"
          >
              {isSelected 
                  ? <CheckCircleIconSolid className="w-6 h-6 text-cyan-400" /> 
                  : <CircleIcon className="w-6 h-6 text-gray-300" />
              }
          </button>
      )}
      <video ref={videoRef} controls loop muted playsInline className="w-full aspect-video bg-black">
        <source src={url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="p-2 grid grid-cols-2 gap-2">
         <button
            onClick={() => onDownload(url, index)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200"
            aria-label={`Download video ${index + 1}`}
         >
            <DownloadIcon className="w-5 h-5" />
            <span>Download</span>
         </button>
         <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-all duration-200"
            aria-label={`Edit video ${index + 1}`}
          >
            <PencilIcon className="w-5 h-5" />
            <span>Edit</span>
          </button>
      </div>
    </div>
  );
};


export const VideoGenerator: React.FC = () => {
  const {
    prompt,
    setPrompt,
    imageFiles,
    addImageFromFile,
    removeImage,
    generateVideo,
    isLoading,
    loadingMessage,
    generatedVideoUrls,
    error,
    numberOfVideos,
    setNumberOfVideos,
    aspectRatio,
    setAspectRatio,
    addImageFromGalleryUrl,
    isImageLoading,
    imageUrl,
    setImageUrl,
    addImageFromLinkUrl,
    IMAGE_LIMIT,
  } = useVideoGenerator();

  const [inputMode, setInputMode] = useState<'upload' | 'gallery' | 'link'>('upload');
  const [editingVideo, setEditingVideo] = useState<{ url: string; index: number } | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [showMerger, setShowMerger] = useState(false);


  useEffect(() => {
    // Clear the URL input when the user switches to a different tab
    if (inputMode !== 'link') {
      setImageUrl('');
    }
  }, [inputMode, setImageUrl]);
  
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove non-word chars
      .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores
      .replace(/^-+|-+$/g, '') // remove leading/trailing dashes
      .slice(0, 50); // truncate
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    // Create a descriptive filename
    const safePrompt = slugify(prompt);
    const fileName = safePrompt ? `${safePrompt}-${index + 1}.mp4` : `ai-generated-video-${index + 1}.mp4`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  
  const handleToggleSelection = (url: string) => {
    setSelectedVideos(prev =>
      prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };
  
  const handleCloseMerger = () => {
    setShowMerger(false);
    setSelectedVideos([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setEditingVideo(null);
      setSelectedVideos([]);
      generateVideo();
    }
  };

  const isQuotaError = error?.startsWith('QUOTA_EXHAUSTED:');
  const displayError = isQuotaError ? error.substring('QUOTA_EXHAUSTED: '.length) : error;
  
  const generateButtonText = () => {
    if (isLoading) return 'Generating...';
    const count = imageFiles.length > 0 ? imageFiles.length : numberOfVideos;
    return `Generate ${count} Video${count > 1 ? 's' : ''}`;
  }

  return (
    <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-700">
      {showMerger && (
        <VideoMerger
          videoUrls={selectedVideos}
          prompt={prompt}
          onClose={handleCloseMerger}
        />
      )}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Prompt and Image Upload */}
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                Your Vision
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={handlePromptChange}
                placeholder="e.g., A neon hologram of a cat driving at top speed"
                className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 resize-none placeholder-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Optional Starting Image Storyboard
              </label>
               <div className="flex border-b border-gray-600">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    inputMode === 'upload'
                      ? 'border-b-2 border-cyan-400 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('gallery')}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    inputMode === 'gallery'
                      ? 'border-b-2 border-cyan-400 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Choose from Gallery
                </button>
                 <button
                  type="button"
                  onClick={() => setInputMode('link')}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    inputMode === 'link'
                      ? 'border-b-2 border-cyan-400 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  From Link
                </button>
              </div>

              {inputMode === 'upload' ? (
                 <div className="mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <div className="flex text-sm text-gray-400">
                        <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-cyan-500"
                        >
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={addImageFromFile} disabled={imageFiles.length >= IMAGE_LIMIT} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">Add up to {IMAGE_LIMIT} images (PNG, JPG)</p>
                    </div>
                </div>
              ) : inputMode === 'gallery' ? (
                <div className="mt-4">
                  <ImageGallery onSelectImage={addImageFromGalleryUrl} disabled={imageFiles.length >= IMAGE_LIMIT} />
                </div>
              ) : (
                 <div className="mt-4 flex flex-col gap-3">
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.png"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200"
                            disabled={imageFiles.length >= IMAGE_LIMIT}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => addImageFromLinkUrl(imageUrl)}
                        disabled={isImageLoading || !imageUrl.trim() || imageFiles.length >= IMAGE_LIMIT}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-600 text-white rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        Load Image
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                        Note: Some image links may not work due to web security (CORS) policies.
                    </p>
                 </div>
              )}
            </div>
          </div>

          {/* Right Side: Image Preview & Video Display */}
          <div className="flex flex-col items-center justify-center bg-gray-900/70 rounded-lg p-4 min-h-[250px] border border-gray-700">
            {isLoading ? (
              <Loader message={loadingMessage} />
            ) : isImageLoading ? (
               <div className="flex flex-col items-center justify-center text-center gap-4 text-gray-300">
                <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm">Loading selected image...</p>
              </div>
            ) : error ? (
              isQuotaError ? (
                <div className="text-center text-yellow-300 bg-yellow-900/50 p-4 rounded-lg border border-yellow-700 max-w-sm mx-auto">
                  <div className="flex flex-col items-center justify-center mb-2 gap-2">
                    <WarningIcon className="w-8 h-8 text-yellow-400" />
                    <h3 className="font-bold text-lg">API Usage Limit Reached</h3>
                  </div>
                  <p className="text-sm text-yellow-200 mb-3">
                    <strong>{displayError}.</strong> This indicates you've exceeded your free tier or spending limit for the Google Gemini API.
                  </p>
                  <p className="text-xs text-gray-300">
                    Please check your API key usage and billing status in your Google AI Studio or Google Cloud project to continue using the service.
                  </p>
                  <a
                    href="https://aistudio.google.com/app/u/0/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors"
                  >
                    <span>Check API Key Usage</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              ) : (
                <div className="text-center text-red-400 flex flex-col items-center gap-4">
                  <p><strong>Error:</strong> {displayError}</p>
                  <button
                    type="button"
                    onClick={generateVideo}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-red-500 text-red-400 rounded-md hover:bg-red-900/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors duration-200"
                  >
                    <RetryIcon className="w-5 h-5" />
                    Retry
                  </button>
                </div>
              )
            ) : generatedVideoUrls.length > 0 ? (
               <div className="w-full">
                <p className="text-center mb-4 font-semibold">Your masterpiece is ready!</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedVideoUrls.map((url, index) => {
                    const isSelected = selectedVideos.includes(url);
                    return editingVideo?.url === url ? (
                      <VideoEditor
                        key={url}
                        videoUrl={url}
                        prompt={prompt}
                        videoIndex={index}
                        onFinish={() => setEditingVideo(null)}
                      />
                    ) : (
                       <GeneratedVideoItem
                        key={url}
                        url={url}
                        index={index}
                        isSelected={isSelected}
                        showSelection={generatedVideoUrls.length > 1}
                        onToggleSelection={handleToggleSelection}
                        onDownload={handleDownload}
                        onEdit={() => setEditingVideo({ url, index })}
                      />
                    )
                  })}
                </div>
                {generatedVideoUrls.length > 1 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowMerger(true)}
                            disabled={selectedVideos.length < 2}
                            className="inline-flex items-center justify-center gap-3 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <FilmStripIcon className="w-5 h-5" />
                            <span>
                                Merge {selectedVideos.length > 1 ? `${selectedVideos.length} Videos` : 'Selected Videos'}
                            </span>
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            Select at least 2 videos to merge them into a single file.
                        </p>
                    </div>
                )}
              </div>
            ) : imageFiles.length > 0 ? (
                <div className="w-full">
                    <p className="text-sm text-center text-gray-400 mb-2">Image Storyboard ({imageFiles.length}/{IMAGE_LIMIT})</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {imageFiles.map((imageFile) => (
                        <div key={imageFile.id} className="relative aspect-square group">
                            <img src={imageFile.objectUrl} alt="Preview" className="rounded-lg w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(imageFile.id)}
                                className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-0.5 text-gray-400 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                aria-label="Remove image"
                            >
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    </div>
                </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>Your generated video will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Options and Submit Button */}
        <div className="mt-8">
            <div className="flex flex-col sm:flex-row justify-end items-center gap-6 mb-4">
                {imageFiles.length > 0 ? (
                    <p className="text-sm text-gray-400 mr-auto">
                        Will generate {imageFiles.length} video{imageFiles.length > 1 ? 's' : ''}, one for each image.
                    </p>
                ) : (
                    <div className="flex items-center">
                        <label htmlFor="numberOfVideos" className="block text-sm font-medium text-gray-300 mr-3">
                            Number of Videos
                        </label>
                        <select
                            id="numberOfVideos"
                            name="numberOfVideos"
                            value={numberOfVideos}
                            onChange={(e) => setNumberOfVideos(parseInt(e.target.value, 10))}
                            className="bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-cyan-500 focus:border-cyan-500"
                            >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>
                )}
                <div className="flex items-center">
                    <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mr-3">
                        Aspect Ratio
                    </label>
                    <select
                        id="aspectRatio"
                        name="aspectRatio"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-cyan-500 focus:border-cyan-500"
                        >
                        <option value="16:9">16:9 (Widescreen)</option>
                        <option value="9:16">9:16 (Vertical)</option>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:3">4:3 (Classic)</option>
                        <option value="3:4">3:4 (Portrait)</option>
                    </select>
                </div>
            </div>
          <button
            type="submit"
            disabled={isLoading || isImageLoading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            <SparklesIcon className="w-5 h-5"/>
            {generateButtonText()}
          </button>
        </div>
      </form>
    </div>
  );
};