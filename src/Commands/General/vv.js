const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
        usage: ["viewonce", "vv"],
        desc: "Retrieve and resend view-once messages (images/videos/voice notes) when replied with `.vv`. Use `.vv chat` to receive in private chat.",
        commandType: "Utility",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "🕵️",

        async execute(sock, m, args, kord) {
                try {
                        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                        const sendToPrivate = args[0]?.toLowerCase() === 'chat';
                        const isGroup = m.key.remoteJid.endsWith('@g.us');

                        if (!quotedMsg) {
                                if (global.settings?.INVINCIBLE_MODE) {
                                        await kord.react("🚫");
                                        return await kord.sendErr(null, {
                                                context: "ViewOnce Command",
                                                info: "No quoted message found!"
                                        });
                                }
                                return await kord.reply("Please reply to a view-once media message with `.vv` or `.vv chat` for private message.");
                        }

                        // Check for media types with viewOnce flag
                        const mediaMessage = quotedMsg.imageMessage ||
                                quotedMsg.videoMessage ||
                                quotedMsg.audioMessage;

                        if (!mediaMessage?.viewOnce) {
                                if (global.settings?.INVINCIBLE_MODE) {
                                        await kord.react("🚫");
                                        return await kord.sendErr(null, {
                                                context: "ViewOnce Command",
                                                info: "Not a view-once message"
                                        });
                                }
                                return await kord.reply("The replied message is not a view-once message.");
                        }

                        try {
                                // Get media buffer
                                const buffer = await kord.getbuff();
                                const caption = mediaMessage.caption || '';

                                // Determine recipient based on context
                                let recipient;
                                if (sendToPrivate) {
                                        if (!isGroup) {
                                                // If in PM and .vv chat, send to owner
                                                recipient = `${global.settings.OWNER_NUMBERS}@s.whatsapp.net`;
                                               
                                                
                                        } else {
                                                // If in group and .vv chat, send to sender's DM
                                                recipient = m.key.participant
                                        }
                                } else {
                                        // If not .vv chat, send to participant
                                        recipient = m.key.remoteJid;
                                }

                                // Send media based on type
                                if (mediaMessage.mimetype.startsWith('image')) {
                                        await sock.sendMessage(recipient, {
                                                image: buffer,
                                                caption: caption
                                        });
                                } else if (mediaMessage.mimetype.startsWith('video')) {
                                        await sock.sendMessage(recipient, {
                                                video: buffer,
                                                caption: caption
                                        });
                                } else if (mediaMessage.mimetype.startsWith('audio')) {
                                        await sock.sendMessage(recipient, {
                                                audio: buffer,
                                                ptt: mediaMessage.ptt || false
                                        });
                                } else {
                                        if (global.settings?.INVINCIBLE_MODE) {
                                                await kord.react("🚫");
                                                return await kord.sendErr(null, {
                                                        context: "ViewOnce Command",
                                                        info: "Unsupported media type"
                                                });
                                        }
                                        return await kord.reply("Unsupported media type in view-once message.");
                                }

                                // Send confirmation message
                                if (sendToPrivate) {
                                 //       await kord.reply("Media sent to " + (isGroup ? "your DM!" : "owner's DM!"));
                                }

                                // React with success emoji if message was sent
                                await kord.react("✨");

                        } catch (downloadError) {
                                if (global.settings?.INVINCIBLE_MODE) {
                                        await kord.react("🚫");
                                        return await kord.sendErr(downloadError, {
                                                context: "ViewOnce Command",
                                                info: "Failed to download media"
                                        });
                                }
                                return await kord.reply("Failed to download the media content.");
                        }

                } catch (error) {
                        if (global.settings?.INVINCIBLE_MODE) {
                                await kord.react("🚫");
                                return await kord.sendErr(error, {
                                        context: "ViewOnce Command",
                                        info: "Unexpected error in processing view-once message"
                                });
                        }
                        console.error("Error in viewonce command:", error);
                        return await kord.reply("An error occurred while processing the view-once message.");
                }
        }
};