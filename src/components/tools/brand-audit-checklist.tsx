'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { IconArrowUpRight, IconBrandWhatsapp, IconCheck } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/site';

type Lang = 'en' | 'bn';
type Cat = 'brand' | 'social' | 'content' | 'ads' | 'trust';
type Stage = 'intro' | 'quiz' | 'results';
type VerdictKey = 'weak' | 'avg' | 'strong';

type Option = { label: string; pts: number };
type QuestionData = { cat: Cat; text: string; options: Option[] };

const CATS: Cat[] = ['brand', 'social', 'content', 'ads', 'trust'];

const catNames: Record<Lang, Record<Cat, string>> = {
    en: {
        brand: 'Branding & Visual Identity',
        social: 'Social Media Presence',
        content: 'Content & Communication',
        ads: 'Ads & Sales Tracking',
        trust: 'Trust Signals',
    },
    bn: {
        brand: 'ব্র্যান্ডিং ও ভিজ্যুয়াল আইডেন্টিটি',
        social: 'সোশ্যাল মিডিয়া উপস্থিতি',
        content: 'কন্টেন্ট ও কমিউনিকেশন',
        ads: 'বিজ্ঞাপন ও সেলস ট্র্যাকিং',
        trust: 'ট্রাস্ট সিগন্যাল',
    },
};

