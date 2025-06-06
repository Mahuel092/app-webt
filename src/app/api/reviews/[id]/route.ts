import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// DELETE - Eliminar reseña (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const reviewId = Number.parseInt(params.id);

    if (Number.isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, error: 'ID de reseña inválido' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM reviews WHERE id = $1 RETURNING *',
      [reviewId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar reseña' },
      { status: 500 }
    );
  }
}
