import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromToken, getTokenFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const deliveryId = Number.parseInt(context.params.id);

    if (isNaN(deliveryId)) {
      return NextResponse.json(
        { error: 'Invalid delivery ID' },
        { status: 400 }
      );
    }

    const { estimated_delivery_time, status, progress } = await request.json();

    const result = await query(
      'UPDATE deliveries SET estimated_delivery_time = $1, status = $2, progress = $3 WHERE id = $4 RETURNING *',
      [estimated_delivery_time, status, progress, deliveryId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const delivery = result.rows[0];

    return NextResponse.json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const deliveryId = Number.parseInt(context.params.id);

    if (isNaN(deliveryId)) {
      return NextResponse.json(
        { error: 'Invalid delivery ID' },
        { status: 400 }
      );
    }

    // Verificar que la entrega existe antes de eliminarla
    const existingDelivery = await query(
      'SELECT * FROM deliveries WHERE id = $1',
      [deliveryId]
    );

    if (existingDelivery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Eliminar la entrega
    await query(
      'DELETE FROM deliveries WHERE id = $1',
      [deliveryId]
    );

    return NextResponse.json({
      success: true,
      message: 'Delivery deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