const questionsData: Record<Lang, QuestionData[]> = {
    en: [
        {
            cat: 'brand',
            text: "How's your page/website's logo and cover photo?",
            options: [
                { label: 'Professionally designed, looks clean', pts: 2 },
                { label: 'Made myself or for free, gets by', pts: 1 },
                { label: 'None, or old / low-quality', pts: 0 },
            ],
        },
        {
            cat: 'brand',
            text: 'How consistent are your colors & fonts across page, packaging, invoices?',
            options: [
                { label: 'Same colors and fonts everywhere', pts: 2 },
                { label: 'Somewhat consistent, not fully', pts: 1 },
                { label: "Different everywhere, never noticed", pts: 0 },
            ],
        },
        {
            cat: 'brand',
            text: 'Can a customer describe your brand in one line?',
            options: [
                { label: 'Yes, a clear tagline/description is written', pts: 2 },
                { label: "It's in my head, but not written anywhere", pts: 1 },
                { label: 'Honestly never thought about it', pts: 0 },
            ],
        },
        {
            cat: 'social',
            text: 'Roughly how often did you post in the last 30 days?',
            options: [
                { label: '3-4+ times a week, regularly', pts: 2 },
                { label: '1-2 times a week', pts: 1 },
                { label: 'Irregular, a handful of times a month', pts: 0 },
            ],
        },
        {
            cat: 'social',
            text: 'How long does it usually take to reply to a customer message?',
            options: [
                { label: 'Within a few minutes', pts: 2 },
                { label: 'Within a few hours', pts: 1 },
                { label: 'A day or more', pts: 0 },
            ],
        },
        {
            cat: 'social',
            text: 'What are your product/service photos usually like?',
            options: [
                { label: 'Professional photoshoot or edited', pts: 2 },
                { label: 'Taken in good light on a phone', pts: 1 },
                { label: 'Taken however, no editing', pts: 0 },
            ],
        },
        {
            cat: 'content',
            text: 'Do your product posts include price, size and delivery time?',
            options: [
                { label: 'Yes, all details together', pts: 2 },
                { label: 'Only the price', pts: 1 },
                { label: 'No, have to ask in comments/inbox', pts: 0 },
            ],
        },
        {
            cat: 'content',
            text: 'How much do you share customer reviews or testimonials?',
            options: [
                { label: 'Regularly share in posts/stories', pts: 2 },
                { label: 'Sometimes', pts: 1 },
                { label: 'Never shared', pts: 0 },
            ],
        },
        {
            cat: 'content',
            text: "What's your experience making reels or short-video content?",
            options: [
                { label: 'Make them regularly, good response', pts: 2 },
                { label: 'Tried a few times', pts: 1 },
                { label: 'Never made any', pts: 0 },
            ],
        },
        {
            cat: 'ads',
            text: "What's your experience with paid ads (boost / Meta ads)?",
            options: [
                { label: 'Run them regularly, understand results roughly', pts: 2 },
                { label: "Boosted sometimes, not sure if it works", pts: 1 },
                { label: 'Never run any', pts: 0 },
            ],
        },
        {
            cat: 'ads',
            text: "What's the state of your Facebook Pixel or conversion tracking?",
            options: [
                { label: 'Set up, data coming in properly', pts: 2 },
                { label: "Set up, but not sure it's working right", pts: 1 },
                { label: "Not sure what that even is", pts: 0 },
            ],
        },
        {
            cat: 'ads',
            text: 'How do you keep track of orders and sales data?',
            options: [
                { label: 'Keep it in Excel or a system, regularly', pts: 2 },
                { label: 'In a notebook or in my head, not always written', pts: 1 },
                { label: "Don't track it separately at all", pts: 0 },
            ],
        },
        {
            cat: 'trust',
            text: 'How can a customer contact you directly?',
            options: [
                { label: 'Phone, address, email — all clearly listed', pts: 2 },
                { label: 'Just a phone number listed', pts: 1 },
                { label: 'No direct contact info at all', pts: 0 },
            ],
        },
        {
            cat: 'trust',
            text: 'How is your delivery & return policy communicated?',
            options: [
                { label: 'Clearly written on page/website', pts: 2 },
                { label: 'Tell customers if they ask', pts: 1 },
                { label: 'No specific policy at all', pts: 0 },
            ],
        },
        {
            cat: 'trust',
            text: 'How are payment options (COD, bKash, Nagad) shown?',
            options: [
                { label: 'All options clearly written on page', pts: 2 },
                { label: 'Only COD active, mention rest if asked', pts: 1 },
                { label: "Not mentioned anywhere, have to ask in inbox", pts: 0 },
            ],
        },
    ],
    bn: [
        {
            cat: 'brand',
            text: 'আপনার পেজ/ওয়েবসাইটের লোগো ও কভার ফটো কেমন?',
            options: [
                { label: 'প্রফেশনালি ডিজাইন করা, দেখতে ক্লিন', pts: 2 },
                { label: 'নিজে বা ফ্রিতে বানানো, মোটামুটি চলে', pts: 1 },
                { label: 'নাই, অথবা অনেক পুরনো/লো-কোয়ালিটি', pts: 0 },
            ],
        },
        {
            cat: 'brand',
            text: 'পেজ, প্যাকেজিং, ইনভয়েসে কালার-ফন্ট কতটা মেলে?',
            options: [
                { label: 'সব জায়গায় একই কালার-ফন্ট ব্যবহার করি', pts: 2 },
                { label: 'কিছুটা মেলে, পুরোপুরি না', pts: 1 },
                { label: 'প্রতি জায়গায় আলাদা, কখনো খেয়াল করিনি', pts: 0 },
            ],
        },
        {
            cat: 'brand',
            text: 'কাস্টমারকে এক কথায় আপনার ব্র্যান্ড কী বোঝাতে পারেন?',
            options: [
                { label: 'হ্যাঁ, একটা স্পষ্ট ট্যাগলাইন/পরিচিতি লেখা আছে', pts: 2 },
                { label: 'মাথায় আছে, কিন্তু কোথাও লেখা নাই', pts: 1 },
                { label: 'এটা নিয়ে আসলে ভাবিনি', pts: 0 },
            ],
        },
        {
            cat: 'social',
            text: 'গত ৩০ দিনে পেজে কতবার পোস্ট করেছেন মোটামুটি?',
            options: [
                { label: 'সপ্তাহে ৩-৪ বা তার বেশি, নিয়মিত', pts: 2 },
                { label: 'সপ্তাহে ১-২ বার', pts: 1 },
                { label: 'অনিয়মিত, মাসে হাতে গোনা কয়েকবার', pts: 0 },
            ],
        },
        {
            cat: 'social',
            text: 'কাস্টমার মেসেজ দিলে সাধারণত রিপ্লাই করতে কতক্ষণ লাগে?',
            options: [
                { label: 'কয়েক মিনিটের মধ্যে', pts: 2 },
                { label: 'কয়েক ঘণ্টার মধ্যে', pts: 1 },
                { label: 'একদিন বা তার বেশি সময় লাগে', pts: 0 },
            ],
        },
        {
            cat: 'social',
            text: 'প্রোডাক্ট/সার্ভিসের ছবি সাধারণত কেমন হয়?',
            options: [
                { label: 'প্রফেশনাল ফটোশ্যুট বা এডিট করা', pts: 2 },
                { label: 'ফোনে ভালো লাইটে তোলা', pts: 1 },
                { label: 'যেমন-তেমনভাবে তোলা, এডিট করি না', pts: 0 },
            ],
        },
        {
            cat: 'content',
            text: 'প্রোডাক্ট পোস্টে দাম, সাইজ, ডেলিভারি সময় লেখা থাকে কি?',
            options: [
                { label: 'হ্যাঁ, সব ডিটেইল একসাথে লেখা থাকে', pts: 2 },
                { label: 'শুধু দামটা লেখা থাকে', pts: 1 },
                { label: 'না, কমেন্ট/ইনবক্সে জিজ্ঞেস করতে হয়', pts: 0 },
            ],
        },
        {
            cat: 'content',
            text: 'কাস্টমার রিভিউ বা টেস্টিমোনিয়াল কতটা শেয়ার করেন?',
            options: [
                { label: 'নিয়মিত পোস্ট/স্টোরিতে শেয়ার করি', pts: 2 },
                { label: 'মাঝে মাঝে করি', pts: 1 },
                { label: 'কখনো শেয়ার করিনি', pts: 0 },
            ],
        },
        {
            cat: 'content',
            text: 'রিলস বা শর্ট ভিডিও কন্টেন্ট বানানোর অভিজ্ঞতা কেমন?',
            options: [
                { label: 'নিয়মিত বানাই, ভালো রেসপন্স পাই', pts: 2 },
                { label: 'মাঝে মাঝে ট্রাই করেছি', pts: 1 },
                { label: 'কখনো বানানো হয়নি', pts: 0 },
            ],
        },
        {
            cat: 'ads',
            text: 'পেইড অ্যাড (বুস্ট/মেটা অ্যাড) নিয়ে অভিজ্ঞতা কেমন?',
            options: [
                { label: 'নিয়মিত চালাই, রেজাল্ট মোটামুটি বুঝি', pts: 2 },
                { label: 'মাঝে মাঝে বুস্ট করেছি, ঠিক জানি না কাজ করে কিনা', pts: 1 },
                { label: 'কখনো চালাইনি', pts: 0 },
            ],
        },
        {
            cat: 'ads',
            text: 'Facebook Pixel বা কনভার্শন ট্র্যাকিং সম্পর্কে অবস্থা কী?',
            options: [
                { label: 'সেটআপ করা আছে, ডেটা আসছে ঠিকমতো', pts: 2 },
                { label: 'সেটআপ করেছি, কিন্তু ঠিকমতো কাজ করছে কিনা শিওর না', pts: 1 },
                { label: 'এটা আসলে কী জিনিস, ঠিক জানি না', pts: 0 },
            ],
        },
        {
            cat: 'ads',
            text: 'অর্ডার/সেলস ডেটা কীভাবে রাখেন?',
            options: [
                { label: 'এক্সেল বা কোনো সিস্টেমে নিয়মিত রাখি', pts: 2 },
                { label: 'খাতায় বা মাথায় রাখি, লিখে রাখা হয় না সবসময়', pts: 1 },
                { label: 'আলাদা করে কোনো ট্র্যাকিং করি না', pts: 0 },
            ],
        },
        {
            cat: 'trust',
            text: 'কাস্টমার আপনার সাথে সরাসরি কীভাবে যোগাযোগ করতে পারে?',
            options: [
                { label: 'ফোন, ঠিকানা, ইমেইল — সবই স্পষ্ট করে দেওয়া আছে', pts: 2 },
                { label: 'শুধু একটা ফোন নাম্বার দেওয়া আছে', pts: 1 },
                { label: 'সরাসরি কোনো যোগাযোগ তথ্য নাই', pts: 0 },
            ],
        },
        {
            cat: 'trust',
            text: 'ডেলিভারি ও রিটার্ন নিয়ে পলিসি কীভাবে জানানো হয়?',
            options: [
                { label: 'পেজ/ওয়েবসাইটে স্পষ্ট করে লেখা আছে', pts: 2 },
                { label: 'কাস্টমার জিজ্ঞেস করলে বলে দিই', pts: 1 },
                { label: 'এই নিয়ে কোনো নির্দিষ্ট পলিসিই নাই', pts: 0 },
            ],
        },
        {
            cat: 'trust',
            text: 'পেমেন্ট অপশন (COD, বিকাশ, নগদ) কীভাবে দেখানো হয়?',
            options: [
                { label: 'সব অপশন পেজে স্পষ্ট করে লেখা আছে', pts: 2 },
                { label: 'শুধু COD চালু, বাকি বললে বলি', pts: 1 },
                { label: 'কোথাও উল্লেখ নাই, ইনবক্সে বলতে হয়', pts: 0 },
            ],
        },
    ],
};

