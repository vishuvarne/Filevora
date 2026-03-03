#!/usr/bin/env node
/**
 * IndexNow Submission Script
 * Submits all ConvertLocally tool URLs to IndexNow API for instant indexing.
 * Supported by: Bing, Yandex, Naver, Seznam, Yep
 * 
 * Usage: node scripts/submit-indexnow.js
 */

const INDEXNOW_KEY = 'befebe4b2fecd5a199901880ead7d692';
const HOST = 'convertlocally.web.app';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

// All tool IDs from the TOOLS array
const TOOL_IDS = [
    'image-to-pdf', 'jpg-to-pdf', 'merge-pdf', 'split-pdf', 'compress-pdf',
    'rotate-pdf', 'pdf-password-protect', 'pdf-remove-password', 'pdf-converter',
    'pdf-to-word', 'pdf-to-ppt', 'word-to-pdf', 'excel-to-pdf', 'ppt-to-pdf',
    'pdf-to-jpg', 'pdf-to-epub', 'epub-to-pdf', 'ebook-converter', 'epub-to-mobi',
    'mobi-to-epub', 'document-converter', 'convert-image', 'jpg-to-png', 'png-to-jpg',
    'image-compressor', 'rotate-image', 'webp-to-png', 'jfif-to-png', 'png-to-svg',
    'heic-to-jpg', 'heic-to-png', 'webp-to-jpg', 'svg-converter', 'avif-converter',
    'jpg-to-avif', 'mp4-to-mp3', 'audio-trim', 'audio-compress', 'video-to-gif',
    'mp4-to-gif', 'webm-to-gif', 'apng-to-gif', 'gif-to-mp4', 'gif-to-apng',
    'image-to-gif', 'mov-to-gif', 'avi-to-gif', 'length-converter', 'weight-converter',
    'temperature-converter', 'speed-converter', 'volume-converter', 'area-converter',
    'utc-converter', 'time-zone-map', 'pst-to-est', 'rar-to-zip', '7z-extractor',
    'tar-gz-converter', 'unit-converter', 'time-converter', 'archive-converter',
    'chat-with-pdf', 'merge-video', 'compress-video', 'video-to-mp4', 'video-to-mp3',
    'trim-video', 'compress-audio', 'convert-audio', 'volume-booster', 'voice-recorder',
    'collage-maker', 'image-resizer', 'crop-image', 'color-picker', 'meme-generator',
    'photo-editor', 'qr-code-generator'
];

async function submitToIndexNow() {
    const urlList = [
        `https://${HOST}`,
        `https://${HOST}/about`,
        ...TOOL_IDS.map(id => `https://${HOST}/tools/${id}/`)
    ];

    console.log(`Submitting ${urlList.length} URLs to IndexNow...`);

    const payload = {
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: urlList
    };

    // Submit to multiple IndexNow endpoints
    const endpoints = [
        'https://api.indexnow.org/indexnow',
        'https://www.bing.com/indexnow',
        'https://yandex.com/indexnow',
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify(payload)
            });
            console.log(`  ${endpoint}: ${response.status} ${response.statusText}`);
        } catch (err) {
            console.error(`  ${endpoint}: FAILED - ${err.message}`);
        }
    }

    console.log('\nDone! URLs submitted for indexing.');
    console.log('Note: Google does not support IndexNow. Use Google Search Console for Google indexing.');
}

submitToIndexNow();
