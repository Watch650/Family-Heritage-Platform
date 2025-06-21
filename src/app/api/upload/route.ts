import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.formData();
    const file = data.get('photo');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid or missing file' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'upload');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const filename = `${timestamp}.${safeExtension}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const optimizedBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat('jpeg', { quality: 80 })
      .toBuffer();

    await writeFile(filepath, optimizedBuffer);

    return NextResponse.json({
      filename,
      url: `/upload/${filename}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}