const generalTips: Record<Lang, string[]> = {
    en: [
        'Review your profile/cover photo at least once a month to make sure it still looks up to date.',
        'Pick a fixed day and time to post — consistency helps with the algorithm too.',
        'Screenshot a good customer review the moment you get it, it will come in handy later.',
    ],
    bn: [
        'প্রোফাইল/কভার ফটো মাসে অন্তত একবার রিভিউ করে দেখুন এখনো আপ-টু-ডেট আছে কিনা।',
        'একটা নির্দিষ্ট দিন-সময় ঠিক করে নিন পোস্ট করার জন্য — নিয়মিততা এলগরিদমেও ভালো প্রভাব ফেলে।',
        'কাস্টমারের একটা ভালো রিভিউ পেলে সাথে সাথে স্ক্রিনশট রেখে দিন, পরে কাজে লাগবে।',
    ],
};

const flagInsights: Record<Lang, Record<Cat, { title: string; text: string }>> = {
    en: {
        brand: {
            title: 'Inconsistent visual identity',
            text: "Your brand's visual elements (logo, color, font) feel different from place to place. That can make the brand feel less than fully professional to customers.",
        },
        social: {
            title: 'Gap in social media engagement',
            text: 'There are some gaps in posting frequency or response time, which can affect reach and customer conversion.',
        },
        content: {
            title: 'Low trust signals in content',
            text: 'Without enough product information or social proof (reviews/video), new customers may hesitate before buying.',
        },
        ads: {
            title: 'Weak ad and data tracking',
            text: "Even when you run ads, without proper tracking set up it's hard to know where a big chunk of the budget is going.",
        },
        trust: {
            title: 'Gap in trust signals',
            text: "When contact info, policy or payment options aren't clear, many customers back out before ordering.",
        },
    },
    bn: {
        brand: {
            title: 'ভিজ্যুয়াল আইডেন্টিটিতে অসামঞ্জস্যতা',
            text: 'আপনার ব্র্যান্ডের ভিজ্যুয়াল এলিমেন্টগুলো (লোগো, কালার, ফন্ট) জায়গাভেদে আলাদা আলাদা মনে হচ্ছে। এতে কাস্টমারের কাছে ব্র্যান্ডটা পুরোপুরি প্রফেশনাল মনে নাও হতে পারে।',
        },
        social: {
            title: 'সোশ্যাল মিডিয়া এনগেজমেন্টে গ্যাপ',
            text: 'পোস্টিং ফ্রিকোয়েন্সি বা রেসপন্স টাইমে কিছু জায়গায় ঘাটতি দেখা যাচ্ছে, যা reach ও কাস্টমার কনভার্শনে প্রভাব ফেলতে পারে।',
        },
        content: {
            title: 'কন্টেন্টে বিশ্বাসযোগ্যতার সংকেত কম',
            text: 'প্রোডাক্ট ইনফরমেশন বা সোশ্যাল প্রুফ (রিভিউ/ভিডিও) পর্যাপ্ত না থাকায় নতুন কাস্টমার কেনার আগে দ্বিধায় পড়তে পারে।',
        },
        ads: {
            title: 'বিজ্ঞাপন ও ডেটা ট্র্যাকিং দুর্বল',
            text: 'অ্যাড চালালেও সঠিক ট্র্যাকিং সেটআপ না থাকলে বাজেটের একটা বড় অংশ কোথায় যাচ্ছে বোঝা কঠিন হয়ে যায়।',
        },
        trust: {
            title: 'ট্রাস্ট সিগন্যালে ঘাটতি',
            text: 'যোগাযোগ তথ্য, পলিসি বা পেমেন্ট অপশন স্পষ্ট না থাকলে অনেক কাস্টমার অর্ডার দেওয়ার আগেই পিছিয়ে যায়।',
        },
    },
};

