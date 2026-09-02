import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/dal';
import { getCloudinary, CLOUDINARY_FOLDER } from '@/lib/cloudinary';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export async function POST(request: Request) {
    const admin = await getCurrentAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
        return NextResponse.json(
            { error: 'Unsupported image type. Use JPEG, PNG, WebP, AVIF or GIF.' },
            { status: 415 },
        );
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json(
            { error: 'Image is larger than 5 MB.' },
            { status: 413 },
        );
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

        const result = await getCloudinary().uploader.upload(dataUri, {
            folder: CLOUDINARY_FOLDER,
            resource_type: 'image',
            overwrite: false,
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return NextResponse.json(
            { error: 'Upload failed. Try again.' },
            { status: 502 },
        );
    }
}
