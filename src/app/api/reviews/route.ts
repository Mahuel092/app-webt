import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Crear tabla de reseñas si no existe
async function ensureReviewsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    )
  `;

  await query(createTableQuery);
}

// GET - Obtener reseñas
export async function GET(request: NextRequest) {
  try {
    await ensureReviewsTable();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    let reviewsQuery;
    let params: any[] = [];

    if (productId) {
      // Reseñas de un producto específico
      reviewsQuery = `
        SELECT
          r.id,
          r.user_id,
          r.product_id,
          r.rating,
          r.comment,
          r.created_at,
          r.updated_at,
          u.name as user_name,
          p.name as product_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
        WHERE r.product_id = $1
        ORDER BY r.created_at DESC
      `;
      params = [productId];
    } else {
      // Todas las reseñas
      reviewsQuery = `
        SELECT
          r.id,
          r.user_id,
          r.product_id,
          r.rating,
          r.comment,
          r.created_at,
          r.updated_at,
          u.name as user_name,
          p.name as product_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
        ORDER BY r.created_at DESC
      `;
    }

    const result = await query(reviewsQuery, params);

    // Calcular estadísticas si es para un producto específico
    let stats = null;
    if (productId) {
      const statsQuery = `
        SELECT
          COUNT(*) as total_reviews,
          AVG(rating)::NUMERIC(3,2) as average_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
        FROM reviews
        WHERE product_id = $1
      `;
      const statsResult = await query(statsQuery, [productId]);
      stats = statsResult.rows[0];
    }

    return NextResponse.json({
      success: true,
      reviews: result.rows,
      stats
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener reseñas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva reseña
export async function POST(request: NextRequest) {
  try {
    await ensureReviewsTable();

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

    const { product_id, rating, comment } = await request.json();

    // Validaciones
    if (!product_id || !rating) {
      return NextResponse.json(
        { success: false, error: 'product_id y rating son requeridos' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'La calificación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    // Verificar que el usuario haya comprado el producto (opcional)
    const purchaseCheck = await query(
      'SELECT COUNT(*) FROM deliveries WHERE user_id = $1 AND product_id = $2',
      [decoded.userId, product_id]
    );

    if (Number(purchaseCheck.rows[0].count) === 0) {
      return NextResponse.json(
        { success: false, error: 'Debes haber comprado el producto para reseñarlo' },
        { status: 400 }
      );
    }

    // Insertar o actualizar reseña
    const reviewQuery = `
      INSERT INTO reviews (user_id, product_id, rating, comment, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await query(reviewQuery, [decoded.userId, product_id, rating, comment || null]);

    return NextResponse.json({
      success: true,
      message: 'Reseña guardada exitosamente',
      review: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar reseña' },
      { status: 500 }
    );
  }
}
