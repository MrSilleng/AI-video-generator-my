// FIX: Import React to use types like React.ChangeEvent.
import React, { useState, useCallback, useEffect } from 'react';
import type { ImageFile } from '../types';
import { toBase64 } from '../utils/fileUtils';
import { generateVideo as generateVideoFromApi } from '../services/geminiService';

export const LOADING_MESSAGES = [
  "Contacting the video creation spirits...",
  "Gathering digital stardust and cosmic rays...",
  "Rendering the first few frames of your vision...",
  "This is taking a moment, great things are on the way...",
  "Applying the final polish to your masterpiece...",
  "Almost there, just a few more calculations..."
];

export const useVideoGenerator = () => {
  const IMAGE_LIMIT = 5;
  const [prompt, setPromptInternal] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [generatedVideoUrls, setGeneratedVideoUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [numberOfVideos, setNumberOfVideos] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [imageUrl, setImageUrl] = useState<string>('');

  const setPrompt = useCallback((value: string) => {
    if (error) setError(null);
    setPromptInternal(value);
  }, [error]);


  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessage(prevMessage => {
          const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
          const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
          return LOADING_MESSAGES[nextIndex];
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const addImage = useCallback((file: File, base64: string) => {
    if (imageFiles.length < IMAGE_LIMIT) {
      const newImage: ImageFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        base64,
        mimeType: file.type,
        objectUrl: URL.createObjectURL(file), // Create and store the object URL
      };
      setImageFiles(prev => [...prev, newImage]);
      setError(null);
    } else {
      setError(`You can add a maximum of ${IMAGE_LIMIT} images.`);
    }
  }, [imageFiles.length]);

  const addImageFromFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null);
    const file = event.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      try {
        const base64 = await toBase64(file);
        addImage(file, base64);
      } catch (err) {
        setError('Failed to process image file.');
        console.error(err);
      } finally {
        setIsImageLoading(false);
      }
    }
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  }, [addImage, error]);
  
  const addImageFromGalleryUrl = useCallback(async (url: string) => {
    if (!url.trim() || imageFiles.length >= IMAGE_LIMIT) return;

    if (error) setError(null);
    setIsImageLoading(true);
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image. Status: ${response.status}`);
        
        const contentType = response.headers.get('Content-Type');
        if (!contentType?.startsWith('image/')) throw new Error('URL does not point to a valid image.');

        const blob = await response.blob();
        const fileName = url.substring(url.lastIndexOf('/') + 1) || "gallery-image";
        const file = new File([blob], fileName, { type: blob.type });
        const base64 = await toBase64(file);
        addImage(file, base64);

    } catch (err: any) {
        setError(`Failed to load image: ${err.message}`);
        console.error(err);
    } finally {
        setIsImageLoading(false);
    }
  }, [addImage, imageFiles.length, error]);

  const addImageFromLinkUrl = useCallback(async (url: string) => {
    if (!url.trim() || imageFiles.length >= IMAGE_LIMIT) return;

    if (error) setError(null);
    setIsImageLoading(true);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image. Status: ${response.status}`);
      
      const contentType = response.headers.get('Content-Type');
      if (!contentType?.startsWith('image/')) throw new Error('URL does not point to a valid image.');

      const blob = await response.blob();
      const fileName = url.substring(url.lastIndexOf('/') + 1) || "linked-image";
      const file = new File([blob], fileName, { type: blob.type });
      const base64 = await toBase64(file);
      addImage(file, base64);
      setImageUrl(''); // Clear input after successful load

    } catch (err: any) {
      let errorMessage = `Failed to load image: ${err.message}.`;
      if (err instanceof TypeError) { // Likely a CORS issue
        errorMessage += ' This might be due to web security (CORS) policies.';
      }
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsImageLoading(false);
    }
  }, [addImage, imageFiles.length, error]);

  const removeImage = useCallback((id: string) => {
    if (error) setError(null);
    setImageFiles(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.objectUrl);
      }
      return prev.filter(file => file.id !== id);
    });
  }, [error]);

  const generateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrls([]);
    setLoadingMessage(LOADING_MESSAGES[0]);

    try {
      let videoUrls: string[] = [];
      if (imageFiles.length > 0) {
        // Generate one video for each image in the storyboard
        const promises = imageFiles.map(imageFile => 
          generateVideoFromApi(prompt, imageFile, 1, aspectRatio)
        );
        const results = await Promise.all(promises);
        videoUrls = results.flat(); // Flatten the array of arrays
      } else {
        // Generate variations from prompt only
        videoUrls = await generateVideoFromApi(prompt, null, numberOfVideos, aspectRatio);
      }
      setGeneratedVideoUrls(videoUrls);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred during video generation.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageFiles, numberOfVideos, aspectRatio]);

  return {
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
  };
};