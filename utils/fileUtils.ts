
export const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // The result includes the data URL prefix (e.g., "data:image/png;base64,"),
        // which needs to be removed for the Gemini API.
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to read file as a data URL string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
