
import React, { useState, useRef, useEffect } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { FilmStripIcon } from './icons/FilmStripIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface VideoMergerProps {
  videoUrls: string[];
  prompt: string;
  onClose: () => void;
}

export const VideoMerger: React.FC<VideoMergerProps> = ({ videoUrls: initialUrls, prompt, onClose }) => {
  const [stage, setStage] = useState<'review' | 'processing' | 'done'>('review');
  const [videoUrls, setVideoUrls] = useState<string[]>(initialUrls);
  const [progress, setProgress] = useState(0);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const queueRef = useRef<string[]>([]);

  const slugify = (text: string) => {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  };

  const moveClip = (index: number, direction: 'left' | 'right') => {
    const newUrls = [...videoUrls];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newUrls.length) return;
    
    [newUrls[index], newUrls[targetIndex]] = [newUrls[targetIndex], newUrls[index]];
    setVideoUrls(newUrls);
  };

  const startProcessing = () => {
    setStage('processing');
    queueRef.current = [...videoUrls];
    setCurrentClipIndex(0);
  };

  const handleDownload = () => {
    if (!mergedVideoUrl) return;
    const link = document.createElement('a');
    link.href = mergedVideoUrl;
    const safePrompt = slugify(prompt);
    const fileName = safePrompt ? `${safePrompt}-cinematic-cut.webm` : `merged-sequence.webm`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (stage !== 'processing') return;

    const videoPlayer = videoPlayerRef.current;
    const canvas = canvasRef.current;
    if (!videoPlayer || !canvas || videoUrls.length === 0) return;

    let animationFrameId: number;
    const totalVideos = videoUrls.length;

    const processNextVideo = () => {
      if (queueRef.current.length === 0) {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        return;
      }
      const nextUrl = queueRef.current.shift();
      if (nextUrl) {
        setCurrentClipIndex(totalVideos - queueRef.current.length - 1);
        videoPlayer.src = nextUrl;
        videoPlayer.load();
        videoPlayer.play().catch(e => console.error("Video play failed:", e));
      }
    };

    const drawFrame = () => {
      if (videoPlayer.paused || videoPlayer.ended) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
      }
      
      const videosProcessed = totalVideos - queueRef.current.length - 1;
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
        const recorder = new MediaRecorder(stream, { 
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 5000000 
        });
        mediaRecorderRef.current = recorder;

        const chunks: Blob[] = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setMergedVideoUrl(url);
          setStage('done');
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
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stage, videoUrls]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300" aria-modal="true" role="dialog">
      <div className="bg-gray-900/80 rounded-3xl shadow-2xl w-full max-w-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <FilmStripIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Sequence Studio</h2>
              <p className="text-xs text-gray-400">Combine your creations into a cinematic cut</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <XCircleIcon className="w-8 h-8 text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="p-8">
          <canvas ref={canvasRef} className="hidden"></canvas>
          <video ref={videoPlayerRef} className="hidden" muted playsInline crossOrigin="anonymous"></video>

          {stage === 'review' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto p-2 custom-scrollbar">
                {videoUrls.map((url, idx) => (
                  <div key={url} className="group relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg">
                    <video src={url} className="w-full h-full object-cover opacity-80" muted onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-2 py-1 rounded text-white border border-white/10">CLIP #{idx + 1}</span>
                        <div className="flex gap-1">
                          <button onClick={() => moveClip(idx, 'left')} disabled={idx === 0} className="p-1.5 bg-gray-800/80 hover:bg-cyan-500 rounded disabled:opacity-30 transition-colors">
                            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                          <button onClick={() => moveClip(idx, 'right')} disabled={idx === videoUrls.length - 1} className="p-1.5 bg-gray-800/80 hover:bg-cyan-500 rounded disabled:opacity-30 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-gray-400 text-center max-w-md">
                  Review your sequence. Drag or use the arrows to reorder. 
                  The merger will maintain the original resolution of the first clip.
                </p>
                <button
                  onClick={startProcessing}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-black text-white shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  START MERGE SEQUENCE
                </button>
              </div>
            </div>
          )}

          {stage === 'processing' && (
            <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">{Math.round(progress)}%</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Stitching Frame Pipeline</h3>
                <p className="text-gray-400">Processing Clip {currentClipIndex + 1} of {videoUrls.length}...</p>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {stage === 'done' && mergedVideoUrl && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
                <video src={mergedVideoUrl} controls autoPlay loop className="w-full h-full object-contain bg-black" />
                <div className="absolute top-4 right-4">
                   <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 backdrop-blur-md border border-green-500/50 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Master Rendered</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-bold text-white transition-all shadow-lg shadow-cyan-900/20 hover:scale-[1.02]"
                >
                  <DownloadIcon className="w-6 h-6" />
                  DOWNLOAD MASTER
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl font-bold text-white transition-all"
                >
                  RETURN TO STUDIO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
