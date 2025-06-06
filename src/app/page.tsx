'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface HomeImage {
  id: number;
  image_url: string;
  title: string;
  description: string;
  created_at: string;
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [homeImages, setHomeImages] = useState<HomeImage[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadHomeImages();
  }, []);

  const loadHomeImages = async () => {
    try {
      const response = await fetch('/api/home-images');
      const data = await response.json();
      if (data.success) {
        setHomeImages(data.images);
      }
    } catch (error) {
      console.error('Error loading home images:', error);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar token en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirección inmediata y forzada
        console.log('Login exitoso, redirigiendo a:', data.redirectTo);

        if (data.user.isAdmin) {
          window.location.href = '/admin'; // Redirección forzada
        } else {
          window.location.href = '/dashboard'; // Redirección forzada
        }
      } else {
        setError(data.error || 'Error de login');
      }
    } catch (error) {
      console.error('Error durante login:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar token en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirección al dashboard
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Error de registro');
      }
    } catch (error) {
      console.error('Error durante registro:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl text-white">🎧</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BryTech Audio</h1>
          <div className="mb-4">
            <p className="text-lg font-medium animated-gradient-text">
              BryTech Audio es una empresa especializada en la venta de audífonos gamer de alto rendimiento.
            </p>
          </div>

          <style jsx>{`
            .animated-gradient-text {
              background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6);
              background-size: 300% 300%;
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              animation: gradientShift 3s ease-in-out infinite;
            }

            @keyframes gradientShift {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }
          `}</style>

        </div>

        {/* Login/Register Tabs */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Bienvenido</CardTitle>
            <CardDescription className="text-center">
              Inicia sesión o regístrate para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="text"
                      placeholder="Ingresa tu email"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      required
                      className="h-12"
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>


              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre</Label>
                    <Input
                      id="register-name"
                      name="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="h-12"
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Home Images Gallery */}
        {homeImages.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-center text-gray-900 mb-4">
              Galería de Productos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeImages.map((image) => (
                <Card key={image.id} className="overflow-hidden bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
                  <div className="aspect-video relative">
                    <img
                      src={image.image_url}
                      alt={image.title || 'Imagen de BryTech Audio'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {(image.title || image.description) && (
                    <CardContent className="p-4">
                      {image.title && (
                        <h4 className="font-semibold text-gray-900 mb-1">{image.title}</h4>
                      )}
                      {image.description && (
                        <p className="text-sm text-gray-600">{image.description}</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-xs text-gray-600">Entregas Rápidas</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-xs text-gray-600">Seguimiento Real</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-xs text-gray-600">100% Seguro</div>
          </div>
        </div>
      </div>
    </div>
  );
}