const copy = {
    en: {
        nameLabel: 'Your business name',
        namePlaceholder: "e.g. Raha's Fashion House",
        typeLabel: 'Business type',
        typePlaceholder: 'e.g. Fashion / Food / Health product',
        phoneLabel: 'WhatsApp / mobile number',
        phonePlaceholder: 'e.g. 01XXXXXXXXX',
        phoneError: 'Enter a valid 11-digit number, starting with 01.',
        startBtn: 'Start Audit',
        progress: (n: number, total: number) => `Question ${n}/${total}`,
        backBtn: 'Previous',
        nextBtn: 'Next',
        seeResults: 'See Results',
        verdict: {
            weak: { label: 'Weak brand foundation', sub: 'The basics of your brand need attention right now.' },
            avg: {
                label: 'Average brand presence',
                sub: 'The foundation is there — strengthening a few areas will make a big difference.',
            },
            strong: {
                label: 'Strong brand presence',
                sub: 'Great! Time to scale — focus on ads and conversion now.',
            },
        } as Record<VerdictKey, { label: string; sub: string }>,
        scoreLabel: 'Brand Score',
        tipsTitle: 'A few small tips you can try today:',
        flagsTitle: 'Where the biggest gaps were found:',
        flagsNote: 'The exact causes and fixes differ by business type. Get the details in a consultation below.',
        ctaTitle: 'Want to talk about your results?',
        ctaBody:
            'Get a free 15-minute consultation from Draft to Brand — learn how to fix what was found and raise your brand score.',
        waBtn: 'Send Results via WhatsApp',
        restartBtn: 'Retake Audit',
        footer: 'This result gives an initial impression, not a full audit report.',
        notProvided: '(not provided)',
        wa: {
            intro: 'I came from the Brand Audit Tool.',
            name: 'Business name',
            type: 'Business type',
            phone: 'My number',
            score: 'Brand score',
            weak: 'Weak areas',
            closing: "I'd like a free consultation about this.",
        },
    },
    bn: {
        nameLabel: 'আপনার বিজনেসের নাম',
        namePlaceholder: "যেমন: রাহা'স ফ্যাশন হাউজ",
        typeLabel: 'বিজনেস টাইপ',
        typePlaceholder: 'যেমন: ফ্যাশন / ফুড / হেলথ প্রোডাক্ট',
        phoneLabel: 'হোয়াটসঅ্যাপ/মোবাইল নাম্বার',
        phonePlaceholder: 'যেমন: 01XXXXXXXXX',
        phoneError: 'সঠিক ১১ ডিজিটের নাম্বার দিন (01 দিয়ে শুরু)।',
        startBtn: 'অডিট শুরু করুন',
        progress: (n: number, total: number) => `প্রশ্ন ${n}/${total}`,
        backBtn: 'আগের প্রশ্ন',
        nextBtn: 'পরের প্রশ্ন',
        seeResults: 'রেজাল্ট দেখুন',
        verdict: {
            weak: { label: 'দুর্বল ব্র্যান্ড ফাউন্ডেশন', sub: 'ব্র্যান্ডের বেসিক জায়গাগুলোতে এখনই নজর দেওয়া দরকার।' },
            avg: {
                label: 'গড় মানের ব্র্যান্ড উপস্থিতি',
                sub: 'ভিত্তি আছে, তবে কিছু জায়গা শক্তিশালী করলে বড় পার্থক্য আসবে।',
            },
            strong: {
                label: 'শক্তিশালী ব্র্যান্ড প্রেজেন্স',
                sub: 'দারুণ! এখন স্কেল করার সময় — অ্যাড ও কনভার্শনে ফোকাস করুন।',
            },
        } as Record<VerdictKey, { label: string; sub: string }>,
        scoreLabel: 'ব্র্যান্ড স্কোর',
        tipsTitle: 'কিছু ছোট টিপস, আজই ট্রাই করতে পারেন:',
        flagsTitle: 'যেখানে বড় গ্যাপ পাওয়া গেছে:',
        flagsNote:
            'এই সমস্যাগুলোর নির্দিষ্ট কারণ এবং সমাধানের ধাপ আলাদা আলাদা হয় — বিজনেস টাইপ অনুযায়ী। নিচের কনসালটেশনে বিস্তারিত জেনে নিতে পারেন।',
        ctaTitle: 'রেজাল্ট নিয়ে কথা বলতে চান?',
        ctaBody:
            'Draft to Brand থেকে ফ্রি ১৫ মিনিটের কনসালটেশনে জেনে নিন — কীভাবে চিহ্নিত সমস্যাগুলো ঠিক করে ব্র্যান্ড স্কোর বাড়ানো যায়।',
        waBtn: 'হোয়াটসঅ্যাপে রেজাল্ট পাঠান',
        restartBtn: 'আবার অডিট করুন',
        footer: 'এই রেজাল্ট একটা প্রাথমিক ধারণা দেয়, সম্পূর্ণ অডিট রিপোর্ট নয়।',
        notProvided: '(লেখা হয়নি)',
        wa: {
            intro: 'আমি Brand Audit Tool থেকে এসেছি।',
            name: 'বিজনেসের নাম',
            type: 'বিজনেস টাইপ',
            phone: 'আমার নাম্বার',
            score: 'ব্র্যান্ড স্কোর',
            weak: 'দুর্বল জায়গা',
            closing: 'আমি এই বিষয়ে একটা ফ্রি কনসালটেশন চাই।',
        },
    },
} as const;

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

