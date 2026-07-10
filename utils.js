// utils.js
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const config = require('./config');

// ============================================
// 🧠 AI FUNCTION (Gemini Free API)
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
// 📥 DOWNLOAD FUNCTION (yt-dlp)
// ============================================

async function downloadMedia(url, type = 'video') {
    try {
        const timestamp = Date.now();
        let outputPath;
        let command;
        if (type === 'audio') {
            outputPath = `./music_${timestamp}.mp3`;
            command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 -o "${outputPath}" "${url}"`;
        } else {
            outputPath = `./video_${timestamp}.mp4`;
            command = `yt-dlp -f best[height<=720] -o "${outputPath}" "${url}"`;
        }
        await execPromise(command);
        return outputPath;
    } catch(e) {
        return null;
    }
}

module.exports = { getAIResponse, downloadMedia };
