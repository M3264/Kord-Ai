const audioUrls = [
    "https://files.catbox.moe/b1js43.mp3",
    "https://files.catbox.moe/9ievhh.mp3",
    "https://files.catbox.moe/z7u9gz.mp3",
    "https://files.catbox.moe/q50wno.mp3",
    "https://files.catbox.moe/kap8jh.mp3",
    "https://files.catbox.moe/oqjilo.mp3"
];

const thumbnailUrl = "https://files.catbox.moe/g4q04p.png";

module.exports = {
    usage: ["alive"],
    desc: "Check if the bot is alive.",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "💖",

    async execute(sock, m) {
        try {
            const audioUrl = getRandomAudioUrl();
            if (!audioUrl) {
                throw new Error("No valid audio URL available.");
            }
            const messageContent = createMessageContent(audioUrl, m.sender);
            await sendMessage(sock, m.key.remoteJid, messageContent, m);
        } catch (error) {
            await handleError(sock, m.key.remoteJid, error);
        }
    }
};

function getRandomAudioUrl() {
    const validUrls = audioUrls.filter(url => typeof url === 'string' && url.trim() !== '');
    if (validUrls.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * validUrls.length);
    return validUrls[randomIndex];
}

function createMessageContent(audioUrl, sender) {
    return {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: true,
        fileName: 'Kord.mp3',
        contextInfo: {
            externalAdReply: {
                title: '\`I AM ALIVE\`',
                body: 'ᴋᴏʀᴅ-ᴀɪ',
                mediaType: 1,
                thumbnailUrl: thumbnailUrl,
                sourceUrl: 'https://wa.me/2347013159244',
                renderLargerThumbnail: true, // This will make the ad larger
                showAdAttribution: true // This will show "AD" tag if supported by the client
            }
        }
    };
}

async function sendMessage(sock, remoteJid, content, quotedMessage) {
    try {
        console.log("Sending message with content:", JSON.stringify(content, null, 2));
        const messageResponse = await sock.sendMessage(remoteJid, content, { quoted: quotedMessage });
        console.log("Message sent successfully:", messageResponse);
    } catch (error) {
        console.error("Error sending message:", error);
        throw new Error("Failed to send message: " + error.message);
    }
}

async function handleError(sock, remoteJid, error) {
    console.error('Error executing alive command:', error.message);
    try {
        await sock.sendMessage(remoteJid, { text: `❌ Error: ${error.message}` });
    } catch (sendError) {
        console.error('Failed to send error message:', sendError);
    }
}