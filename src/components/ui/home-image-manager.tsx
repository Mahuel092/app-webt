'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';

interface HomeImage {
  id: number;
  image_url: string;
  title: string;
  description: string;
  created_at: string;
}

interface HomeImageManagerProps {
  onImageAdded?: () => void;
  onImageDeleted?: () => void;
}

export function HomeImageManager({ onImageAdded, onImageDeleted }: HomeImageManagerProps) {
  const [images, setImages] = useState<HomeImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImage, setNewImage] = useState({
    image_url: '',
    title: '',
    description: ''
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const response = await fetch('/api/home-images');
      const data = await response.json();
      if (data.success) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error loading home images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newImage.image_url) {
      alert('Por favor selecciona una imagen');
      return;
    }

    try {
      const response = await fetch('/api/home-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newImage)
      });

      const data = await response.json();
      if (data.success) {
        setImages([data.image, ...images]);
        setNewImage({ image_url: '', title: '', description: '' });
        onImageAdded?.();
        alert('Imagen agregada correctamente');
      } else {
        alert('Error al agregar imagen: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Error al agregar imagen');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/home-images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setImages(images.filter(img => img.id !== imageId));
        onImageDeleted?.();
        alert('Imagen eliminada correctamente');
      } else {
        alert('Error al eliminar imagen: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error al eliminar imagen');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando imágenes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agregar Nueva Imagen */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Imagen al Inicio</CardTitle>
          <CardDescription>
            Sube imágenes para mostrar en la página de inicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddImage} className="space-y-4">
            <div>
              <Label>Imagen</Label>
              <ImageUpload
                onImageUploaded={(url) => setNewImage({ ...newImage, image_url: url })}
                currentImage={newImage.image_url}
              />
              {newImage.image_url && (
                <p className="text-xs text-gray-500 mt-1">
                  Imagen seleccionada: {newImage.image_url.split('/').pop()}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="title">Título (Opcional)</Label>
              <Input
                id="title"
                value={newImage.title}
                onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                placeholder="Título de la imagen"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Input
                id="description"
                value={newImage.description}
                onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                placeholder="Descripción de la imagen"
              />
            </div>
            <Button type="submit" className="w-full">
              Agregar Imagen
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Imágenes */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes del Inicio ({images.length})</CardTitle>
          <CardDescription>
            Gestiona las imágenes que aparecen en la página de inicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🖼️</div>
              <p className="text-gray-600 mb-4">No hay imágenes agregadas</p>
              <p className="text-sm text-gray-500">
                Agrega tu primera imagen usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg p-4 space-y-3">
                  <img
                    src={image.image_url}
                    alt={image.title || 'Imagen del inicio'}
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="space-y-1">
                    {image.title && (
                      <h4 className="font-medium text-sm">{image.title}</h4>
                    )}
                    {image.description && (
                      <p className="text-xs text-gray-600">{image.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeleteImage(image.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    🗑️ Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
