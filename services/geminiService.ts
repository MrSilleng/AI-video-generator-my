
import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import type { ImageFile } from '../types';

// Helper to get fresh instance with latest key from dialog
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY not available. Please select an API key.");
  return new GoogleGenAI({ apiKey });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateVideo = async (
  prompt: string, 
  images: ImageFile[], 
  config: {
    numberOfVideos: number;
    aspectRatio: string;
    resolution: '720p' | '1080p';
    model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
    previousVideo?: any;
  }
): Promise<string[]> => {
  const ai = getAiClient();
  try {
    const params: any = {
      model: config.model,
      config: {
        numberOfVideos: config.numberOfVideos,
        aspectRatio: config.aspectRatio,
        resolution: config.resolution,
      }
    };

    if (prompt) params.prompt = prompt;

    // Handle Extension
    if (config.previousVideo) {
      params.video = config.previousVideo;
    } 
    // Handle Multi-Reference (Pro model only)
    else if (images.length > 0 && config.model === 'veo-3.1-generate-preview') {
      params.config.referenceImages = images.slice(0, 3).map(img => ({
        image: {
          imageBytes: img.base64,
          mimeType: img.mimeType,
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      }));
      params.prompt = prompt || "Generate a video based on these references";
    }
    // Handle Single Image (Fast or Pro)
    else if (images.length === 1) {
      params.image = {
        imageBytes: images[0].base64,
        mimeType: images[0].mimeType,
      };
    }

    let operation = await ai.models.generateVideos(params);

    while (!operation.done) {
      await sleep(10000);
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation.error) {
      const err = operation.error;
      // Handle 404 - Project/Key issue
      if (err.message?.includes("Requested entity was not found") || err.code === 404) {
        window.dispatchEvent(new CustomEvent('aistudio:resetKey'));
        throw new Error("The selected API key project was not found. Please re-select a valid project.");
      }
      // Handle 429 - Quota/Billing issue
      if (err.message?.includes("exceeded your current quota") || err.code === 429) {
        throw new Error("Quota exceeded. Please check your billing status and project limits at ai.google.dev.");
      }
      throw new Error(String(err.message || 'Generation failed'));
    }

    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos?.length) {
      throw new Error("No videos were returned.");
    }
    
    const apiKey = process.env.API_KEY;
    const videoPromises = generatedVideos.map(async (videoData: any) => {
      const downloadLink = videoData?.video?.uri;
      if (!downloadLink) return null;
      
      const response = await fetch(`${downloadLink}&key=${apiKey}`);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      
      const blob = await response.blob();
      // We store the raw metadata if we want to extend it later
      const objectUrl = URL.createObjectURL(blob);
      (window as any)._videoMetadata = (window as any)._videoMetadata || {};
      (window as any)._videoMetadata[objectUrl] = videoData.video;
      
      return objectUrl;
    });

    const urls = await Promise.all(videoPromises);
    return urls.filter((url): url is string => url !== null);

  } catch (error: any) {
    console.error("Veo Error:", error);
    // Double-check error message for the 404 project re-selection rule
    if (error.message?.includes("Requested entity was not found") || (error.code === 404)) {
        window.dispatchEvent(new CustomEvent('aistudio:resetKey'));
        throw new Error("The selected API key project was not found. Please re-select a valid project.");
    }
    // Handle 429 - Resource Exhausted
    if (error.message?.includes("RESOURCE_EXHAUSTED") || error.code === 429) {
        throw new Error("Generation limit reached. Please check your Gemini API quota and billing details.");
    }
    throw error;
  }
};
