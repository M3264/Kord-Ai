const { downloadMediaMessage } = require('@whiskeysockets/baileys'); // Import Baileys

module.exports = {
    usage: ["viewonce", "vv"],
    desc: "Retrieve and resend view-once messages (images/videos/voice notes) when replied with `.vv`.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🕵️",

    async execute(sock, m, args) {
        try {
            // Check if the message is a reply to a view-once message
            const quotedMessageContext = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMessageContext) {
                await sock.sendMessage(m.key.remoteJid, { text: "Please reply to a view-once media message with `.vv`." });
                return;
            }

            // Handle view-once messages (Image/Video/Audio)
            const viewOnceMessage = quotedMessageContext.viewOnceMessageV2 || quotedMessageContext.viewOnceMessage;

            if (viewOnceMessage && viewOnceMessage.message) {
                const mediaMessage = viewOnceMessage.message.imageMessage || viewOnceMessage.message.videoMessage || viewOnceMessage.message.audioMessage;

                if (mediaMessage) {
                    const caption = mediaMessage.caption || '';
                    const mediaBuffer = await downloadMediaMessage(viewOnceMessage, 'buffer', {}, { logger: console });

                    // Check and handle the type of media
                    if (mediaMessage.mimetype.startsWith('image')) {
                        // Send Image
                        await sock.sendMessage(m.key.remoteJid, { image: mediaBuffer, caption });
                    } else if (mediaMessage.mimetype.startsWith('video')) {
                        // Send Video
                        await sock.sendMessage(m.key.remoteJid, { video: mediaBuffer, caption });
                    } else if (mediaMessage.mimetype.startsWith('audio')) {
                        // Send Audio (Voice Note)
                        await sock.sendMessage(m.key.remoteJid, { audio: mediaBuffer, mimetype: mediaMessage.mimetype });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { text: "Unsupported media type." });
                    }
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: "This view-once message is not an image, video, or voice note." });
                }
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: "The replied message is not a view-once message." });
            }
        } catch (error) {
            console.error("Error processing view-once message:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "An error occurred. Please try again." });
        }
    }
};