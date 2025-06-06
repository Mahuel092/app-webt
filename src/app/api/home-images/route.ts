import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromToken, getTokenFromRequest } from '@/lib/auth';

// GET - Obtener todas las imágenes del inicio
export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM home_images ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      images: result.rows
    });
  } catch (error) {
    console.error('Error fetching home images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Agregar nueva imagen del inicio (solo admin)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { image_url, title, description } = await request.json();

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO home_images (image_url, title, description, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [image_url, title || '', description || '']
    );

    return NextResponse.json({
      success: true,
      image: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding home image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
