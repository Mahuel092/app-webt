'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  className?: string;
}

export function ImageUpload({ onImageUploaded, currentImage, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.success) {
      onUpload(data.url);
    } else {
      console.error(data.error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-gray-400'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="w-32 h-32 object-cover rounded-lg mx-auto border"
                />
                <p className="text-sm text-gray-600">
                  Haz clic o arrastra una nueva imagen para cambiar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl text-gray-400">📷</div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">
                    Subir imagen del producto
                  </p>
                  <p className="text-sm text-gray-500">
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG, PNG, WEBP (máximo 5MB)
                  </p>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-600 font-medium">Subiendo...</span>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {preview && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={openFileDialog}
                variant="outline"
                size="sm"
                disabled={isUploading}
              >
                📷 Cambiar Imagen
              </Button>
              {preview !== currentImage && (
                <Button
                  onClick={() => {
                    setPreview(currentImage || null);
                    onImageUploaded(currentImage || '');
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                >
                  ↩️ Cancelar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
