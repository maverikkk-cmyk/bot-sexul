// utils.js
const axios = require('axios');
const config = require('./config');

// ============================================
// 🔑 TERI API KEY
// ============================================

const API_KEY = 'shadow_admin_sm0247415';
const API_URL = 'https://all7.onrender.com/api/download';

// ============================================
// 🧠 AI FUNCTION
// ============================================

async function getAIResponse(prompt) {
    if (!config.aiEnabled) return null;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.aiModel}:generateContent?key=${config.aiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch(e) {
        return null;
    }
}

// ============================================
// 📥 DOWNLOAD (TERI API)
// ============================================

async function downloadMedia(url) {
    try {
        const response = await axios.get(API_URL, {
            params: { url: url }
        });
        return response.data?.download_url || response.data?.url || null;
    } catch(e) {
        console.error('Download error:', e.message);
        return null;
    }
}

// ============================================
// 🎵 SONG SEARCH (TERI API)
// ============================================

async function searchSong(songName) {
    try {
        // YouTube search URL (same API)
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songName)}`;
        const response = await axios.get(API_URL, {
            params: { url: searchUrl }
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
        console.error('Search error:', e.message);
        return null;
    }
}

module.exports = { getAIResponse, downloadMedia, searchSong };
