const fs = require('fs');
const path = require('path');
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
        try {
            const quoted = await kord.getQuotedMedia(m);
            const messageType = await kord.getMessageType(m);
            const quotedMessageType = await kord.getQuotedMessageType(m);

            // Define valid image types
            const validImageTypes = ['imageMessage'];

            // Check if there is a quoted image or if the message itself is an image
            if (!quoted && !validImageTypes.includes(messageType)) {
                await kord.reply(m, 'Please reply to an image.');
                await kord.react(m, '❌');
                return;
            }

            // Determine which stream to download: quoted or current message
            const stream = quoted 
                ? await downloadContentFromMessage(quoted, 'image')
                : validImageTypes.includes(messageType) 
                    ? await downloadContentFromMessage(m, 'image') // If current message is an image
                    : null;

            // If stream is valid, process the image
            if (stream) {
                const chunks = [];

                stream.on('data', chunk => chunks.push(chunk));
                stream.on('end', async () => {
                    const buffer = Buffer.concat(chunks);
                    const fileName = `profile_${Date.now()}.jpg`;
                    const folderPath = path.join(__dirname, '../temp');
                    const filePath = path.join(folderPath, fileName);

                    // Ensure the directory exists
                    if (!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath, { recursive: true });
                    }

                    // Save the image to the filesystem
                    fs.writeFileSync(filePath, buffer);
                    const imageData = fs.readFileSync(filePath);

                    // Determine the sender's ID
                    const sender = `${sock.user.id.split(':')[0]}@s.whatsapp.net`;

                    // Update the profile picture
                    await sock.updateProfilePicture(sender, imageData);
                    await kord.reply(m, "Profile picture updated successfully! 🎉");
                });
            } else {
                await kord.reply(m, 'No valid image found to update profile picture.');
                await kord.react(m, '❌');
            }
        } catch (error) {
            console.error('Error updating profile picture:', error);
            await kord.reply(m, `Failed to update profile picture. \nError: ${error.message}`);
        }
    }
};
