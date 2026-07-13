import { Schema, model, models, type InferSchemaType } from 'mongoose';
import { brandAuditCategories } from '@/lib/brand-audit-schema';

const categoryBreakdownSchema = new Schema(
    {
        category: { type: String, enum: brandAuditCategories, required: true },
        percent: { type: Number, min: 0, max: 100, required: true },
    },
    { _id: false },
);

const brandAuditSubmissionSchema = new Schema(
    {
        name: { type: String, trim: true, maxlength: 120, default: '' },
        businessType: { type: String, trim: true, maxlength: 120, default: '' },
        phone: { type: String, trim: true, required: true, index: true },
        lang: { type: String, enum: ['en', 'bn'], required: true },
        score: { type: Number, min: 0, max: 100, required: true },
        answers: {
            type: [Number],
            required: true,
            validate: {
                validator: (value: number[]) => value.length === 15,
                message: 'answers must contain exactly 15 entries.',
            },
        },
        categoryBreakdown: { type: [categoryBreakdownSchema], required: true },
        weakCategories: [{ type: String, enum: brandAuditCategories }],
    },
    { timestamps: true },
);

export type BrandAuditSubmission = InferSchemaType<typeof brandAuditSubmissionSchema>;

export const BrandAuditSubmissionModel =
    models.BrandAuditSubmission ?? model('BrandAuditSubmission', brandAuditSubmissionSchema);
