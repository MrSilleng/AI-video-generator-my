import { GoogleGenAI } from "@google/genai";
import type { ImageFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// A utility function to introduce a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extracts structured error details from the raw error object thrown by the API client.
 * @param error The unknown error object from a catch block.
 * @returns An object with error code, status, and message if found.
 */
const getApiErrorDetails = (error: unknown): { code?: number; status?: string; message?: string } => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { [key: string]: any };

    // The error object itself may be the response body, e.g., { error: { ... } }
    if (err.error && typeof err.error === 'object') {
      return err.error;
    }
    
    // The error message might be a JSON string.
    if (typeof err.message === 'string') {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error && typeof parsed.error === 'object') {
          return parsed.error;
        }
      } catch (e) {
        // Not a JSON string, continue to the next check.
      }
    }
  }

  return {};
};


export const generateVideo = async (prompt: string, image: ImageFile | null, numberOfVideos: number, aspectRatio: string): Promise<string[]> => {
  try {
    const generateVideosParams: any = {
      model: 'veo-2.0-generate-001',
      prompt,
      config: {
        numberOfVideos,
        aspectRatio,
      }
    };

    if (image) {
      generateVideosParams.image = {
        imageBytes: image.base64,
        mimeType: image.mimeType,
      };
    }

    let operation = await ai.models.generateVideos(generateVideosParams);

    // Poll for the result
    while (!operation.done) {
      await sleep(10000); // Wait for 10 seconds before checking again
      // FIX: The `getVideosOperation` method can accept the entire operation object.
      // This is a more robust way to poll for the result and avoids potential typing issues with `operation.name`.
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        // Handle errors that occur during the long-running operation.
        // The error message here is often descriptive (e.g., safety violations). Let the catch block format it.
        const errorMessage = operation.error.message || 'An unknown error occurred during video processing.';
        // FIX: Explicitly cast the error message to a string. The type of `operation.error.message`
        // can sometimes be inferred as `unknown`, which is not assignable to the `Error` constructor.
        throw new Error(String(errorMessage));
    }

    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
      throw new Error("Video generation completed, but no videos were found.");
    }
    
    // The API key must be appended for the download link to work
    const apiKey = process.env.API_KEY;

    // Fetch all videos concurrently and create object URLs
    const videoPromises = generatedVideos.map(async (videoData) => {
        const downloadLink = videoData?.video?.uri;
        if (!downloadLink) {
            console.warn("A video was generated but no download link was found for it.");
            return null;
        }
        const fullUrl = `${downloadLink}&key=${apiKey}`;
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch video from ${fullUrl}. Status: ${response.status}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    });

    const videoObjectUrls = await Promise.all(videoPromises);
    
    // Filter out any nulls in case a video link was missing
    return videoObjectUrls.filter((url): url is string => url !== null);

  } catch (error: unknown) {
    console.error("Error in generateVideo service:", error);

    const apiError = getApiErrorDetails(error);
    let message: string;

    // More robustly identify quota errors by checking the status.
    if (apiError.status === 'RESOURCE_EXHAUSTED') {
      message = `QUOTA_EXHAUSTED: ${apiError.message || 'The API quota has been exceeded.'}`;
    } else if (apiError.message) {
      message = apiError.message;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string' && error) {
      message = error;
    } else {
      message = 'An unknown error occurred while generating the video.';
    }


    // Clean up known verbose prefixes from the API to create a cleaner user-facing message.
    if (message.startsWith('Video generation failed: ')) {
      message = message.substring('Video generation failed: '.length);
    }

    throw new Error(message);
  }
};