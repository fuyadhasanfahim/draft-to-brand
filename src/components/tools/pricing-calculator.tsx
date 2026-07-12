'use client';

import { Suspense, useCallback, useId, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { IconInfoCircle } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'bn';
type MktMode = 'percent' | 'fixed';
type OrderType = 'cod' | 'prepaid';

const COLORS: Record<string, string> = {
    cogs: '#282a2a',
    delivery: '#b8860b',
    operational: '#5c7a9a',
    marketing: '#ff3131',
    profit: '#1e7a4c',
};

function fmt(n: number) {
    return Math.round(n).toLocaleString('en-IN');
}

function toNum(value: string) {
    return value === '' ? 0 : parseFloat(value) || 0;
}

const copy = {
    en: {
        cards: {
            cost: { title: 'Step 1 | Product Cost', sub: 'How much it costs to make or source one unit' },
            delivery: {
                title: 'Step 2 | Delivery & Returns',
                sub: 'Courier cost, and the loss when an order gets returned',
            },
            operational: {
                title: 'Step 3 | Operational Cost',
                sub: 'Office, salaries, tools, the share that lands on each unit',
            },
            marketing: {
                title: 'Step 4 | Marketing & Profit',
                sub: 'How much of the selling price goes to ads, and how much profit you want to keep',
            },
            cpr: {
                title: 'Step 5 | Ads Manager Check (CPR)',
                sub: 'Pick your order type. The Max CPR number below is your limit.',
            },
        },
        fields: {
            cogs: { label: 'Product Cost (COGS)', hint: 'per unit' },
            packaging: { label: 'Packaging Cost', hint: 'per unit' },
            delivery: { label: 'Delivery Cost', hint: 'per order' },
            returnRate: { label: 'Return Rate', hint: 'avg %' },
            returnLoss: { label: 'Loss per Return', hint: 'round-trip delivery + packaging' },
            operational: { label: 'Operational Cost', hint: 'per unit (approx)' },
            mktPercent: { label: 'Marketing Cost', hint: '% of selling price' },
            mktFixed: { label: 'Marketing Cost', hint: 'per sale (CPA)' },
            profit: { label: 'Profit Margin', hint: '% of selling price' },
        },
        mktModeOptions: [
            { value: 'percent' as MktMode, label: '% of selling price' },
            { value: 'fixed' as MktMode, label: 'Fixed CPA (৳)' },
        ],
        orderTypeOptions: [
            { value: 'cod' as OrderType, label: 'COD' },
            { value: 'prepaid' as OrderType, label: 'Prepaid' },
        ],
        cprInfoTitle: 'What does CPR mean?',
        cprInfoBody:
            'CPR (Cost per Result) is the average amount Facebook Ads Manager spends to bring in one sale/order. Open Ads Manager and look for the "Cost per Result" column, that\'s the number to match against this.',
        resultLabel: 'Suggested Selling Price',
        breakeven: 'Lowest price (No profit)',
        profitPerUnit: 'Profit per unit',
        maxCprLabel: 'Max CPR (max you can spend)',
        breakdownTitle: 'Cost Breakdown',
        breakdownSub: 'Where each part of the selling price goes',
        partNames: {
            cogs: 'Product Cost (COGS + Packaging)',
            delivery: 'Delivery & Return Loss',
            operational: 'Operational Cost',
            marketing: 'Marketing Budget',
            profit: 'Profit',
        },
        warnPercent: 'Marketing % + Profit % add up to almost 100%, lower the percentages, otherwise the math breaks.',
        warnFixed: 'Profit margin is almost 100%, lower it a bit.',
        summaryTitle: 'Plain-English Summary',
    },
    bn: {
        cards: {
            cost: { title: 'ধাপ ১ | প্রোডাক্ট কস্ট', sub: 'প্রতি ইউনিট প্রোডাক্ট বানাতে/কিনতে কত খরচ হয়' },
            delivery: { title: 'ধাপ ২ | ডেলিভারি ও রিটার্ন', sub: 'কুরিয়ার কস্ট এবং রিটার্ন হলে যে লস হয়' },
            operational: {
                title: 'ধাপ ৩ | অপারেশনাল কস্ট',
                sub: 'অফিস, স্যালারি, টুলস, প্রতি ইউনিটে যতটুকু ভাগে পড়ে',
            },
            marketing: {
                title: 'ধাপ ৪ | মার্কেটিং ও প্রফিট',
                sub: 'Ads বাজেট বিক্রয়মূল্যের কত % রাখতে চাও, আর কত % প্রফিট রাখতে চাও',
            },
            cpr: {
                title: 'ধাপ ৫ | Ads Manager Check (CPR)',
                sub: 'Order type বসাও। নিচে যে Max CPR নাম্বার আসবে, সেটাই তোমার লিমিট।',
            },
        },
        fields: {
            cogs: { label: 'প্রোডাক্ট কস্ট (COGS)', hint: 'প্রতি পিস' },
            packaging: { label: 'প্যাকেজিং কস্ট', hint: 'প্রতি পিস' },
            delivery: { label: 'ডেলিভারি কস্ট', hint: 'প্রতি অর্ডার' },
            returnRate: { label: 'রিটার্ন রেট', hint: 'গড় %' },
            returnLoss: { label: 'রিটার্ন হলে লস', hint: 'যাওয়া-আসা ডেলিভারি + প্যাকেজিং' },
            operational: { label: 'অপারেশনাল কস্ট', hint: 'প্রতি পিস (approx)' },
            mktPercent: { label: 'মার্কেটিং কস্ট', hint: 'বিক্রয়মূল্যের %' },
            mktFixed: { label: 'মার্কেটিং কস্ট', hint: 'প্রতি সেল (CPA)' },
            profit: { label: 'প্রফিট মার্জিন', hint: 'বিক্রয়মূল্যের %' },
        },
        mktModeOptions: [
            { value: 'percent' as MktMode, label: 'বিক্রয়মূল্যের %' },
            { value: 'fixed' as MktMode, label: 'নির্দিষ্ট CPA (৳)' },
        ],
        orderTypeOptions: [
            { value: 'cod' as OrderType, label: 'COD' },
            { value: 'prepaid' as OrderType, label: 'Prepaid' },
        ],
        cprInfoTitle: 'CPR মানে কী?',
        cprInfoBody:
            'Facebook Ads Manager-এ প্রতিটা সেল/অর্ডার আনতে গড়ে কত টাকা খরচ হচ্ছে, সেটাই CPR (Cost per Result)। Ads Manager খুললে "Cost per Result" নামে একটা কলাম দেখবে, ওই নাম্বারটাই এর সাথে মিলাবে।',
        resultLabel: 'প্রস্তাবিত বিক্রয়মূল্য',
        breakeven: 'সর্বনিম্ন দাম (No profit)',
        profitPerUnit: 'ইউনিট প্রতি প্রফিট',
        maxCprLabel: 'Max CPR (প্রতি সেলে সর্বোচ্চ খরচ)',
        breakdownTitle: 'কস্ট ব্রেকডাউন',
        breakdownSub: 'বিক্রয়মূল্যের প্রতিটা অংশ কোথায় যাচ্ছে',
        partNames: {
            cogs: 'প্রোডাক্ট কস্ট (COGS + প্যাকেজিং)',
            delivery: 'ডেলিভারি ও রিটার্ন লস',
            operational: 'অপারেশনাল কস্ট',
            marketing: 'মার্কেটিং বাজেট',
            profit: 'প্রফিট',
        },
        warnPercent: 'মার্কেটিং % + প্রফিট % মিলিয়ে প্রায় ১০০% হয়ে যাচ্ছে, শতাংশ একটু কমাও, নাহলে হিসাব বসবে না।',
        warnFixed: 'প্রফিট মার্জিন প্রায় ১০০%, একটু কমাও।',
        summaryTitle: 'সহজ ভাষায় সামারি',
    },
} as const;

function resultFoot(lang: Lang, profitAmt: string, mktAmt: string) {
    return lang === 'en' ? (
        <>
            Sell at this price and you&apos;ll keep <b className="text-white">৳{profitAmt}</b> profit +{' '}
            <b className="text-white">৳{mktAmt}</b> marketing budget per unit
        </>
    ) : (
        <>
            এই দামে বিক্রি করলে <b className="text-white">৳{profitAmt}</b> প্রফিট +{' '}
            <b className="text-white">৳{mktAmt}</b> মার্কেটিং বাজেট প্রতি ইউনিটে থাকবে
        </>
    );
}

function summaryBody(lang: Lang, baseCost: string, sp: string, maxCpr: string) {
    return lang === 'en' ? (
        <>
            Your real cost to make/source this product (excluding marketing) is{' '}
            <b className="text-[color:var(--color-primary-text)]">৳{baseCost}</b>. Sell it at <b className="text-[color:var(--color-primary-text)]">৳{sp}</b>{' '}
            and you&apos;ll be in profit.
            <br />
            <br />
            👉 One number to remember: <b className="text-[color:var(--color-primary-text)]">Max CPR = ৳{maxCpr}</b>. That means if
            Facebook Ads Manager spends more than ৳{maxCpr} to bring in each sale (Result), you&apos;re losing
            money, pause the campaign and optimize. If CPR stays below that, you&apos;re profitable.
        </>
    ) : (
        <>
            এই প্রোডাক্ট বানাতে/আনতে তোমার আসল খরচ (মার্কেটিং বাদে) <b className="text-[color:var(--color-primary-text)]">৳{baseCost}</b>।
            এটা <b className="text-[color:var(--color-primary-text)]">৳{sp}</b> দামে বিক্রি করলে তুমি প্রফিটে থাকবে।
            <br />
            <br />
            👉 এখন মনে রাখার মতো একটাই নাম্বার: <b className="text-[color:var(--color-primary-text)]">Max CPR = ৳{maxCpr}</b>। মানে
            Facebook Ads Manager-এ প্রতিটা সেল (Result) আনতে যদি ৳{maxCpr}-এর বেশি খরচ হয়ে যায়, তাহলে বুঝবে
            তুমি লসে যাচ্ছ, ক্যাম্পেইন বন্ধ করে optimize করতে হবে। আর CPR যদি এর কম থাকে, তাহলে তুমি প্রফিটে
            আছ।
        </>
    );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
    return (
        <div className="inline-flex gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-1">
            {(['en', 'bn'] as const).map((l) => (
                <button
                    key={l}
                    type="button"
                    aria-pressed={lang === l}
                    onClick={() => onChange(l)}
                    className={cn(
                        'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                        lang === l ? 'bg-[color:var(--color-dark)] text-white' : 'text-muted hover:text-foreground',
                    )}
                >
                    {l === 'en' ? 'EN' : 'বাংলা'}
                </button>
            ))}
        </div>
    );
}

function Segmented<T extends string>({
    options,
    value,
    onChange,
}: {
    options: readonly { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="mb-4 flex gap-1 rounded-xl bg-[color:var(--color-surface)] p-1">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    aria-pressed={value === opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        'flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        value === opt.value
                            ? 'bg-[color:var(--color-dark)] text-white'
                            : 'text-muted hover:text-foreground',
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function Field({
    label,
    hint,
    prefix,
    suffix,
    value,
    onChange,
}: {
    label: string;
    hint?: string;
    prefix?: string;
    suffix?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
    const id = useId();
    return (
        <div className="mb-4">
            <label
                htmlFor={id}
                className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-foreground"
            >
                {label}
                {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
            </label>
            <div className="flex items-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition-colors focus-within:border-[color:var(--color-primary)] focus-within:bg-background">
                {prefix && (
                    <span className="flex items-center self-stretch border-r border-[color:var(--color-border)] px-3 font-medium text-muted">
                        {prefix}
                    </span>
                )}
                <input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={onChange}
                    min={0}
                    className="w-full min-w-0 bg-transparent px-3 py-2.5 text-[15px] font-semibold text-foreground outline-none! focus-visible:outline-none!"
                />
                {suffix && <span className="px-3 text-sm font-semibold text-muted">{suffix}</span>}
            </div>
        </div>
    );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
    return (
        <div className="rounded-3xl border border-[color:var(--color-border)] bg-background p-6 md:p-7">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--color-primary-text)]">
                {title}
            </h2>
            {sub && <p className="mb-5 text-sm text-muted">{sub}</p>}
            {children}
        </div>
    );
}

export function PricingCalculator() {
    return (
        <Suspense fallback={<PricingCalculatorView lang="en" onLangChange={() => {}} />}>
            <PricingCalculatorWithUrlLang />
        </Suspense>
    );
}

function PricingCalculatorWithUrlLang() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lang: Lang = searchParams.get('lang') === 'bn' ? 'bn' : 'en';

    const setLang = useCallback(
        (next: Lang) => {
            const params = new URLSearchParams(searchParams.toString());
            if (next === 'en') {
                params.delete('lang');
            } else {
                params.set('lang', next);
            }
            const query = params.toString();
            router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    return <PricingCalculatorView lang={lang} onLangChange={setLang} />;
}

function PricingCalculatorView({ lang, onLangChange }: { lang: Lang; onLangChange: (l: Lang) => void }) {
    const t = copy[lang];

    const [cogs, setCogs] = useState('100');
    const [packaging, setPackaging] = useState('15');
    const [delivery, setDelivery] = useState('70');
    const [returnRate, setReturnRate] = useState('12');
    const [returnLoss, setReturnLoss] = useState('140');
    const [operational, setOperational] = useState('20');
    const [mktMode, setMktMode] = useState<MktMode>('percent');
    const [mktPercent, setMktPercent] = useState('15');
    const [mktFixed, setMktFixed] = useState('120');
    const [profit, setProfit] = useState('20');
    const [orderType, setOrderType] = useState<OrderType>('cod');

    function handleOrderType(type: OrderType) {
        setOrderType(type);
        setReturnRate(type === 'cod' ? '12' : '3');
    }

    const result = useMemo(() => {
        const cogsNum = toNum(cogs);
        const packagingNum = toNum(packaging);
        const deliveryNum = toNum(delivery);
        const returnLossNum = toNum(returnLoss);
        const operationalNum = toNum(operational);
        const mktPercentNum = toNum(mktPercent);
        const mktFixedNum = toNum(mktFixed);

        const returnRatePct = toNum(returnRate) / 100;
        const profitPct = toNum(profit) / 100;
        const effDelivery = deliveryNum + returnRatePct * returnLossNum;
        const baseCost = cogsNum + packagingNum + effDelivery + operationalNum;

        let sp: number;
        let marketingBudget: number;
        let warn: string | null = null;

        if (mktMode === 'percent') {
            const mktPct = mktPercentNum / 100;
            const totalPct = mktPct + profitPct;
            if (totalPct >= 0.98) {
                warn = t.warnPercent;
                sp = baseCost / 0.02;
            } else {
                sp = baseCost / (1 - totalPct);
            }
            marketingBudget = sp * mktPct;
        } else {
            if (profitPct >= 0.98) {
                warn = t.warnFixed;
                sp = (baseCost + mktFixedNum) / 0.02;
            } else {
                sp = (baseCost + mktFixedNum) / (1 - profitPct);
            }
            marketingBudget = mktFixedNum;
        }

        const profitAmount = sp - baseCost - marketingBudget;
        const breakeven = baseCost + marketingBudget;
        const maxCpr = marketingBudget;

        const parts = [
            { name: t.partNames.cogs, value: cogsNum + packagingNum, color: COLORS.cogs },
            { name: t.partNames.delivery, value: effDelivery, color: COLORS.delivery },
            { name: t.partNames.operational, value: operationalNum, color: COLORS.operational },
            { name: t.partNames.marketing, value: marketingBudget, color: COLORS.marketing },
            { name: t.partNames.profit, value: profitAmount, color: COLORS.profit },
        ];

        return { sp, baseCost, profitAmount, breakeven, maxCpr, warn, parts };
    }, [cogs, packaging, delivery, returnRate, returnLoss, operational, mktMode, mktPercent, mktFixed, profit, t]);

    return (
        <div>
            <div className="mb-5 flex justify-end">
                <LangToggle lang={lang} onChange={onLangChange} />
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
                {/* INPUT COLUMN */}
                <div className="flex flex-col gap-5">
                    <Card title={t.cards.cost.title} sub={t.cards.cost.sub}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label={t.fields.cogs.label}
                                hint={t.fields.cogs.hint}
                                prefix="৳"
                                value={cogs}
                                onChange={(e) => setCogs(e.target.value)}
                            />
                            <Field
                                label={t.fields.packaging.label}
                                hint={t.fields.packaging.hint}
                                prefix="৳"
                                value={packaging}
                                onChange={(e) => setPackaging(e.target.value)}
                            />
                        </div>
                    </Card>

                    <Card title={t.cards.delivery.title} sub={t.cards.delivery.sub}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label={t.fields.delivery.label}
                                hint={t.fields.delivery.hint}
                                prefix="৳"
                                value={delivery}
                                onChange={(e) => setDelivery(e.target.value)}
                            />
                            <Field
                                label={t.fields.returnRate.label}
                                hint={t.fields.returnRate.hint}
                                suffix="%"
                                value={returnRate}
                                onChange={(e) => setReturnRate(e.target.value)}
                            />
                        </div>
                        <Field
                            label={t.fields.returnLoss.label}
                            hint={t.fields.returnLoss.hint}
                            prefix="৳"
                            value={returnLoss}
                            onChange={(e) => setReturnLoss(e.target.value)}
                        />
                    </Card>

                    <Card title={t.cards.operational.title} sub={t.cards.operational.sub}>
                        <Field
                            label={t.fields.operational.label}
                            hint={t.fields.operational.hint}
                            prefix="৳"
                            value={operational}
                            onChange={(e) => setOperational(e.target.value)}
                        />
                    </Card>

                    <Card title={t.cards.marketing.title} sub={t.cards.marketing.sub}>
                        <Segmented value={mktMode} onChange={setMktMode} options={t.mktModeOptions} />
                        {mktMode === 'percent' ? (
                            <Field
                                label={t.fields.mktPercent.label}
                                hint={t.fields.mktPercent.hint}
                                suffix="%"
                                value={mktPercent}
                                onChange={(e) => setMktPercent(e.target.value)}
                            />
                        ) : (
                            <Field
                                label={t.fields.mktFixed.label}
                                hint={t.fields.mktFixed.hint}
                                prefix="৳"
                                value={mktFixed}
                                onChange={(e) => setMktFixed(e.target.value)}
                            />
                        )}
                        <Field
                            label={t.fields.profit.label}
                            hint={t.fields.profit.hint}
                            suffix="%"
                            value={profit}
                            onChange={(e) => setProfit(e.target.value)}
                        />
                    </Card>

                    <Card title={t.cards.cpr.title} sub={t.cards.cpr.sub}>
                        <Segmented value={orderType} onChange={handleOrderType} options={t.orderTypeOptions} />
                        <div className="flex gap-2.5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm text-muted">
                            <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-[color:var(--color-primary)]" />
                            <p>
                                <b className="text-foreground">{t.cprInfoTitle}</b> {t.cprInfoBody}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* RESULT COLUMN */}
                <div className="lg:sticky lg:top-24">
                    <div className="relative overflow-hidden rounded-3xl bg-[color:var(--color-dark)] p-7 text-white">
                        <div aria-hidden className="glow-primary absolute -right-10 -top-16 h-56 w-56" />
                        <div className="relative text-xs font-semibold uppercase tracking-[0.12em] text-[#ff9d9d]">
                            {t.resultLabel}
                        </div>
                        <div className="text-display relative mt-2.5 flex items-baseline gap-2 text-5xl font-medium md:text-6xl">
                            <span className="text-2xl font-semibold text-[#ff9d9d]">৳</span>
                            {fmt(result.sp)}
                        </div>
                        <div className="relative mt-3.5 text-sm text-white/70">
                            {resultFoot(lang, fmt(result.profitAmount), fmt(result.maxCpr))}
                        </div>

                        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <div className="text-xs text-white/60">{t.breakeven}</div>
                                <div className="mt-1.5 text-lg font-semibold">৳{fmt(result.breakeven)}</div>
                            </div>
                            <div className="rounded-2xl border border-[#1e7a4c]/30 bg-[#1e7a4c]/15 p-4">
                                <div className="text-xs text-white/60">{t.profitPerUnit}</div>
                                <div className="mt-1.5 text-lg font-semibold text-[#5fd899]">
                                    ৳{fmt(result.profitAmount)}
                                </div>
                            </div>
                            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-1">
                                <div className="text-xs text-white/60">{t.maxCprLabel}</div>
                                <div className="mt-1.5 text-lg font-semibold">৳{fmt(result.maxCpr)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-3xl border border-[color:var(--color-border)] bg-background p-6 md:p-7">
                        <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--color-primary-text)]">
                            {t.breakdownTitle}
                        </h2>
                        <p className="mb-5 text-sm text-muted">{t.breakdownSub}</p>

                        <div className="mb-4 flex h-2.5 overflow-hidden rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                            {result.parts.map((p) => (
                                <div
                                    key={p.name}
                                    style={{
                                        width: `${result.sp > 0 ? Math.max((p.value / result.sp) * 100, 0) : 0}%`,
                                        background: p.color,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="flex flex-col">
                            {result.parts.map((p) => {
                                const pct = result.sp > 0 ? (p.value / result.sp) * 100 : 0;
                                return (
                                    <div key={p.name} className="flex items-center gap-3 py-2">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ background: p.color }}
                                        />
                                        <span className="flex-1 text-sm text-muted">{p.name}</span>
                                        <span className="min-w-[70px] text-right text-sm font-semibold text-foreground">
                                            ৳{fmt(p.value)}
                                        </span>
                                        <span className="min-w-[42px] text-right text-xs font-semibold text-muted">
                                            {pct.toFixed(0)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {result.warn && (
                            <div className="mt-4 rounded-xl border border-[#f3d48a] bg-[#fff7e6] px-4 py-3 text-sm text-[#7a5b00]">
                                {result.warn}
                            </div>
                        )}

                        <div className="mt-5 rounded-2xl border border-[#f6c7c9] bg-[#ff3131]/6 p-5 text-sm leading-relaxed text-[#5c1417]">
                            <div className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--color-primary-text)]">
                                {t.summaryTitle}
                            </div>
                            {summaryBody(lang, fmt(result.baseCost), fmt(result.sp), fmt(result.maxCpr))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
