'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Reviews } from '@/components/ui/reviews';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  product_image?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0
  });

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
    setUser(parsedUser);
    loadData();

    // Auto-actualizar entregas cada 30 segundos
    const interval = setInterval(() => {
      // Recargar entregas usando el userId actual
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        loadDeliveries(parsedUser.id);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  // Actualizar estadísticas cuando cambien las entregas
  useEffect(() => {
    const newStats = {
      totalOrders: deliveries.length,
      pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
      completedDeliveries: deliveries.filter(d => d.status === 'delivered').length
    };
    setStats(newStats);
  }, [deliveries]);

  const loadData = async () => {
    try {
      // Cargar productos
      const productsResponse = await fetch('/api/products');
      const productsData = await productsResponse.json();
      if (productsData.success) {
        setProducts(productsData.products);
      }

      // Cargar entregas con el userId del usuario actual
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        await loadDeliveries(parsedUser.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeliveries = async (userId?: number) => {
    try {
      const deliveriesResponse = await fetch('/api/deliveries');
      const deliveriesData = await deliveriesResponse.json();
      if (deliveriesData.success) {
        // Usar el userId pasado como parámetro o el user?.id actual
        const currentUserId = userId || user?.id;
        if (currentUserId) {
          // Filtrar solo las entregas del usuario actual
          const userDeliveries = deliveriesData.deliveries.filter(
            (d: Delivery) => d.user_id === currentUserId
          );
          setDeliveries(userDeliveries);
        }
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleOrderProduct = async (productId: number) => {
    try {
      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          product_id: productId,
          delivery_time_minutes: 45 // 45 minutos por defecto
        })
      });

      const data = await response.json();
      if (data.success) {
        // Recargar entregas usando el userId actual
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          await loadDeliveries(parsedUser.id);
        }
        setActiveTab('deliveries'); // Cambiar a la pestaña de entregas
      }
    } catch (error) {
      console.error('Error ordering product:', error);
    }
  };

  const formatTimeRemaining = (estimatedTime: string, status: string) => {
    if (status === 'delivered') return 'Entregado';

    const now = new Date().getTime();
    const estimated = new Date(estimatedTime).getTime();
    const remaining = estimated - now;

    if (remaining <= 0) return 'Entregado';

    const minutes = Math.floor(remaining / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m restantes`;
    } else {
      return `${minutes}m restantes`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🚚</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Brytech_Audiov1</h1>
                <p className="text-sm text-gray-500">Hola, {user?.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
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
                  <p className="text-sm font-medium text-gray-600">En Camino</p>
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
                  <p className="text-sm font-medium text-gray-600">Entregados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Tu Tienda Personal</CardTitle>
            <CardDescription>
              Explora productos y rastrea tus entregas en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                <TabsTrigger value="deliveries">
                  Entregas
                  {stats.pendingDeliveries > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.pendingDeliveries}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="profile">Perfil</TabsTrigger>
              </TabsList>

              {/* Catalog Tab */}
              <TabsContent value="catalog" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                        <p className="text-2xl font-bold text-blue-600 mb-3">
                          ${product.price.toLocaleString()}
                        </p>
                        <div className="space-y-2">
                          <Button
                            onClick={() => window.open(product.youtube_url, '_blank')}
                            variant="outline"
                            className="w-full"
                          >
                            📺 Ver Demostración
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                ⭐ Ver Reseñas
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Reseñas - {product.name}</DialogTitle>
                              </DialogHeader>
                              <Reviews
                                productId={product.id}
                                userId={user?.id}
                                isAdmin={false}
                              />
                            </DialogContent>
                          </Dialog>

                          <Button
                            onClick={() => handleOrderProduct(product.id)}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            🛒 Pedir Ahora
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Deliveries Tab */}
              <TabsContent value="deliveries" className="space-y-6">
                {deliveries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No tienes entregas todavía
                    </h3>
                    <p className="text-gray-600 mb-6">
                      ¡Haz tu primer pedido desde el catálogo!
                    </p>
                    <Button onClick={() => setActiveTab('catalog')}>
                      Ver Productos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveries.map((delivery) => (
                      <Card key={delivery.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <img
                              src={delivery.product_image || 'https://via.placeholder.com/80'}
                              alt={delivery.product_name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">
                                  {delivery.product_name || `Producto ${delivery.product_id}`}
                                </h3>
                                <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'}>
                                  {delivery.status === 'delivered' ? 'Entregado' : 'En Camino'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                Pedido #{delivery.id} • {formatTimeRemaining(delivery.estimated_delivery_time, delivery.status)}
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Progreso de entrega</span>
                                  <span>{delivery.progress}%</span>
                                </div>
                                <Progress
                                  value={delivery.progress}
                                  className={`h-3 ${delivery.status === 'delivered' ? 'bg-green-100' : 'bg-blue-100'}`}
                                />
                                {delivery.status === 'delivered' && (
                                  <div className="flex items-center text-green-600 text-sm font-medium">
                                    <span className="mr-2">✅</span>
                                    ¡Producto entregado exitosamente!
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl text-white">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{user?.name}</h2>
                  <p className="text-gray-600 mb-6">{user?.email}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
                      <div className="text-sm text-gray-600">Total Pedidos</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pendingDeliveries}</div>
                      <div className="text-sm text-gray-600">En Proceso</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.completedDeliveries}</div>
                      <div className="text-sm text-gray-600">Completados</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
