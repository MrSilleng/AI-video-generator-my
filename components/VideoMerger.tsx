import React, { useState, useRef, useEffect } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface VideoMergerProps {
  videoUrls: string[];
  prompt: string;
  onClose: () => void;
}

export const VideoMerger: React.FC<VideoMergerProps> = ({ videoUrls, prompt, onClose }) => {
  const [status, setStatus] = useState<'processing' | 'done'>('processing');
  const [progress, setProgress] = useState(0);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoQueueRef = useRef<string[]>([...videoUrls]);
  const totalVideos = videoUrls.length;

  const slugify = (text: string) => {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  };

  const handleDownload = () => {
    if (!mergedVideoUrl) return;
    const link = document.createElement('a');
    link.href = mergedVideoUrl;
    const safePrompt = slugify(prompt);
    const fileName = safePrompt ? `${safePrompt}-merged.webm` : `ai-generated-video-merged.webm`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const videoPlayer = videoPlayerRef.current;
    const canvas = canvasRef.current;
    if (!videoPlayer || !canvas || videoUrls.length === 0) return;

    let animationFrameId: number;

    const processNextVideo = () => {
      if (videoQueueRef.current.length === 0) {
        mediaRecorderRef.current?.stop();
        return;
      }
      const nextUrl = videoQueueRef.current.shift();
      if (nextUrl) {
        videoPlayer.src = nextUrl;
        videoPlayer.load();
        videoPlayer.play().catch(e => console.error("Video play failed:", e));
      }
    };

    const drawFrame = () => {
      if (videoPlayer.paused || videoPlayer.ended) return;
      canvas.getContext('2d')?.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
      
      const videosProcessed = totalVideos - videoQueueRef.current.length - 1;
      const currentVideoProgress = (videoPlayer.currentTime / videoPlayer.duration) * (100 / totalVideos);
      const totalProgress = (videosProcessed / totalVideos) * 100 + currentVideoProgress;
      setProgress(totalProgress);

      animationFrameId = requestAnimationFrame(drawFrame);
    };

    videoPlayer.onloadedmetadata = () => {
      if (!mediaRecorderRef.current) {
        canvas.width = videoPlayer.videoWidth;
        canvas.height = videoPlayer.videoHeight;
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorderRef.current = recorder;

        const chunks: Blob[] = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setMergedVideoUrl(url);
          setStatus('done');
          setProgress(100);
        };
        recorder.start();
      }
    };

    videoPlayer.onplay = () => {
      animationFrameId = requestAnimationFrame(drawFrame);
    };

    videoPlayer.onended = () => {
      cancelAnimationFrame(animationFrameId);
      processNextVideo();
    };

    processNextVideo();

    return () => {
      cancelAnimationFrame(animationFrameId);
      videoPlayer.onloadedmetadata = null;
      videoPlayer.onplay = null;
      videoPlayer.onended = null;
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (mergedVideoUrl) {
        URL.revokeObjectURL(mergedVideoUrl);
      }
    };
  }, [videoUrls, totalVideos, mergedVideoUrl]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-700 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Video Merger</h2>
          <button onClick={onClose} aria-label="Close merger" className="text-gray-400 hover:text-white">
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden"></canvas>
        <video ref={videoPlayerRef} className="hidden" muted playsInline crossOrigin="anonymous"></video>

        {status === 'processing' && (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg text-gray-300">Merging {totalVideos} videos...</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
              <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">{Math.round(progress)}% complete</p>
          </div>
        )}

        {status === 'done' && mergedVideoUrl && (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Merge Complete!</h3>
            <video src={mergedVideoUrl} controls autoPlay loop className="w-full rounded-lg mb-4" />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200"
              >
                <DownloadIcon className="w-5 h-5" />
                Download Merged Video
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
