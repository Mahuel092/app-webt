import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Actualizar imagen del iPhone con una URL que funciona
    const updateResult = await query(
      `UPDATE products
       SET image_url = $1
       WHERE name ILIKE '%iphone%'
       RETURNING id, name, image_url`,
      ['https://www.apple.com/newsroom/images/2023/09/apple-unveils-iphone-15-pro-and-iphone-15-pro-max/article/Apple-iPhone-15-Pro-lineup-hero-230912_Full-Bleed-Image.jpg.large.jpg']
    );

    // Verificar todos los productos actuales
    const allProducts = await query('SELECT id, name, image_url FROM products ORDER BY id');

    return NextResponse.json({
      success: true,
      message: 'Imagen del iPhone actualizada correctamente',
      updatedProducts: updateResult.rows,
      allProducts: allProducts.rows
    });

  } catch (error) {
    console.error('Error updating product images:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar imágenes' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Solo mostrar productos actuales
    const products = await query('SELECT id, name, image_url, price FROM products ORDER BY id');

    return NextResponse.json({
      success: true,
      products: products.rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}
