const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    usage: ["pp"],
    desc: "Update your WhatsApp profile picture",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",
    execute: async (sock, m, args) => {
        try {
            console.log('Starting profile picture update process');

            // Extract the image message from the quoted message
            const ms = m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

            if (!ms) {
                console.log('No valid image found in message or quoted message');
                await kord.reply(m, 'Please reply to an image or send an image with the command.');
                await kord.react(m, '❌');
                return;
            }

            console.log('Image message found:', JSON.stringify(ms, null, 2));

            console.log('Attempting to download image');
            const stream = await downloadContentFromMessage(ms, 'image');
            const chunks = [];

            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const fileName = `new-profile-picture_${Date.now()}.jpeg`;
                const folderPath = path.join(__dirname, '../../temp');
                const filePath = path.join(folderPath, fileName);

                // Ensure the temporary directory exists
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }

                // Write the image buffer to a file
                try {
                    fs.writeFileSync(filePath, buffer);
                    console.log('Image saved to:', filePath);
                } catch (writeError) {
                    console.error('Error saving image to file:', writeError);
                    await kord.reply(m, 'Failed to save the image. Please try again.');
                    await kord.react(m, '❌');
                    return;
                }

                const jid = m.key.remoteJid;

                try {
                    // Update the profile picture using the file path
                    console.log('Updating profile picture for:', jid);
                    await sock.updateProfilePicture(jid, { url: filePath });
                    console.log('Profile picture updated successfully');

                    await kord.reply(m, 'Your profile picture has been updated successfully! 🎉');
                    await kord.react(m, '✅');
                } catch (updateError) {
                    console.error('Error updating profile picture:', updateError);
                    await kord.reply(m, 'Failed to update profile picture. Please try again.');
                    await kord.react(m, '❌');
                } finally {
                    // Clean up the temporary file after use
                    fs.unlink(filePath, (unlinkError) => {
                        if (unlinkError) {
                            console.error('Error deleting temporary file:', unlinkError);
                        } else {
                            console.log('Temporary file deleted:', filePath);
                        }
                    });
                }
            });

            stream.on('error', async (error) => {
                console.error('Error downloading image:', error);
                await kord.reply(m, 'Failed to download the image. Please try again.');
                await kord.react(m, '❌');
            });
            
        } catch (error) {
            console.error('Error in profile picture update process:', error);
            await kord.reply(m, `Failed to update profile picture. \nError: ${error.message}`);
            await kord.react(m, '❌');
        }
    }
};