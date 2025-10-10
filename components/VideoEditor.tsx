import React, { useState, useRef, useEffect } from 'react';

interface VideoEditorProps {
  videoUrl: string;
  prompt: string;
  videoIndex: number;
  onFinish: () => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ videoUrl, prompt, videoIndex, onFinish }) => {
  const [text, setText] = useState('');
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [color, setColor] = useState<'#FFFFFF' | '#000000'>('#FFFFFF');
  const [fontSize, setFontSize] = useState(15); // Font size as a percentage of video height
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewFontSize, setPreviewFontSize] = useState('1rem');

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const updateFontSize = () => {
        if (videoElement) {
          const newSize = videoElement.clientHeight * (fontSize / 100);
          setPreviewFontSize(`${newSize}px`);
        }
      };

      const observer = new ResizeObserver(updateFontSize);
      observer.observe(videoElement);

      const handleMetadata = () => updateFontSize();
      videoElement.addEventListener('loadedmetadata', handleMetadata);
      
      if (videoElement.readyState >= 1) {
          updateFontSize();
      }

      return () => {
        observer.unobserve(videoElement);
        videoElement.removeEventListener('loadedmetadata', handleMetadata);
      };
    }
  }, [fontSize]);


  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  };

  const handleApplyAndDownload = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !text.trim()) {
        alert("Please add some text before applying.");
        return;
    };

    setIsProcessing(true);
    setProgress(0);

    const stream = canvas.captureStream();
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const safePrompt = slugify(prompt);
      const fileName = safePrompt 
        ? `${safePrompt}-${videoIndex + 1}-edited.webm` 
        : `ai-generated-video-${videoIndex + 1}-edited.webm`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsProcessing(false);
      onFinish();
    };
    
    const onLoadedMetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 0;
        video.play();
        recorder.start();
    };

    const drawFrame = () => {
        if (video.paused || video.ended) {
            if (recorder.state === 'recording') {
                recorder.stop();
            }
            return;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const calculatedFontSize = Math.round(video.videoHeight * (fontSize / 100));
            ctx.font = `bold ${calculatedFontSize}px 'Arial', sans-serif`;
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.strokeStyle = color === '#FFFFFF' ? '#000000' : '#FFFFFF';
            ctx.lineWidth = Math.round(calculatedFontSize / 10);
            
            const x = canvas.width / 2;
            const y = position === 'top' 
                ? calculatedFontSize * 1.5 
                : canvas.height - (calculatedFontSize * 0.7);

            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        }
        setProgress((video.currentTime / video.duration) * 100);
        requestAnimationFrame(drawFrame);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    video.addEventListener('play', () => requestAnimationFrame(drawFrame), { once: true });

    if (video.readyState >= 1) {
        onLoadedMetadata();
    }
  };
  
  const livePreviewStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    color: color,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '90%',
    textShadow: color === '#FFFFFF' ? '2px 2px 4px #000' : '2px 2px 4px #FFF',
    pointerEvents: 'none',
    fontSize: previewFontSize,
    lineHeight: 1.2,
    ...(position === 'top' ? { top: '5%' } : { bottom: '10%' })
  };

  return (
    <div className="bg-gray-900/50 rounded-lg border border-cyan-500 flex flex-col p-3 gap-3 w-full animate-fade-in">
        <canvas ref={canvasRef} className="hidden"></canvas>
      
        {isProcessing ? (
             <div className="w-full aspect-video bg-black flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-300">Applying edits...</p>
                <div className="w-full max-w-[80%] bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-cyan-500 h-2 rounded-full transition-width duration-150" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
             </div>
        ) : (
            <div className="relative">
                <video ref={videoRef} controls loop muted className="w-full aspect-video bg-black rounded" crossOrigin="anonymous">
                <source src={videoUrl} type="video/mp4" />
                </video>
                {text && <div style={livePreviewStyle}>{text}</div>}
            </div>
        )}

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter overlay text"
          className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          disabled={isProcessing}
        />
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
                <label htmlFor="position" className="block text-xs text-gray-400 mb-1">Position</label>
                <select id="position" value={position} onChange={(e) => setPosition(e.target.value as 'top' | 'bottom')} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" disabled={isProcessing}>
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                </select>
            </div>
            <div>
                <label htmlFor="color" className="block text-xs text-gray-400 mb-1">Color</label>
                <select id="color" value={color} onChange={(e) => setColor(e.target.value as '#FFFFFF' | '#000000')} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" disabled={isProcessing}>
                    <option value="#FFFFFF">White</option>
                    <option value="#000000">Black</option>
                </select>
            </div>
        </div>
        <div>
            <label htmlFor="fontSize" className="block text-xs text-gray-400 mb-1">Font Size</label>
            <div className="flex items-center gap-2">
                <input 
                    id="fontSize" 
                    type="range" 
                    min="5" 
                    max="30" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    disabled={isProcessing}
                />
                <span className="text-sm text-gray-300 w-8 text-center">{fontSize}%</span>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
            <button onClick={handleApplyAndDownload} className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:text-gray-400" disabled={isProcessing || !text.trim()}>Apply & Download</button>
            <button onClick={onFinish} className="px-3 py-2 rounded-md bg-gray-600 hover:bg-gray-500" disabled={isProcessing}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
