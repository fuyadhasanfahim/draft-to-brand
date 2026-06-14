export const BRAND = {
    name: 'Draft To Brand',
    tagline: 'From Draft To Brand',
    description: 'Digital Marketing & Brand Management Agency',
    mission:
        'We consult a brand from draft to brand — transforming ideas into memorable brands.',
    logo: process.env.NEXT_PUBLIC_BRAND_LOGO_URL!,
    url: process.env.NEXT_PUBLIC_APP_URL!,
    email: {
        from: process.env.RESEND_FROM_EMAIL!,
        replyTo: process.env.RESEND_REPLY_TO!,
        support: process.env.RESEND_REPLY_TO!,
    },
    colors: {
        primary: '#ff3131',
        primaryHover: '#e52b2b',
        dark: '#282a2a',
        background: '#fafaf9',
        surface: '#ffffff',
        border: '#e7e5e4',
        text: '#282a2a',
        mutedText: '#57534e',
    },
} as const;

export type Brand = typeof BRAND;
