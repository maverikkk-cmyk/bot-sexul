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
            await sock.sendMessage(chat, { text: `✅ Bot name updated to: ${newName}` });
        } catch(e) {
            await sock.sendMessage(chat, { text: '❌ Failed to update name' });
        }
        return true;
    }
    
    if (isAdmin && text.startsWith('.setstatus ')) {
        const newStatus = text.slice(11).trim();
        config.botStatus = newStatus;
        try {
            await sock.updateProfileStatus(newStatus);
            await sock.sendMessage(chat, { text: `✅ Bot status updated to: ${newStatus}` });
        } catch(e) {
            await sock.sendMessage(chat, { text: '❌ Failed to update status' });
        }
        return true;
    }
    
    if (isAdmin && text === '.setpic') {
        if (msg.message?.imageMessage) {
            try {
                const buffer = await sock.downloadMediaMessage(msg);
                await sock.updateProfilePicture(sock.user.id, buffer);
                await sock.sendMessage(chat, { text: '✅ Bot profile picture updated!' });
            } catch(e) {
                await sock.sendMessage(chat, { text: '❌ Failed to update DP' });
            }
        } else {
            await sock.sendMessage(chat, { text: '⚠️ Reply to an image with .setpic' });
        }
        return true;
    }
    
    if (isAdmin && text === '.admins') {
        let list = '👑 *Admins*\n\n';
        for (const admin of admins) {
            list += `📱 ${admin}\n`;
        }
        await sock.sendMessage(chat, { text: list });
        return true;
    }
    
    // ============================================
    // 👁️ VIEW ONCE SAVE
    // ============================================
    
    if (text === '.saveview' && isAdmin) {
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const viewOnce = quoted.viewOnceMessage || 
                             quoted.viewOnceMessageV2 || 
                             quoted.viewOnceMessageV2Extension;
            if (viewOnce) {
                try {
                    const buffer = await sock.downloadMediaMessage({
                        key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        message: quoted
                    });
                    const path = `./viewonce_${Date.now()}.jpg`;
                    fs.writeFileSync(path, buffer);
                    await sock.sendMessage(chat, { text: `👁️ View Once Saved: ${path}` });
                } catch(e) {
                    await sock.sendMessage(chat, { text: '❌ Failed to save view once' });
                }
            } else {
                await sock.sendMessage(chat, { text: '⚠️ This is not a view once message' });
            }
        } else {
            await sock.sendMessage(chat, { text: '⚠️ Reply to a view once message with .saveview' });
        }
        return true;
    }
    
    // ============================================
    // 📥 DOWNLOAD
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
            await sock.sendMessage(chat, { text: `📥 ${result}` });
        } else {
            await sock.sendMessage(chat, { text: '❌ Failed to download' });
        }
        return true;
    }
    
    // ============================================
    // 🎵 SONG
    // ============================================
    
    if (text.startsWith('.song ')) {
        const songName = text.slice(6).trim();
        if (!songName) {
            await sock.sendMessage(chat, { text: '⚠️ Usage: .song <name>' });
            return true;
        }
        await sock.sendMessage(chat, { text: `🎵 Searching: ${songName}...` });
        const result = await utils.searchSong(songName);
        if (result && result.download_url) {
            await sock.sendMessage(chat, {
                text: `🎵 *${result.title}*\n📥 ${result.download_url}`
            });
        } else {
            await sock.sendMessage(chat, { text: '❌ Song not found' });
        }
        return true;
    }
    
    if (text.startsWith('.play ')) {
        const songName = text.slice(6).trim();
        if (!songName) {
            await sock.sendMessage(chat, { text: '⚠️ Usage: .play <name>' });
            return true;
        }
        await sock.sendMessage(chat, { text: `🎵 Playing: ${songName}...` });
        const result = await utils.searchSong(songName);
        if (result && result.download_url) {
            await sock.sendMessage(chat, { 
                text: `🎵 *${result.title}*\n🔗 ${result.download_url}` 
            });
        } else {
            await sock.sendMessage(chat, { text: '❌ Song not found' });
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
    // 👻 GHOST TOGGLES
    // ============================================
    
    if (text === '.ghost on') {
        config.ghostMode = true;
        await sock.sendMessage(chat, { text: '👻 Ghost Mode: ON' });
        return true;
    }
    if (text === '.ghost off') {
        config.ghostMode = false;
        await sock.sendMessage(chat, { text: '👻 Ghost Mode: OFF' });
        return true;
    }
    if (text === '.typing on') {
        config.alwaysTyping = true;
        await sock.sendMessage(chat, { text: '⌨️ Always Typing: ON' });
        return true;
    }
    if (text === '.typing off') {
        config.alwaysTyping = false;
        await sock.sendMessage(chat, { text: '⌨️ Always Typing: OFF' });
        return true;
    }
    if (text === '.read on') {
        config.readReceipts = true;
        await sock.sendMessage(chat, { text: '🔒 Read Receipts: ON' });
        return true;
    }
    if (text === '.read off') {
        config.readReceipts = false;
        await sock.sendMessage(chat, { text: '🔒 Read Receipts: OFF' });
        return true;
    }
    if (text === '.ai on') {
        config.aiEnabled = true;
        await sock.sendMessage(chat, { text: '🧠 AI: ENABLED' });
        return true;
    }
    if (text === '.ai off') {
        config.aiEnabled = false;
        await sock.sendMessage(chat, { text: '🧠 AI: DISABLED' });
        return true;
    }
    
    // ============================================
    // 🗑️ DELETE
    // ============================================
    
    if (text === '.delete on' && isAdmin) {
        config.deleteEnabled = true;
        await sock.sendMessage(chat, { text: '🗑️ Delete: ON' });
        return true;
    }
    if (text === '.delete off' && isAdmin) {
        config.deleteEnabled = false;
        await sock.sendMessage(chat, { text: '🗑️ Delete: OFF' });
        return true;
    }
    if (text === '.delete status') {
        await sock.sendMessage(chat, { 
            text: `🗑️ Delete Feature: ${config.deleteEnabled ? 'ON' : 'OFF'}` 
        });
        return true;
    }
    if (text === '.delete' && isAdmin) {
        if (!config.deleteEnabled) {
            await sock.sendMessage(chat, { text: '❌ Delete is OFF. Use .delete on' });
            return true;
        }
        try {
            await sock.sendMessage(chat, { delete: msg.key });
            await sock.sendMessage(chat, { text: '🗑️ Message deleted!' });
        } catch(e) {
            await sock.sendMessage(chat, { text: '❌ Cannot delete this message' });
        }
        return true;
    }
    
    // ============================================
    // 👥 GROUP MANAGEMENT
    // ============================================
    
    if (isAdmin && text.startsWith('.add ')) {
        const number = text.slice(5).trim();
        try {
            await sock.groupParticipantsUpdate(chat, [number + '@s.whatsapp.net'], 'add');
            await sock.sendMessage(chat, { text: `✅ Added ${number}` });
        } catch(e) {
            await sock.sendMessage(chat, { text: '❌ Failed to add' });
        }
        return true;
    }
    
    if (isAdmin && text.startsWith('.kick ')) {
        const number = text.slice(6).trim();
        try {
            await sock.groupParticipantsUpdate(chat, [number + '@s.whatsapp.net'], 'remove');
            await sock.sendMessage(chat, { text: `✅ Removed ${number}` });
        } catch(e) {
            await sock.sendMessage(chat, { text: '❌ Failed to remove' });
        }
        return true;
    }
    
    if (isAdmin && text === '.tagall') {
        try {
            const groupMetadata = await sock.groupMetadata(chat);
            const participants = groupMetadata.participants;
            let mentions = '';
            for (const p of participants) {
                mentions += `@${p.id.split('@')[0]} `;
            }
            await sock.sendMessage(chat, { 
                text: `📢 Attention everyone!\n${mentions}`,
                mentions: participants.map(p => p.id)
            });
        } catch(e) {
            await sock.sendMessage(chat, { text: '❌ Failed to tag all' });
        }
        return true;
    }
    
    if (isAdmin && text === '.lock') {
        try {
            await sock.groupSettingUpdate(chat, 'announcement');
            await sock.sendMessage(chat, { text: '🔒 Group locked' });
        } catch(e) {
            await sock.sendMessage(chat, { text: '❌ Failed to lock' });
        }
        return true;
    }
    
    if (isAdmin && text === '.unlock') {
        try {
            await sock.groupSettingUpdate(chat, 'not_announcement');
            await sock.sendMessage(chat, { text: '🔓 Group unlocked' });
        } catch(e) {
            await sock.sendMessage(chat, { text: '❌ Failed to unlock' });
        }
        return true;
    }
    
    // ============================================
    // 🎮 FUN COMMANDS
    // ============================================
    
    if (text === '.joke') {
        const jokes = [
            '😂 Why do programmers prefer dark mode? Light attracts bugs!',
            '😂 What do you call a fake noodle? An impasta!',
            '😂 Why don\'t scientists trust atoms? Because they make up everything!'
        ];
        await sock.sendMessage(chat, { text: jokes[Math.floor(Math.random() * jokes.length)] });
        return true;
    }
    
    if (text === '.quote') {
        const quotes = [
            '💡 "The only way to do great work is to love what you do." - Steve Jobs',
            '💡 "Innovation distinguishes between a leader and a follower." - Steve Jobs'
        ];
        await sock.sendMessage(chat, { text: quotes[Math.floor(Math.random() * quotes.length)] });
        return true;
    }
    
    if (text === '.fact') {
        const facts = [
            '🧠 The human brain uses 20% of body\'s energy.',
            '🧠 Your heart beats about 100,000 times a day.'
        ];
        await sock.sendMessage(chat, { text: facts[Math.floor(Math.random() * facts.length)] });
        return true;
    }
    
    if (text === '.8ball') {
        const answers = [
            '🎱 Yes, definitely.',
            '🎱 It is certain.',
            '🎱 Without a doubt.',
            '🎱 Better not tell you now.',
            '🎱 My sources say no.',
            '🎱 Very doubtful.'
        ];
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
    
    if (text === '.hello' || text === '.hi' || text === '.hey') {
        await sock.sendMessage(chat, { text: '👋 Hello! How can I help you?' });
        return true;
    }
    if (text === '.gm' || text === '.goodmorning') {
        await sock.sendMessage(chat, { text: '🌅 Good Morning! Have a great day!' });
        return true;
    }
    if (text === '.gn' || text === '.goodnight') {
        await sock.sendMessage(chat, { text: '🌙 Good Night! Sleep well!' });
        return true;
    }
    if (text === '.howareyou') {
        await sock.sendMessage(chat, { text: '😊 I am fine, thank you! How are you?' });
        return true;
    }
    if (text === '.thanks' || text === '.thankyou') {
        await sock.sendMessage(chat, { text: '🙏 You are welcome!' });
        return true;
    }
    if (text === '.sorry') {
        await sock.sendMessage(chat, { text: '😔 No problem! It happens.' });
        return true;
    }
    
    // ============================================
    // 🕐 UTILITY
    // ============================================
    
    if (text === '.time') {
        await sock.sendMessage(chat, { text: '🕐 ' + new Date().toLocaleString() });
        return true;
    }
    if (text === '.date') {
        await sock.sendMessage(chat, { text: '📅 ' + new Date().toLocaleDateString() });
        return true;
    }
    if (text === '.ping') {
        await sock.sendMessage(chat, { text: '🏓 Pong! Bot is alive.' });
        return true;
    }
    if (text === '.status') {
        await sock.sendMessage(chat, { 
            text: `📊 *Bot Status*\n\n` +
                  `🤖 Name: ${config.botName}\n` +
                  `📊 Status: ${config.botStatus}\n` +
                  `👥 Admins: ${admins.length}\n` +
                  `🧠 AI: ${config.aiEnabled ? 'ON' : 'OFF'}\n` +
                  `👻 Ghost: ${config.ghostMode ? 'ON' : 'OFF'}\n` +
                  `🗑️ Delete: ${config.deleteEnabled ? 'ON' : 'OFF'}`
        });
        return true;
    }
    if (text === '.god') {
        await sock.sendMessage(chat, { text: '👑 God Mode Active!' });
        return true;
    }
    if (text === '.whoareyou') {
        await sock.sendMessage(chat, { text: '🤖 I am ' + config.botName + ' — Your Ultimate AI Assistant!' });
        return true;
    }
    
    // ============================================
    // ❓ HELP
    // ============================================
    
    if (text === '.help') {
        await sock.sendMessage(chat, {
            text: '🚀 *2026 ULTIMATE BOT — COMMANDS*\n\n' +
                  '👑 `.connect` - Add admin (Owner)\n' +
                  '👑 `.setname` - Change bot name (Admin)\n' +
                  '👑 `.setstatus` - Change bot status (Admin)\n' +
                  '👑 `.setpic` - Change bot DP (Admin)\n' +
                  '👑 `.admins` - List admins (Admin)\n' +
                  '📥 `.dl <url>` - Download video\n' +
                  '🎵 `.song <name>` - Search song\n' +
                  '🎵 `.play <name>` - Play song\n' +
                  '👁️ `.saveview` - Save view once (Admin)\n' +
                  '👻 `.ghost on/off` - Ghost mode\n' +
                  '⌨️ `.typing on/off` - Always typing\n' +
                  '🔒 `.read on/off` - Read receipts\n' +
                  '🧠 `.ai on/off` - AI toggle\n' +
                  '🗑️ `.delete` - Delete message (Admin)\n' +
                  '🗑️ `.delete on/off` - Delete toggle (Admin)\n' +
                  '👥 `.add @user` - Add member (Admin)\n' +
                  '👥 `.kick @user` - Remove member (Admin)\n' +
                  '📢 `.tagall` - Tag all (Admin)\n' +
                  '🔒 `.lock` - Lock group (Admin)\n' +
                  '🔓 `.unlock` - Unlock group (Admin)\n' +
                  '🎮 `.joke` - Random joke\n' +
                  '🎮 `.quote` - Random quote\n' +
                  '🎮 `.fact` - Random fact\n' +
                  '🎮 `.8ball` - Ask 8ball\n' +
                  '🎮 `.flipcoin` - Flip coin\n' +
                  '🎮 `.dice` - Roll dice\n' +
                  '💬 `.hello, .hi, .hey` - Hello\n' +
                  '💬 `.gm` - Good morning\n' +
                  '💬 `.gn` - Good night\n' +
                  '💬 `.howareyou` - How are you\n' +
                  '💬 `.thanks` - Thank you\n' +
                  '💬 `.sorry` - Sorry\n' +
                  '🕐 `.time` - Current time\n' +
                  '🕐 `.date` - Current date\n' +
                  '🕐 `.ping` - Check bot\n' +
                  '🕐 `.status` - Bot status\n' +
                  '🕐 `.god` - God mode\n' +
                  '🕐 `.whoareyou` - About bot\n' +
                  '❓ `.help` - This menu'
        });
        return true;
    }
    
    return false;
}

module.exports = { handleCommand, admins };
