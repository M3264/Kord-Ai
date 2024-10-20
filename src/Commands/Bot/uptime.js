module.exports = {
    usage: ["runtime", "uptime"],
    desc: "Check how long the bot has been running.",
    commandType: "Info",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "⏱️",

    async execute(sock, m) {
        try {
            const runtime = await getUptime();
            const message = createUptimeMessage(runtime);
            await sendMessage(sock, m.key.remoteJid, message, m);
        } catch (error) {
            await handleError(sock, m.key.remoteJid, error);
        }
    }
};

async function getUptime() {
    let _muptime;
    if (process.send) {
        process.send('uptime');
        _muptime = await new Promise(resolve => {
            process.once('message', resolve);
            setTimeout(resolve, 1000);
        }) * 1000;
    } else {
        _muptime = process.uptime() * 1000;
    }
    return clockString(_muptime);
}

function clockString(ms) {
    let d = Math.floor(ms / 86400000);
    let h = Math.floor(ms / 3600000) % 24;
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [
        d > 0 ? d + 'd' : '',
        h > 0 ? h + 'h' : '',
        m > 0 ? m + 'm' : '',
        s > 0 ? s + 's' : ''
    ].filter(Boolean).join(' ');
}

function createUptimeMessage(runtime) {
    return {
        text: `🤖 Bot Runtime: ${runtime}`,
        contextInfo: {
            externalAdReply: {
                title: 'Bot Uptime',
                body: 'ᴋᴏʀᴅ-ᴀɪ',
                mediaType: 1,
                thumbnailUrl: "https://files.catbox.moe/xdzljz.png",
                sourceUrl: 'https://wa.me/2347013159244',
                renderLargerThumbnail: true,
                showAdAttribution: true
            }
        }
    };
}

async function sendMessage(sock, remoteJid, content, quotedMessage) {
    try {
        const messageResponse = await sock.sendMessage(remoteJid, content, { quoted: quotedMessage });
        console.log("Uptime message sent successfully:", messageResponse);
    } catch (error) {
        console.error("Error sending uptime message:", error);
        throw new Error("Failed to send uptime message: " + error.message);
    }
}

async function handleError(sock, remoteJid, error) {
    console.error('Error executing runtime command:', error.message);
    try {
        await sock.sendMessage(remoteJid, { text: `❌ Error: ${error.message}` });
    } catch (sendError) {
        console.error('Failed to send error message:', sendError);
    }
}