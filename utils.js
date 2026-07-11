const axios = require('axios');
const config = require('./config');

const API_URL = 'https://all7.onrender.com/api/download';

// Gemini 2.0 Flash
async function getAIResponse(prompt) {
    if (!config.aiEnabled) return null;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.aiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I cannot answer that.';
    } catch(e) {
        return '❌ AI error. Check API key.';
    }
}

// New Download API (2026)
async function downloadMedia(url) {
    try {
        const response = await axios.get(API_URL, {
            params: { url: url },
            timeout: 30000
        });
        return response.data?.download_url || response.data?.url || null;
    } catch(e) {
        return null;
    }
}

// New Song Search (2026)
async function searchSong(songName) {
    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songName)}`;
        const response = await axios.get(API_URL, {
            params: { url: searchUrl },
            timeout: 30000
        });
        if (response.data && response.data.download_url) {
            return {
                title: songName,
                download_url: response.data.download_url,
                source: 'YouTube'
            };
        }
        return null;
    } catch(e) {
        return null;
    }
}

module.exports = { getAIResponse, downloadMedia, searchSong };
