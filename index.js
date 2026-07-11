const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const fs = require('fs');
const config = require('./config');
const { handleCommand, admins } = require('./handlers');

const SESSION_FOLDER = 'auth_info';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
    
    const sock = makeWASocket({
        auth: state,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        browser: Browsers.macOS('Safari'),
        version: [2, 3000, 1029030078],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: 60000,
        generateHighQualityLinkPreview: false,
        emitOwnEvents: false,
        patchMessageBeforeSending: (message) => message,
        cachedGroupMetadata: async (jid) => await sock.groupMetadata(jid),
    });
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log('✅ BOT ONLINE!');
            console.log('📱 Number: ' + config.ownerNumber);
            console.log('🤖 Name: ' + config.botName);
            console.log('👥 Admins: ' + admins.join(', '));
            try {
                await sock.updateProfileName(config.botName);
                await sock.updateProfileStatus(config.botStatus);
            } catch(e) {}
        }
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('❌ Logged out.');
                fs.rmSync(SESSION_FOLDER, { recursive: true, force: true });
            } else {
                console.log('🔄 Reconnecting...');
                setTimeout(startBot, 3000);
            }
        }
    });
    
    try {
        const code = await sock.requestPairingCode(config.ownerNumber);
        console.log('');
        console.log('📱 ========= PAIRING CODE =========');
        console.log('🔢 CODE:', code);
        console.log('📲 WhatsApp → Linked Devices → Link with Phone Number');
        console.log('====================================');
        console.log('');
    } catch(err) {
        console.log('❌ Pairing error:', err.message);
        setTimeout(startBot, 5000);
        return;
    }
    
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const chat = msg.key.remoteJid;
        const sender = msg.key.participant || chat;
        const senderNumber = sender.split('@')[0];
        const isAdmin = admins.includes(senderNumber);
        const isOwner = senderNumber === config.ownerNumber;
        
        if (config.alwaysTyping) {
            try { await sock.sendPresenceUpdate('composing', chat); } catch(e) {}
        }
        
        if (config.randomDelays) {
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 1000));
        }
        
        await handleCommand(sock, msg, chat, sender, text, isAdmin, isOwner);
    });
    
    sock.ev.on('creds.update', saveCreds);
}

console.log('👑 STARTING BOT...');
console.log('📱 Number: ' + config.ownerNumber);
console.log('📂 Session: ' + (fs.existsSync(SESSION_FOLDER) ? '✅ Found' : '❌ Not found'));
startBot().catch(console.error);
