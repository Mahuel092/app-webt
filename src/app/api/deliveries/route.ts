import { type NextRequest, NextResponse } from 'next/server';
import { queryRows, query } from '@/lib/db';
import { getUserFromToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const deliveries = await queryRows(`
      SELECT
        d.id,
        d.user_id,
        d.product_id,
        d.estimated_delivery_time,
        d.status,
        d.progress,
        d.created_at,
        u.name as user_name,
        p.name as product_name,
        p.image_url as product_image
      FROM deliveries d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN products p ON d.product_id = p.id
      ORDER BY d.created_at DESC
    `);

    // Calcular progreso automáticamente para entregas pendientes
    const now = new Date().getTime();
    const updatedDeliveries = deliveries.map((delivery: any) => {
      if (delivery.status === 'pending') {
        const createdTime = new Date(delivery.created_at).getTime();
        const estimatedTime = new Date(delivery.estimated_delivery_time).getTime();
        const elapsed = now - createdTime;
        const total = estimatedTime - createdTime;

        if (elapsed >= total) {
          // Entrega completada
          return {
            ...delivery,
            status: 'delivered',
            progress: 100
          };
        } else {
          // Calcular progreso
          const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
          return {
            ...delivery,
            progress: Math.round(progress)
          };
        }
      }
      return delivery;
    });

    return NextResponse.json({
      success: true,
      deliveries: updatedDeliveries
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
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

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { product_id, delivery_time_minutes = 30 } = await request.json();

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Calcular tiempo estimado de entrega
    const estimatedDeliveryTime = new Date(Date.now() + delivery_time_minutes * 60000);

    const result = await query(
      'INSERT INTO deliveries (user_id, product_id, estimated_delivery_time, status, progress) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.userId, product_id, estimatedDeliveryTime, 'pending', 0]
    );

    const delivery = result.rows[0];

    return NextResponse.json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
