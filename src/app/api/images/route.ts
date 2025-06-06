import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

// GET - Obtener todas las imágenes subidas
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de acceso requerido' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const userCheck = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!userCheck.rows[0] || !userCheck.rows[0].is_admin) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Obtener todas las imágenes de productos desde la base de datos
    const productsWithImages = await query(`
      SELECT
        id,
        name,
        image_url,
        created_at
      FROM products
      WHERE image_url IS NOT NULL
      ORDER BY created_at DESC
    `);

    // Obtener archivos físicos en la carpeta
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
    let physicalFiles: string[] = [];

    try {
      const files = await fs.readdir(imagesDir);
      physicalFiles = files.filter(file =>
        file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
    } catch (error) {
      console.log('No se pudo leer el directorio de imágenes:', error);
    }

    // Combinar información
    const images = productsWithImages.rows.map(product => {
      const filename = product.image_url?.split('/').pop() || '';
      const exists = physicalFiles.includes(filename);

      return {
        id: product.id,
        productName: product.name,
        imageUrl: product.image_url,
        filename,
        exists,
        createdAt: product.created_at
      };
    });

    // Agregar archivos huérfanos (que existen físicamente pero no en BD)
    const orphanFiles = physicalFiles.filter(file => {
      return !images.some(img => img.filename === file);
    });

    const orphanImages = orphanFiles.map(file => ({
      id: null,
      productName: 'Archivo huérfano',
      imageUrl: `/images/products/${file}`,
      filename: file,
      exists: true,
      createdAt: null
    }));

    return NextResponse.json({
      success: true,
      images: [...images, ...orphanImages],
      totalImages: images.length + orphanImages.length,
      orphanCount: orphanImages.length
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener imágenes' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar imagen
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de acceso requerido' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const userCheck = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!userCheck.rows[0] || !userCheck.rows[0].is_admin) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const { filename, productId } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Nombre de archivo requerido' },
        { status: 400 }
      );
    }

    // Eliminar archivo físico
    const imagePath = path.join(process.cwd(), 'public', 'images', 'products', filename);

    try {
      await fs.unlink(imagePath);
    } catch (fileError) {
      console.log('No se pudo eliminar el archivo físico:', fileError);
    }

    // Si es un producto específico, actualizar la base de datos
    if (productId) {
      await query(
        'UPDATE products SET image_url = NULL WHERE id = $1',
        [productId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar imagen' },
      { status: 500 }
    );
  }
}
