'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

interface ImageData {
  id: number | null;
  productName: string;
  imageUrl: string;
  filename: string;
  exists: boolean;
  createdAt: string | null;
}

interface ImageManagerProps {
  onImageDeleted?: () => void;
}

export function ImageManager({ onImageDeleted }: ImageManagerProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalImages, setTotalImages] = useState(0);
  const [orphanCount, setOrphanCount] = useState(0);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const response = await fetch('/api/images', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setImages(data.images);
        setTotalImages(data.totalImages);
        setOrphanCount(data.orphanCount);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (filename: string, productId: number | null) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la imagen "${filename}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          filename,
          productId
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadImages();
        if (onImageDeleted) {
          onImageDeleted();
        }
        alert('Imagen eliminada exitosamente');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error al eliminar la imagen');
    }
  };

  const formatFileSize = (url: string) => {
    // Esta es una aproximación, en producción podrías obtener el tamaño real
    return 'N/A';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Desconocido';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando imágenes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestor de Imágenes</span>
            <div className="flex space-x-2">
              <Badge variant="secondary">
                {totalImages} imágenes totales
              </Badge>
              {orphanCount > 0 && (
                <Badge variant="destructive">
                  {orphanCount} archivos huérfanos
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Gestiona todas las imágenes subidas. Elimina archivos innecesarios para optimizar el espacio en tu servidor.
            {orphanCount > 0 && (
              <span className="text-orange-600 font-medium">
                {' '}Los archivos huérfanos son imágenes que existen en el servidor pero no están asociadas a ningún producto.
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Lista de imágenes */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes Subidas</CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📷</div>
              <p className="text-gray-600">No hay imágenes subidas aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div
                  key={`${image.filename}-${index}`}
                  className={`border rounded-lg p-4 ${
                    !image.exists ? 'border-red-300 bg-red-50' :
                    image.id === null ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200'
                  }`}
                >
                  {/* Imagen */}
                  <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                    {image.exists ? (
                      <img
                        src={image.imageUrl}
                        alt={image.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy="0.3em" font-family="sans-serif" font-size="12" fill="%236b7280">Error</text></svg>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-2xl mb-2">❌</div>
                          <div className="text-xs">Archivo no encontrado</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-sm truncate" title={image.productName}>
                        {image.productName}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={image.filename}>
                        {image.filename}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(image.createdAt)}</span>
                      <div className="flex space-x-1">
                        {image.id === null && (
                          <Badge variant="outline" className="text-xs">
                            Huérfano
                          </Badge>
                        )}
                        {!image.exists && (
                          <Badge variant="destructive" className="text-xs">
                            Perdido
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Botón eliminar */}
                    <Button
                      onClick={() => deleteImage(image.filename, image.id)}
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
