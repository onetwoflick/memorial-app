'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

type Point = { x: number; y: number };

export type Area = { x: number; y: number; width: number; height: number };

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: Area) => void;
  onCancel: () => void;
  aspect?: number;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel, aspect = 3 / 4 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onCropCompleteInternal = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col h-[80vh] md:h-auto">
        <h3 className="font-serif text-2xl mb-4 text-slate-800 text-center">Adjust Photo</h3>
        <p className="text-sm text-slate-500 mb-6 text-center">Drag to position. Scroll to zoom.</p>
        
        <div className="relative flex-grow min-h-[300px] w-full bg-stone-100 rounded-xl overflow-hidden mb-6">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
            classes={{
              containerClassName: "rounded-xl"
            }}
          />
        </div>

        <div className="flex gap-4 justify-end mt-auto">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-full text-slate-600 bg-stone-100 hover:bg-stone-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (croppedAreaPixels) onCropComplete(croppedAreaPixels);
            }}
            disabled={!croppedAreaPixels}
            className="px-6 py-3 rounded-full text-white bg-slate-800 hover:bg-slate-700 transition-colors font-medium shadow-md disabled:opacity-50"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
