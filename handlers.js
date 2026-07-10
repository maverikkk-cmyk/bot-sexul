// handlers.js
const config = require('./config');
const utils = require('./utils');
const fs = require('fs');

let admins = [config.ownerNumber];

async function handleCommand(sock, msg, chat, sender, text, isAdmin, isOwner) {
    const senderNumber = sender.split('@')[0];
    
    // ============================================
    // 👑 ADMIN COMMANDS
    // ============================================
    
    if (isOwner && text.startsWith('.connect ')) {
        const newAdmin = text.slice(9).trim();
        if (!admins.includes(newAdmin)) {
            admins.push(newAdmin);
            await sock.sendMessage(chat, { text: `👑 New Admin Added: ${newAdmin}` });
        }
        return true;
    }
    
    if (isAdmin && text.startsWith('.setname ')) {
        const newName = text.slice(9).trim();
        config.botName = newName;
        try {
            await sock.updateProfileName(newName);
            await sock.sendMessage(chat, { text: `✅ Name: ${newName}` });
        } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        return true;
    }
    
    if (isAdmin && text.startsWith('.setstatus ')) {
        const newStatus = text.slice(11).trim();
        config.botStatus = newStatus;
        try {
            await sock.updateProfileStatus(newStatus);
            await sock.sendMessage(chat, { text: `✅ Status: ${newStatus}` });
        } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        return true;
    }
    
    if (isAdmin && text === '.setpic') {
        if (msg.message?.imageMessage) {
            try {
                const buffer = await sock.downloadMediaMessage(msg);
                await sock.updateProfilePicture(sock.user.id, buffer);
                await sock.sendMessage(chat, { text: '✅ DP Updated!' });
            } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        }
        return true;
    }
    
    if (isAdmin && text === '.admins') {
        let list = '👑 Admins:\n';
        for (const admin of admins) list += `📱 ${admin}\n`;
        await sock.sendMessage(chat, { text: list });
        return true;
    }
    
    // ============================================
    // 👁️ VIEW ONCE SAVE
    // ============================================
    
    if (text === '.saveview' && isAdmin) {
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const viewOnce = quoted.viewOnceMessage || quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension;
            if (viewOnce) {
                try {
                    const buffer = await sock.downloadMediaMessage({
                        key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        message: quoted
                    });
                    const path = `./viewonce_${Date.now()}.jpg`;
                    fs.writeFileSync(path, buffer);
                    await sock.sendMessage(chat, { text: `👁️ Saved: ${path}` });
                } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
            }
        }
        return true;
    }
    
    // ============================================
    // 📥 DOWNLOAD (TERI API)
    // ============================================
    
    if (text.startsWith('.dl ')) {
        const url = text.slice(4).trim();
        if (!url) {
            await sock.sendMessage(chat, { text: '⚠️ Usage: .dl <url>' });
            return true;
        }
        
        await sock.sendMessage(chat, { text: '📥 Downloading...' });
        const result = await utils.downloadMedia(url);
        if (result) {
            await sock.sendMessage(chat, { text: `📥 Download: ${result}` });
        } else {
            await sock.sendMessage(chat, { text: '❌ Failed to download. Check URL.' });
        }
        return true;
    }
    
    // ============================================
    // 🎵 SONG SEARCH (TERI API)
    // ============================================
    
    if (text.startsWith('.song ')) {
        const songName = text.slice(6).trim();
        if (!songName) {
            await sock.sendMessage(chat, { text: '⚠️ Usage: .song <song name>' });
            return true;
        }
        
        await sock.sendMessage(chat, { text: `🎵 Searching: ${songName}...` });
        const result = await utils.searchSong(songName);
        if (result && result.download_url) {
            await sock.sendMessage(chat, {
                text: `🎵 *${result.title}*\n📥 ${result.download_url}`
            });
        } else {
            await sock.sendMessage(chat, { text: '❌ Song not found.' });
        }
        return true;
    }
    
    // ============================================
    // 🎵 PLAY (TERI API)
    // ============================================
    
    if (text.startsWith('.play ')) {
        const songName = text.slice(6).trim();
        if (!songName) {
            await sock.sendMessage(chat, { text: '⚠️ Usage: .play <song name>' });
            return true;
        }
        
        await sock.sendMessage(chat, { text: `🎵 Playing: ${songName}...` });
        const result = await utils.searchSong(songName);
        if (result && result.download_url) {
            await sock.sendMessage(chat, { 
                text: `🎵 *${result.title}*\n🔗 ${result.download_url}` 
            });
        } else {
            await sock.sendMessage(chat, { text: '❌ Song not found.' });
        }
        return true;
    }
    
    // ============================================
    // 🧠 AI
    // ============================================
    
    if (text.startsWith('.ai ')) {
        const prompt = text.slice(4);
        await sock.sendMessage(chat, { text: '🤔 Thinking...' });
        const response = await utils.getAIResponse(prompt);
        await sock.sendMessage(chat, { text: response || '❌ AI error' });
        return true;
    }
    
    // ============================================
    // 👻 GHOST
    // ============================================
    
    if (text === '.ghost on') { config.ghostMode = true; await sock.sendMessage(chat, { text: '👻 ON' }); return true; }
    if (text === '.ghost off') { config.ghostMode = false; await sock.sendMessage(chat, { text: '👻 OFF' }); return true; }
    if (text === '.typing on') { config.alwaysTyping = true; await sock.sendMessage(chat, { text: '⌨️ ON' }); return true; }
    if (text === '.typing off') { config.alwaysTyping = false; await sock.sendMessage(chat, { text: '⌨️ OFF' }); return true; }
    if (text === '.read on') { config.readReceipts = true; await sock.sendMessage(chat, { text: '🔒 ON' }); return true; }
    if (text === '.read off') { config.readReceipts = false; await sock.sendMessage(chat, { text: '🔒 OFF' }); return true; }
    if (text === '.ai on') { config.aiEnabled = true; await sock.sendMessage(chat, { text: '🧠 ON' }); return true; }
    if (text === '.ai off') { config.aiEnabled = false; await sock.sendMessage(chat, { text: '🧠 OFF' }); return true; }
    
    // ============================================
    // 🗑️ DELETE
    // ============================================
    
    if (text === '.delete on' && isAdmin) { config.deleteEnabled = true; await sock.sendMessage(chat, { text: '🗑️ ON' }); return true; }
    if (text === '.delete off' && isAdmin) { config.deleteEnabled = false; await sock.sendMessage(chat, { text: '🗑️ OFF' }); return true; }
    if (text === '.delete status') { await sock.sendMessage(chat, { text: `🗑️ ${config.deleteEnabled ? 'ON' : 'OFF'}` }); return true; }
    if (text === '.delete' && isAdmin) {
        if (!config.deleteEnabled) { await sock.sendMessage(chat, { text: '❌ OFF' }); return true; }
        try { await sock.sendMessage(chat, { delete: msg.key }); await sock.sendMessage(chat, { text: '🗑️ Deleted!' }); } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        return true;
    }
    
    // ============================================
    // 👥 GROUP
    // ============================================
    
    if (isAdmin && text.startsWith('.add ')) {
        const number = text.slice(5).trim();
        try { await sock.groupParticipantsUpdate(chat, [number + '@s.whatsapp.net'], 'add'); await sock.sendMessage(chat, { text: `✅ Added ${number}` }); } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        return true;
    }
    
    if (isAdmin && text.startsWith('.kick ')) {
        const number = text.slice(6).trim();
        try { await sock.groupParticipantsUpdate(chat, [number + '@s.whatsapp.net'], 'remove'); await sock.sendMessage(chat, { text: `✅ Removed ${number}` }); } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        return true;
    }
    
    if (isAdmin && text === '.tagall') {
        try {
            const groupMetadata = await sock.groupMetadata(chat);
            const participants = groupMetadata.participants;
            let mentions = '';
            for (const p of participants) mentions += `@${p.id.split('@')[0]} `;
            await sock.sendMessage(chat, { text: `📢 ${mentions}`, mentions: participants.map(p => p.id) });
        } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        return true;
    }
    
    if (isAdmin && text === '.lock') {
        try { await sock.groupSettingUpdate(chat, 'announcement'); await sock.sendMessage(chat, { text: '🔒 Locked' }); } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        return true;
    }
    
    if (isAdmin && text === '.unlock') {
        try { await sock.groupSettingUpdate(chat, 'not_announcement'); await sock.sendMessage(chat, { text: '🔓 Unlocked' }); } catch(e) { await sock.sendMessage(chat, { text: '❌ Failed' }); }
        return true;
    }
    
    // ============================================
    // 🎮 FUN
    // ============================================
    
    if (text === '.joke') {
        const jokes = ['😂 Why do programmers prefer dark mode? Light attracts bugs!', '😂 What do you call a fake noodle? An impasta!'];
        await sock.sendMessage(chat, { text: jokes[Math.floor(Math.random() * jokes.length)] });
        return true;
    }
    
    if (text === '.quote') {
        const quotes = ['💡 "The only way to do great work is to love what you do." - Steve Jobs'];
        await sock.sendMessage(chat, { text: quotes[Math.floor(Math.random() * quotes.length)] });
        return true;
    }
    
    if (text === '.fact') {
        const facts = ['🧠 The human brain uses 20% of body\'s energy.'];
        await sock.sendMessage(chat, { text: facts[Math.floor(Math.random() * facts.length)] });
        return true;
    }
    
    if (text === '.8ball') {
        const answers = ['🎱 Yes', '🎱 No', '🎱 Definitely', '🎱 Maybe'];
        await sock.sendMessage(chat, { text: answers[Math.floor(Math.random() * answers.length)] });
        return true;
    }
    
    if (text === '.flipcoin') {
        await sock.sendMessage(chat, { text: '🪙 ' + (Math.random() > 0.5 ? 'Heads' : 'Tails') });
        return true;
    }
    
    if (text === '.dice') {
        await sock.sendMessage(chat, { text: '🎲 ' + (Math.floor(Math.random() * 6) + 1) });
        return true;
    }
    
    // ============================================
    // 💬 CONVERSATION
    // ============================================
    
    if (text === '.hello' || text === '.hi' || text === '.hey') { await sock.sendMessage(chat, { text: '👋 Hello!' }); return true; }
    if (text === '.gm' || text === '.goodmorning') { await sock.sendMessage(chat, { text: '🌅 Good Morning!' }); return true; }
    if (text === '.gn' || text === '.goodnight') { await sock.sendMessage(chat, { text: '🌙 Good Night!' }); return true; }
    if (text === '.howareyou') { await sock.sendMessage(chat, { text: '😊 I am fine!' }); return true; }
    if (text === '.thanks' || text === '.thankyou') { await sock.sendMessage(chat, { text: '🙏 Welcome!' }); return true; }
    if (text === '.sorry') { await sock.sendMessage(chat, { text: '😔 No problem!' }); return true; }
    
    // ============================================
    // 🕐 UTILITY
    // ============================================
    
    if (text === '.time') { await sock.sendMessage(chat, { text: '🕐 ' + new Date().toLocaleString() }); return true; }
    if (text === '.date') { await sock.sendMessage(chat, { text: '📅 ' + new Date().toLocaleDateString() }); return true; }
    if (text === '.ping') { await sock.sendMessage(chat, { text: '🏓 Pong!' }); return true; }
    if (text === '.status') { await sock.sendMessage(chat, { text: `📊 Bot: ${config.botName}\nAdmins: ${admins.length}` }); return true; }
    if (text === '.god') { await sock.sendMessage(chat, { text: '👑 God Mode Active!' }); return true; }
    if (text === '.whoareyou') { await sock.sendMessage(chat, { text: '🤖 I am ' + config.botName }); return true; }
    
    // ============================================
    // ❓ HELP
    // ============================================
    
    if (text === '.help') {
        await sock.sendMessage(chat, {
            text: '🤖 *COMMANDS*\n\n' +
                  '👑 Admin: .connect, .setname, .setstatus, .setpic, .admins\n' +
                  '📥 Download: .dl <url>\n' +
                  '🎵 Song: .song <name>, .play <name>\n' +
                  '👁️ View Once: .saveview\n' +
                  '👻 Ghost: .ghost on/off, .typing on/off, .read on/off, .ai on/off\n' +
                  '🗑️ Delete: .delete, .delete on/off\n' +
                  '👥 Group: .add, .kick, .tagall, .lock, .unlock\n' +
                  '🎮 Fun: .joke, .quote, .fact, .8ball, .flipcoin, .dice\n' +
                  '💬 Conversation: .hello, .hi, .gm, .gn, .howareyou, .thanks, .sorry\n' +
                  '🕐 Utility: .time, .date, .ping, .status, .god, .whoareyou\n' +
                  '❓ .help - This menu'
        });
        return true;
    }
    
    return false;
}

module.exports = { handleCommand, admins };
