import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromToken, getTokenFromRequest } from '@/lib/auth';

// DELETE - Eliminar imagen del inicio (solo admin)
export async function DELETE(request: NextRequest, context: any) {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = Number.parseInt(context.params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    // Verificar que la imagen existe
    const existingImage = await query(
      'SELECT * FROM home_images WHERE id = $1',
      [id]
    );

    if (existingImage.rows.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Eliminar la imagen
    await query(
      'DELETE FROM home_images WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Home image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting home image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
