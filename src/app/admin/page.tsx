'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { Reviews } from '@/components/ui/reviews';
import { ImageManager } from '@/components/ui/image-manager';
import { HomeImageManager } from '@/components/ui/home-image-manager';

interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  youtube_url: string;
}

interface Delivery {
  id: number;
  user_id: number;
  product_id: number;
  estimated_delivery_time: string;
  status: string;
  progress: number;
  created_at: string;
  user_name?: string;
  product_name?: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image_url: '',
    youtube_url: ''
  });

  // Edit product states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState({
    name: '',
    price: '',
    image_url: '',
    youtube_url: ''
  });

  // Custom delivery time state
  const [customDeliveryTimes, setCustomDeliveryTimes] = useState<{[key: number]: string}>({});

  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (!parsedUser.isAdmin) {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // Cargar productos
      const productsResponse = await fetch('/api/products');
      const productsData = await productsResponse.json();
      if (productsData.success) {
        setProducts(productsData.products);
      }

      // Cargar entregas
      const deliveriesResponse = await fetch('/api/deliveries');
      const deliveriesData = await deliveriesResponse.json();
      if (deliveriesData.success) {
        setDeliveries(deliveriesData.deliveries);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // For ImageManager reload
  const loadProducts = async () => {
    try {
      const productsResponse = await fetch('/api/products');
      const productsData = await productsResponse.json();
      if (productsData.success) {
        setProducts(productsData.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newProduct.name,
          price: Number.parseFloat(newProduct.price),
          image_url: newProduct.image_url,
          youtube_url: newProduct.youtube_url
        })
      });

      const data = await response.json();
      if (data.success) {
        setProducts([...products, data.product]);
        setNewProduct({ name: '', price: '', image_url: '', youtube_url: '' });
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProduct({
      name: product.name,
      price: product.price.toString(),
      image_url: product.image_url,
      youtube_url: product.youtube_url
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editProduct.name,
          price: Number.parseFloat(editProduct.price),
          image_url: editProduct.image_url,
          youtube_url: editProduct.youtube_url
        })
      });

      const data = await response.json();
      if (data.success) {
        setProducts(products.map(p =>
          p.id === editingProduct.id ? data.product : p
        ));
        setEditingProduct(null);
        setEditProduct({ name: '', price: '', image_url: '', youtube_url: '' });
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditProduct({ name: '', price: '', image_url: '', youtube_url: '' });
  };

  const updateDeliveryTime = async (deliveryId: number, minutes: number) => {
    try {
      const newTime = new Date(Date.now() + minutes * 60000).toISOString();
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          estimated_delivery_time: newTime,
          status: 'pending',
          progress: 0
        })
      });

      const data = await response.json();
      if (data.success) {
        loadData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error updating delivery:', error);
    }
  };

  // Actualizar la función deliverImmediately para mejorar la compatibilidad con móviles
  const deliverImmediately = async (deliveryId: number) => {
    try {
      // Prevenir que el evento se propague o se duplique
      (window.event as any)?.preventDefault?.();
      (window.event as any)?.stopPropagation?.();

      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          estimated_delivery_time: new Date().toISOString(),
          status: 'delivered',
          progress: 100
        })
      });

      const data = await response.json();
      if (data.success) {
        loadData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error delivering immediately:', error);
    }
  };

  // Función auxiliar para manejar eventos táctiles
  const handleMobileClick = (callback: Function, ...args: any[]) => {
    return (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();
      callback(...args);
    };
  };

  const updateCustomDeliveryTime = async (deliveryId: number) => {
    const customMinutes = customDeliveryTimes[deliveryId];
    if (!customMinutes) return;

    const minutes = Number.parseInt(customMinutes);
    if (isNaN(minutes) || minutes <= 0) return;

    try {
      const newTime = new Date(Date.now() + minutes * 60000).toISOString();
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          estimated_delivery_time: newTime,
          status: 'pending',
          progress: 0
        })
      });

      const data = await response.json();
      if (data.success) {
        setCustomDeliveryTimes({...customDeliveryTimes, [deliveryId]: ''});
        loadData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error updating custom delivery time:', error);
    }
  };

  const deleteDelivery = async (deliveryId: number) => {
    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que quieres eliminar esta entrega? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Actualizar la lista de entregas localmente
        setDeliveries(deliveries.filter(d => d.id !== deliveryId));
        alert('Entrega eliminada correctamente');
      } else {
        alert('Error al eliminar la entrega: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert('Error al eliminar la entrega');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administrador...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalProducts: products.length,
    totalDeliveries: deliveries.length,
    pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
    completedDeliveries: deliveries.filter(d => d.status === 'delivered').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👑</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel de Administrador</h1>
                <p className="text-sm text-gray-500">Bienvenido, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="p-2 hover:bg-blue-50 hover:border-blue-300"
                title="Actualizar página"
              >
                <span className="text-lg">🔄</span>
              </Button>
              <Button onClick={handleLogout} variant="outline">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">🚚</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Entregas Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Entregas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Gestión de DeliveryPro</CardTitle>
            <CardDescription>
              Administra productos, entregas y tiempos de envío
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Contenedor con scroll horizontal mejorado */}
              <div className="relative w-full">
                {/* Indicadores de gradiente para mostrar que hay más contenido */}
                <div className="absolute top-0 right-0 z-10 h-12 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none rounded-r-lg"></div>
                <div className="absolute top-0 left-0 z-10 h-12 w-8 bg-gradient-to-r from-white/90 to-transparent pointer-events-none rounded-l-lg"></div>

                {/* Tabs con scroll horizontal */}
                <div
                  className="w-full overflow-x-auto pb-2 scrollbar-hide"
                  style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                >
                  <TabsList className="flex w-max min-w-full h-14 bg-gray-100/80 backdrop-blur-sm p-2 rounded-lg shadow-sm border">
                    <TabsTrigger
                      value="dashboard"
                      className="flex-shrink-0 px-6 py-3 mx-1 rounded-md text-sm font-medium transition-all whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/50"
                    >
                      📊 Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                      value="products"
                      className="flex-shrink-0 px-6 py-3 mx-1 rounded-md text-sm font-medium transition-all whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/50"
                    >
                      📦 Productos
                    </TabsTrigger>
                    <TabsTrigger
                      value="deliveries"
                      className="flex-shrink-0 px-6 py-3 mx-1 rounded-md text-sm font-medium transition-all whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/50"
                    >
                      🚚 Entregas
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="flex-shrink-0 px-6 py-3 mx-1 rounded-md text-sm font-medium transition-all whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/50"
                    >
                      ⭐ Reseñas
                    </TabsTrigger>
                    <TabsTrigger
                      value="images"
                      className="flex-shrink-0 px-6 py-3 mx-1 rounded-md text-sm font-medium transition-all whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/50"
                    >
                      🖼️ Imágenes
                    </TabsTrigger>
                    <TabsTrigger
                      value="home-images"
                      className="flex-shrink-0 px-6 py-3 mx-1 rounded-md text-sm font-medium transition-all whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/50"
                    >
                      🏠 Inicio
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Hint visual para scroll en móvil */}
                <div className="text-center mt-1 md:hidden">
                  <p className="text-xs text-gray-400 animate-pulse">← Desliza para ver más →</p>
                </div>
              </div>

              <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    🎉 ¡Administración Activa!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    El sistema está funcionando correctamente. Tienes acceso completo a todas las funcionalidades.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button onClick={() => setActiveTab('products')}>
                      Gestionar Productos
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('deliveries')}>
                      Ver Entregas
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add Product Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Agregar Producto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddProduct} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nombre del Producto</Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                            placeholder="iPhone 15 Pro Max"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">Precio (USD)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            placeholder="1299.00"
                            required
                          />
                        </div>
                        <div>
                          <Label>Imagen del Producto</Label>
                          <ImageUpload
                            onImageUploaded={(url) => setNewProduct({...newProduct, image_url: url})}
                            currentImage={newProduct.image_url}
                          />
                          {newProduct.image_url && (
                            <p className="text-xs text-gray-500 mt-1">
                              Imagen seleccionada: {newProduct.image_url.split('/').pop()}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="youtube_url">URL de YouTube</Label>
                          <Input
                            id="youtube_url"
                            value={newProduct.youtube_url}
                            onChange={(e) => setNewProduct({...newProduct, youtube_url: e.target.value})}
                            placeholder="https://www.youtube.com/watch?v=..."
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Agregar Producto
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Products List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Productos Actuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {products.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500">${product.price}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => handleEditProduct(product)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    ✏️ Editar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Editar Producto</DialogTitle>
                                    <DialogDescription>
                                      Modifica los detalles del producto aquí.
                                    </DialogDescription>
                                  </DialogHeader>
                                  {editingProduct?.id === product.id && (
                                    <form onSubmit={handleUpdateProduct} className="space-y-4">
                                      <div>
                                        <Label htmlFor="edit-name">Nombre del Producto</Label>
                                        <Input
                                          id="edit-name"
                                          value={editProduct.name}
                                          onChange={(e) => setEditProduct({...editProduct, name: e.target.value})}
                                          required
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-price">Precio (USD)</Label>
                                        <Input
                                          id="edit-price"
                                          type="number"
                                          step="0.01"
                                          value={editProduct.price}
                                          onChange={(e) => setEditProduct({...editProduct, price: e.target.value})}
                                          required
                                        />
                                      </div>
                                      <div>
                                        <Label>Imagen del Producto</Label>
                                        <ImageUpload
                                          onImageUploaded={(url) => setEditProduct({...editProduct, image_url: url})}
                                          currentImage={editProduct.image_url}
                                        />
                                        {editProduct.image_url && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            Imagen actual: {editProduct.image_url.split('/').pop()}
                                          </p>
                                        )}
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-youtube">URL de YouTube</Label>
                                        <Input
                                          id="edit-youtube"
                                          value={editProduct.youtube_url}
                                          onChange={(e) => setEditProduct({...editProduct, youtube_url: e.target.value})}
                                          required
                                        />
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button type="submit" className="flex-1">
                                          Guardar Cambios
                                        </Button>
                                        <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1">
                                          Cancelar
                                        </Button>
                                      </div>
                                    </form>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                onClick={() => handleDeleteProduct(product.id)}
                                variant="outline"
                                size="sm"
                              >
                                🗑️ Eliminar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Deliveries Tab */}
              <TabsContent value="deliveries" className="space-y-6">
                <div className="space-y-4">
                  {deliveries.map((delivery) => (
                    <Card key={delivery.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'}>
                                {delivery.status === 'delivered' ? 'Entregado' : 'Pendiente'}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Pedido #{delivery.id}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900">
                              {delivery.product_name || `Producto ${delivery.product_id}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              Cliente: {delivery.user_name || `Usuario ${delivery.user_id}`}
                            </p>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Progreso</span>
                                <span>{delivery.progress}%</span>
                              </div>
                              <Progress value={delivery.progress} className="h-2" />
                            </div>
                          </div>

                          <div className="ml-6 space-y-3">
                            {/* Botón de Eliminar - Siempre visible - Mejorado para móviles */}
                            <div className="flex justify-end">
                              <Button
                                onClick={handleMobileClick(deleteDelivery, delivery.id)}
                                onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                onTouchEnd={(e) => e.currentTarget.style.backgroundColor = ''}
                                size="sm"
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white touch-manipulation select-none"
                                style={{
                                  WebkitTapHighlightColor: 'transparent',
                                  touchAction: 'manipulation'
                                }}
                              >
                                🗑️ Eliminar
                              </Button>
                            </div>

                            {delivery.status === 'pending' && (
                              <>
                                {/* Entrega Inmediata - Mejorado para móviles */}
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={handleMobileClick(deliverImmediately, delivery.id)}
                                    onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                                    onTouchEnd={(e) => e.currentTarget.style.backgroundColor = ''}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white touch-manipulation select-none"
                                    style={{
                                      WebkitTapHighlightColor: 'transparent',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    ⚡ Entrega Inmediata
                                  </Button>
                                </div>

                                {/* Tiempo Manual - Mejorado para móviles */}
                                <div className="flex space-x-2 items-center">
                                  <Input
                                    type="number"
                                    placeholder="Min"
                                    value={customDeliveryTimes[delivery.id] || ''}
                                    onChange={(e) => setCustomDeliveryTimes({
                                      ...customDeliveryTimes,
                                      [delivery.id]: e.target.value
                                    })}
                                    className="w-20 h-8 touch-manipulation"
                                    min="1"
                                    inputMode="numeric"
                                  />
                                  <Button
                                    onClick={handleMobileClick(updateCustomDeliveryTime, delivery.id)}
                                    onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                                    onTouchEnd={(e) => e.currentTarget.style.backgroundColor = ''}
                                    size="sm"
                                    variant="outline"
                                    disabled={!customDeliveryTimes[delivery.id]}
                                    className="touch-manipulation select-none active:bg-gray-200"
                                    style={{
                                      WebkitTapHighlightColor: 'transparent',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    ⏰ Aplicar
                                  </Button>
                                </div>

                                {/* Tiempos Predefinidos - Mejorados para móviles */}
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={handleMobileClick(updateDeliveryTime, delivery.id, 15)}
                                    onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                                    onTouchEnd={(e) => e.currentTarget.style.backgroundColor = ''}
                                    size="sm"
                                    variant="outline"
                                    className="touch-manipulation select-none active:bg-gray-200"
                                    style={{
                                      WebkitTapHighlightColor: 'transparent',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    +15min
                                  </Button>
                                  <Button
                                    onClick={handleMobileClick(updateDeliveryTime, delivery.id, 30)}
                                    onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                                    onTouchEnd={(e) => e.currentTarget.style.backgroundColor = ''}
                                    size="sm"
                                    variant="outline"
                                    className="touch-manipulation select-none active:bg-gray-200"
                                    style={{
                                      WebkitTapHighlightColor: 'transparent',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    +30min
                                  </Button>
                                  <Button
                                    onClick={handleMobileClick(updateDeliveryTime, delivery.id, 60)}
                                    onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                                    onTouchEnd={(e) => e.currentTarget.style.backgroundColor = ''}
                                    size="sm"
                                    variant="outline"
                                    className="touch-manipulation select-none active:bg-gray-200"
                                    style={{
                                      WebkitTapHighlightColor: 'transparent',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    +1h
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Resumen de reseñas por producto */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestión de Reseñas</CardTitle>
                      <CardDescription>
                        Administra las reseñas de todos los productos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {products.map((product) => (
                          <div key={product.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div>
                                  <h4 className="font-medium">{product.name}</h4>
                                  <p className="text-sm text-gray-500">${product.price}</p>
                                </div>
                              </div>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    ⭐ Ver Reseñas
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Reseñas - {product.name}</DialogTitle>
                                  </DialogHeader>
                                  <Reviews
                                    productId={product.id}
                                    userId={undefined}
                                    isAdmin={true}
                                  />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estadísticas generales */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Estadísticas de Reseñas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">📊</div>
                        <p className="text-gray-600 mb-4">
                          Estadísticas generales de reseñas
                        </p>
                        <p className="text-sm text-gray-500">
                          Selecciona un producto para ver sus reseñas detalladas
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-6">
                <ImageManager
                  onImageDeleted={() => {
                    // Recargar productos cuando se elimina una imagen
                    loadProducts();
                  }}
                />
              </TabsContent>

              {/* Home Images Tab */}
              <TabsContent value="home-images" className="space-y-6">
                <HomeImageManager
                  onImageAdded={() => {
                    console.log('Imagen agregada al inicio');
                  }}
                  onImageDeleted={() => {
                    console.log('Imagen eliminada del inicio');
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
