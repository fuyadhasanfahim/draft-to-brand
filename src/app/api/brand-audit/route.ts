import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { brandAuditSubmissionSchema } from '@/lib/brand-audit-schema';
import { BrandAuditSubmissionModel } from '@/models/brand-audit-submission';

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = brandAuditSubmissionSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid submission.', issues: parsed.error.issues },
            { status: 400 },
        );
    }

    try {
        await connectDB();
        await BrandAuditSubmissionModel.create(parsed.data);
    } catch (error) {
        console.error('Failed to save brand audit submission:', error);
        return NextResponse.json(
            { error: 'Could not save your result right now.' },
            { status: 502 },
        );
    }

    return NextResponse.json({ ok: true });
}
