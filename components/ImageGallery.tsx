import React from 'react';
import { galleryImages } from '../lib/galleryImages';

interface ImageGalleryProps {
  onSelectImage: (url: string) => void;
  disabled?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ onSelectImage, disabled = false }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2">
      {galleryImages.map((image) => (
        <button
          key={image.id}
          type="button"
          className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onSelectImage(image.src)}
          aria-label={`Select image: ${image.alt}`}
          disabled={disabled}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      ))}
    </div>
  );
};