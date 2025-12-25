import React, { useState, useCallback, useEffect } from 'react';
import type { ImageFile } from '../types';
import { toBase64 } from '../utils/fileUtils';
import { generateVideo as generateVideoFromApi } from '../services/geminiService';

export const LOADING_MESSAGES = [
  "Consulting the Veo 3.1 neural engine...",
  "Synthesizing high-fidelity motion...",
  "Extending the timeline of your vision...",
  "Polishing pixels for 1080p brilliance...",
  "Almost ready for the big screen..."
];

export const useVideoGenerator = () => {
  const IMAGE_LIMIT = 3; // Veo 3.1 Pro limit for references
  const [prompt, setPromptInternal] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [generatedVideoUrls, setGeneratedVideoUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [numberOfVideos, setNumberOfVideos] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [modelType, setModelType] = useState<'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-fast-generate-preview');
  const [imageUrl, setImageUrl] = useState<string>('');

  const setPrompt = useCallback((value: string) => {
    if (error) setError(null);
    setPromptInternal(value);
  }, [error]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessage(prev => {
          const idx = (LOADING_MESSAGES.indexOf(prev) + 1) % LOADING_MESSAGES.length;
          return LOADING_MESSAGES[idx];
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const addImageFromFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && imageFiles.length < IMAGE_LIMIT) {
      setIsImageLoading(true);
      try {
        const base64 = await toBase64(file);
        const newImg: ImageFile = {
          id: `${Date.now()}-${Math.random()}`,
          file, base64, mimeType: file.type,
          objectUrl: URL.createObjectURL(file)
        };
        setImageFiles(prev => [...prev, newImg]);
      } catch (err) {
        setError('Failed to process image.');
      } finally {
        setIsImageLoading(false);
      }
    }
    event.target.value = '';
  }, [imageFiles.length]);

  const generateVideo = useCallback(async (extensionPrompt?: string, sourceUrl?: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage(extensionPrompt ? "Extending your video sequence..." : LOADING_MESSAGES[0]);

    try {
      const config = {
        numberOfVideos: extensionPrompt ? 1 : numberOfVideos,
        aspectRatio,
        resolution,
        model: extensionPrompt ? 'veo-3.1-generate-preview' : modelType,
        previousVideo: sourceUrl ? (window as any)._videoMetadata?.[sourceUrl] : undefined
      };

      const urls = await generateVideoFromApi(
        extensionPrompt || prompt,
        imageFiles,
        config as any
      );

      if (extensionPrompt) {
        setGeneratedVideoUrls(prev => [...urls, ...prev]);
      } else {
        setGeneratedVideoUrls(urls);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageFiles, numberOfVideos, aspectRatio, resolution, modelType]);

  return {
    prompt, setPrompt, imageFiles, addImageFromFile, removeImage: (id: string) => setImageFiles(p => p.filter(i => i.id !== id)),
    generateVideo, isLoading, loadingMessage, generatedVideoUrls, error, setError,
    numberOfVideos, setNumberOfVideos, aspectRatio, setAspectRatio,
    resolution, setResolution, modelType, setModelType,
    imageUrl, setImageUrl, isImageLoading, IMAGE_LIMIT
  };
};
