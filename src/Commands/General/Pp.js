const fs = require('fs');
const path = require('path');
const os = require('os');
const fsPromises = require('fs').promises;
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    usage: ["pp"],
    desc: "Update your WhatsApp profile picture",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: true,
    emoji: "🖼️",
    execute: async (sock, m, args) => {
        let mediaBuffer, fileExtension, tempFilePath;

            try {
                if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage) {
                    const quotedMedia = await global.kord.downloadQuotedMedia(m);

                    if (quotedMedia) {
                        mediaBuffer = quotedMedia.buffer;
                        fileExtension = quotedMedia.extension;
                    } else {
                        return await global.kord.reply(m, "❌ Failed to download the quoted media.");
                    }
                } else {
                    // No quoted message, download media from the main message
                    const mediaMsg = await global.kord.downloadMediaMsg(m);

                    if (mediaMsg) {
                        mediaBuffer = mediaMsg.buffer;
                        fileExtension = mediaMsg.extension;
                    } else {
                        return await global.kord.reply(m, "❌ Failed to download the media.");
                    }
                }

                // Create a temporary file path
                tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${fileExtension}`);

                // Save the media to the temp file
                await fsPromises.writeFile(tempFilePath, mediaBuffer);

                    // Determine the sender's ID
                    const sender = `${sock.user.id.split(':')[0]}@s.whatsapp.net`;
                    await sock.updateProfilePicture(sender, { url: tempFilePath });

                    await global.kord.reply(m, "✅ profile picture has been updated.");
            } catch (error) {
                console.error("Error in serpp:", error);
                await global.kord.reply(m, "❌ Failed to update profile picture.");
            } finally {
                // Clean up: delete the temporary file
                if (tempFilePath) {
                    try {
                        await fsPromises.unlink(tempFilePath);
                    } catch (unlinkError) {
                        console.error("Error deleting temporary file:", unlinkError);
                    }
                }
            }
        }
    }