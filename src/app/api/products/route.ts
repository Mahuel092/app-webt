import { type NextRequest, NextResponse } from 'next/server';
import { queryRows, query } from '@/lib/db';
import { getUserFromToken, getTokenFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const products = await queryRows(
      'SELECT id, name, price, image_url, youtube_url, created_at, updated_at FROM products ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { name, price, image_url, youtube_url } = await request.json();

    if (!name || !price || !image_url || !youtube_url) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO products (name, price, image_url, youtube_url, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
      [name, price, image_url, youtube_url]
    );

    const product = result.rows[0];

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
