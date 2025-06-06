import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se encontró ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no permitido. Solo JPG, PNG y WEBP' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo es muy grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;

    // Subir a Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { data, error: uploadError } = await supabase
      .storage
      .from('product-images')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Error al subir la imagen a Supabase' },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { publicURL, error: urlError } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(fileName);

    if (urlError) {
      console.error('Supabase URL error:', urlError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener URL pública' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Imagen subida exitosamente',
      url: publicURL,
      fileName
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
