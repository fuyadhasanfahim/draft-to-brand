/**
 * Shared ad-token config used by the blog editor toolbar and the renderer.
 * Tokens in post content: `[[ad]]`, `[[ad:adsense]]`, `[[ad:adsterra]]`
 * (= native), or `[[ad:adsterra:<size>]]` for a fixed Adsterra banner.
 */

export const ADSTERRA_BANNER_SIZES = {
    "300x250": { w: 300, h: 250 },
    "468x60": { w: 468, h: 60 },
    "728x90": { w: 728, h: 90 },
    "320x50": { w: 320, h: 50 },
    "160x300": { w: 160, h: 300 },
    "160x600": { w: 160, h: 600 },
} as const;

export type AdsterraBannerSize = keyof typeof ADSTERRA_BANNER_SIZES;

/** Buttons shown above the content editor. Order = recommended usage. */
export const AD_INSERT_OPTIONS: {
    token: string;
    label: string;
    hint: string;
}[] = [
    {
        token: "[[ad]]",
        label: "AdSense",
        hint: "Google in-article. Best spot — put it near the top, after the intro.",
    },
    {
        token: "[[ad:adsterra:native]]",
        label: "Adsterra · Native",
        hint: "Blends with the text. Good for mid-article.",
    },
    {
        token: "[[ad:adsterra:300x250]]",
        label: "Adsterra · 300×250",
        hint: "Medium rectangle. In-content or end of article.",
    },
    {
        token: "[[ad:adsterra:468x60]]",
        label: "Adsterra · 468×60",
        hint: "Small banner. Between sections.",
    },
    {
        token: "[[ad:adsterra:728x90]]",
        label: "Adsterra · 728×90",
        hint: "Leaderboard. Desktop-width only; scrolls on mobile.",
    },
    {
        token: "[[ad:adsterra:320x50]]",
        label: "Adsterra · 320×50",
        hint: "Mobile banner size.",
    },
    {
        token: "[[ad:adsterra:160x600]]",
        label: "Adsterra · 160×600",
        hint: "Skyscraper — a sidebar size, looks odd inside article text.",
    },
    {
        token: "[[ad:adsterra:160x300]]",
        label: "Adsterra · 160×300",
        hint: "Half-skyscraper — a sidebar size, looks odd inside article text.",
    },
];