function verdictKey(pct: number): VerdictKey {
    if (pct < 40) return 'weak';
    if (pct < 70) return 'avg';
    return 'strong';
}

const verdictColor: Record<VerdictKey, string> = {
    weak: 'var(--color-primary)',
    avg: '#e0a526',
    strong: '#1e7a4c',
};

function Gauge({ pct }: { pct: number }) {
    const cx = 110;
    const cy = 110;
    const r = 90;
    const startAngle = Math.PI;
    const endAngle = Math.PI + Math.PI * (pct / 100);
    const polar = (angle: number) => ({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    const p0 = polar(startAngle);
    const p1 = polar(Math.PI * 2);
    const start = polar(startAngle);
    const end = polar(endAngle);
    const largeArc = pct > 50 ? 1 : 0;
    const color = verdictColor[verdictKey(pct)];

    return (
        <svg viewBox="0 0 220 130" width="220" height="130" className="mx-auto">
            <path
                d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 1 1 ${p1.x} ${p1.y}`}
                fill="none"
                stroke="var(--color-surface)"
                strokeWidth={16}
                strokeLinecap="round"
            />
            <path
                d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
                fill="none"
                stroke={color}
                strokeWidth={16}
                strokeLinecap="round"
            />
            <text x="110" y="100" textAnchor="middle" className="text-display text-4xl font-medium" fill="var(--color-foreground)">
                {pct}%
            </text>
        </svg>
    );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('rounded-3xl border border-[color:var(--color-border)] bg-background p-6 md:p-8', className)}>
            {children}
        </div>
    );
}

export function BrandAuditChecklist() {
    return (
        <Suspense fallback={<BrandAuditChecklistView lang="en" onLangChange={() => {}} />}>
            <BrandAuditWithUrlLang />
        </Suspense>
    );
}

function BrandAuditWithUrlLang() {
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

    return <BrandAuditChecklistView lang={lang} onLangChange={setLang} />;
}

function BrandAuditChecklistView({ lang, onLangChange }: { lang: Lang; onLangChange: (l: Lang) => void }) {
    const t = copy[lang];
    const questions = questionsData[lang];
    const total = questions.length;

    const [stage, setStage] = useState<Stage>('intro');
    const [name, setName] = useState('');
    const [bizType, setBizType] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState(false);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(total).fill(null));

    const result = useMemo(() => {
        const filled = answers.filter((a): a is number => a !== null);
        const totalPts = filled.reduce((a, b) => a + b, 0);
        const maxPts = total * 2;
        const pct = filled.length === total ? Math.round((totalPts / maxPts) * 100) : 0;

        const catScores: Partial<Record<Cat, number>> = {};
        const catMax: Partial<Record<Cat, number>> = {};
        questions.forEach((q, i) => {
            catScores[q.cat] = (catScores[q.cat] ?? 0) + (answers[i] ?? 0);
            catMax[q.cat] = (catMax[q.cat] ?? 0) + 2;
        });

        const breakdown = CATS.map((cat) => {
            const score = catScores[cat] ?? 0;
            const max = catMax[cat] ?? 1;
            return { cat, pct: Math.round((score / max) * 100) };
        }).sort((a, b) => a.pct - b.pct);

        const weakest = breakdown.filter((b) => b.pct < 70).slice(0, 2);

        return { pct, breakdown, weakest };
    }, [answers, questions, total]);

    function startQuiz() {
        const digits = phone.trim().replace(/[\s-]/g, '');
        if (!/^01[3-9]\d{8}$/.test(digits)) {
            setPhoneError(true);
            return;
        }
        setPhoneError(false);
        setPhone(digits);
        setStage('quiz');
    }

    function selectOption(pts: number) {
        setAnswers((prev) => {
            const next = [...prev];
            next[current] = pts;
            return next;
        });
    }

    function goNext() {
        if (answers[current] === null) return;
        if (current === total - 1) {
            setStage('results');
        } else {
            setCurrent((c) => c + 1);
        }
    }

    function goBack() {
        if (current === 0) return;
        setCurrent((c) => c - 1);
    }

    function restart() {
        setStage('intro');
        setCurrent(0);
        setAnswers(new Array(total).fill(null));
        submittedRef.current = false;
    }

    const submittedRef = useRef(false);

    useEffect(() => {
        if (stage !== 'results' || submittedRef.current) return;
        submittedRef.current = true;

        fetch('/api/brand-audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                businessType: bizType,
                phone,
                lang,
                score: result.pct,
                answers: answers.map((a) => a ?? 0),
                categoryBreakdown: result.breakdown.map((b) => ({ category: b.cat, percent: b.pct })),
                weakCategories: result.weakest.map((w) => w.cat),
            }),
        }).catch(() => {
            // Saving the lead should never block or interrupt the visitor's result.
        });
    }, [stage, name, bizType, phone, lang, answers, result]);

    const waLink = useMemo(() => {
        const weakNames = result.weakest.map((w) => catNames[lang][w.cat]).join(', ');
        const lines = [
            t.wa.intro,
            `${t.wa.name}: ${name || t.notProvided}`,
            `${t.wa.type}: ${bizType || t.notProvided}`,
            `${t.wa.phone}: ${phone}`,
            `${t.wa.score}: ${result.pct}%`,
            weakNames ? `${t.wa.weak}: ${weakNames}` : '',
            t.wa.closing,
        ].filter(Boolean);
        const number = siteConfig.whatsapp.replace('+', '');
        return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
    }, [result, name, bizType, phone, lang, t]);

    return (
        <div className="mx-auto w-full max-w-2xl">
            <div className="mb-6 flex justify-end">
                <LangToggle lang={lang} onChange={onLangChange} />
            </div>

            {stage === 'intro' && (
                <Card>
                    <div className="flex flex-col gap-5">
                        <Field
                            label={t.nameLabel}
                            placeholder={t.namePlaceholder}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Field
                            label={t.typeLabel}
                            placeholder={t.typePlaceholder}
                            value={bizType}
                            onChange={(e) => setBizType(e.target.value)}
                        />
                        <div>
                            <Field
                                label={t.phoneLabel}
                                placeholder={t.phonePlaceholder}
                                value={phone}
                                type="tel"
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    setPhoneError(false);
                                }}
                            />
                            {phoneError && (
                                <p role="alert" className="mt-2 text-xs text-[color:var(--color-primary-text)]">
                                    {t.phoneError}
                                </p>
                            )}
                        </div>
                        <button type="button" onClick={startQuiz} className="btn-accent mt-2 self-start">
                            {t.startBtn}
                            <IconArrowUpRight size={18} />
                        </button>
                    </div>
                </Card>
            )}

            {stage === 'quiz' && (
                <Card>
                    <div className="mb-6 flex items-center gap-3">
                        <span className="shrink-0 text-xs font-semibold text-muted">
                            {t.progress(current + 1, total)}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--color-surface)]">
                            <div
                                className="h-full rounded-full bg-[#ff3131] transition-all duration-300"
                                style={{ width: `${((current + 1) / total) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--color-primary-text)]">
                        {catNames[lang][questions[current].cat]}
                    </div>
                    <p className="text-display mb-6 text-xl font-medium leading-snug md:text-2xl">
                        {questions[current].text}
                    </p>

                    <div className="flex flex-col gap-2.5">
                        {questions[current].options.map((opt) => {
                            const selected = answers[current] === opt.pts;
                            return (
                                <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => selectOption(opt.pts)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-colors',
                                        selected
                                            ? 'border-[color:var(--color-dark)] bg-[color:var(--color-dark)] text-white'
                                            : 'border-[color:var(--color-border)] bg-white hover:border-foreground/30',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                                            selected ? 'border-white' : 'border-[color:var(--color-border)]',
                                        )}
                                    >
                                        {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#ff3131]" />}
                                    </span>
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={goBack}
                            className={cn('btn-ghost', current === 0 && 'invisible')}
                        >
                            ← {t.backBtn}
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={answers[current] === null}
                            className="btn-accent disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {current === total - 1 ? t.seeResults : t.nextBtn}
                            <IconArrowUpRight size={18} />
                        </button>
                    </div>
                </Card>
            )}

            {stage === 'results' && (
                <div className="flex flex-col gap-5">
                    <Card>
                        <Gauge pct={result.pct} />
                        <div className="mb-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            {t.scoreLabel}
                        </div>
                        <h3
                            className="text-display mt-4 text-center text-2xl font-medium"
                            style={{ color: verdictColor[verdictKey(result.pct)] }}
                        >
                            {t.verdict[verdictKey(result.pct)].label}
                        </h3>
                        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted">
                            {t.verdict[verdictKey(result.pct)].sub}
                        </p>

                        <div className="mt-8 flex flex-col gap-4 border-t border-[color:var(--color-border)] pt-6">
                            {result.breakdown.map((b) => (
                                <div key={b.cat}>
                                    <div className="mb-1.5 flex justify-between text-sm font-medium">
                                        <span>{catNames[lang][b.cat]}</span>
                                        <span>{b.pct}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-surface)]">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${b.pct}%`, background: verdictColor[verdictKey(b.pct)] }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 rounded-2xl border-l-4 border-[#1e7a4c] bg-[color:var(--color-surface)] p-5">
                            <h4 className="text-display mb-2.5 text-base font-medium">{t.tipsTitle}</h4>
                            <ul className="flex flex-col gap-2">
                                {generalTips[lang].map((tip) => (
                                    <li key={tip} className="flex gap-2 text-sm leading-relaxed text-muted">
                                        <IconCheck size={16} className="mt-0.5 shrink-0 text-[#1e7a4c]" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {result.weakest.length > 0 && (
                            <div className="mt-4 rounded-2xl border-l-4 border-[#ff3131] bg-[#ff3131]/6 p-5">
                                <h4 className="text-display mb-3 text-base font-medium text-[color:var(--color-primary-text)]">
                                    {t.flagsTitle}
                                </h4>
                                <div className="flex flex-col gap-3">
                                    {result.weakest.map((w) => {
                                        const info = flagInsights[lang][w.cat];
                                        return (
                                            <p key={w.cat} className="text-sm leading-relaxed text-foreground">
                                                <b className="text-[color:var(--color-primary-text)]">{info.title}</b> — {info.text}
                                            </p>
                                        );
                                    })}
                                </div>
                                <p className="mt-3 text-xs italic text-muted">{t.flagsNote}</p>
                            </div>
                        )}
                    </Card>

                    <div className="rounded-3xl bg-[color:var(--color-dark)] p-7 text-center text-white md:p-10">
                        <h3 className="text-display text-xl font-medium md:text-2xl">{t.ctaTitle}</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">{t.ctaBody}</p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-medium text-[color:var(--color-dark)] transition-all hover:-translate-y-0.5"
                            >
                                <IconBrandWhatsapp size={18} />
                                {t.waBtn}
                            </a>
                            <button
                                type="button"
                                onClick={restart}
                                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
                            >
                                {t.restartBtn}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-muted">{t.footer}</p>
                </div>
            )}
        </div>
    );
}

function Field({
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {label}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-[15px] font-normal text-foreground outline-none transition-colors focus:border-[#ff3131] focus:bg-background"
            />
        </label>
    );
}
