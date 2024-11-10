const fs = require('fs');
const path = require('path');
const os = require('os');
const vcard = require('vcard-parser');
const { parsePhoneNumber } = require('libphonenumber-js');
const fsPromises = require('fs').promises;

module.exports = [
    {
        usage: ["setgcname"],
        desc: "Set the group's name",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: true,
        isPrivateOnly: false,
        emoji: "✏️",
        execute: async (sock, m, args) => {
            const newName = args.join(" ");
            if (!newName) {
                return await kord.freply(m, "Please provide a new name for the group.");
            }
            try {
                await sock.groupUpdateSubject(m.key.remoteJid, newName);
                await kord.freply(m, `Group name has been updated to: ${newName}`);
            } catch (error) {
                await kord.freply(m, "Failed to update group name. Make sure I have the necessary permissions.");
            }
        }
    },
    {
        usage: ["setgcpp"],
        desc: "Set the group's profile picture",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: true,
        isPrivateOnly: false,
        emoji: "🖼️",
        execute: async (sock, m) => {
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

                // Update the group profile picture
                await sock.updateProfilePicture(m.key.remoteJid, { url: tempFilePath });

                await global.kord.reply(m, "✅ Group profile picture has been updated.");
            } catch (error) {
                console.error("Error in setgcpp:", error);
                await global.kord.reply(m, "❌ Failed to update group profile picture. Make sure I have the necessary permissions and the image is valid.");
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
    },
    {
        usage: ["mute"],
        desc: "Mute the group (only admins can send messages)",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: true,
        isPrivateOnly: false,
        emoji: "🔇",
        execute: async (sock, m) => {
            try {
                await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
                await kord.freply(m, "Group has been muted. Only admins can send messages now.");
            } catch (error) {
                await kord.freply(m, "Failed to mute the group. Make sure I have the necessary permissions.");
            }
        }
    },
    {
        usage: ["unmute"],
        desc: "Unmute the group (allow all participants to send messages)",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: true,
        isPrivateOnly: false,
        emoji: "🔊",
        execute: async (sock, m) => {
            try {
                await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement');
                await kord.freply(m, "Group has been unmuted. All participants can send messages now.");
            } catch (error) {
                await kord.freply(m, "Failed to unmute the group. Make sure I have the necessary permissions.");
            }
        }
    },
    {
        usage: ["setdesc"],
        desc: "Set the group's description",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: true,
        isPrivateOnly: false,
        emoji: "📝",
        execute: async (sock, m, args) => {
            const newDesc = args.join(" ");
            if (!newDesc) {
                return await kord.freply(m, "Please provide a new description for the group.");
            }
            try {
                await sock.groupUpdateDescription(m.key.remoteJid, newDesc);
                await kord.freply(m, "Group description has been updated.");
            } catch (error) {
                await kord.freply(m, "Failed to update group description. Make sure I have the necessary permissions.");
            }
        }
    },
    {
        usage: ["glink", "gclink"],
        desc: "Get the group's invite link",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: true,
        isPrivateOnly: false,
        emoji: "🔗",
        execute: async (sock, m) => {
            try {
                const inviteCode = await sock.groupInviteCode(m.key.remoteJid);
                await kord.freply(m, `Group invite link: https://chat.whatsapp.com/${inviteCode}`);
            } catch (error) {
                await kord.freply(m, "Failed to get group invite link. Make sure I have the necessary permissions.");
            }
        }
    },
    {
        usage: ["gclinkreset"],
        desc: "Reset the group's invite link",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: true,
        isPrivateOnly: false,
        emoji: "🔄",
        execute: async (sock, m) => {
            try {
                await sock.groupRevokeInvite(m.key.remoteJid);
                const newInviteCode = await sock.groupInviteCode(m.key.remoteJid);
                await kord.freply(m, `Group invite link has been reset. New link: https://chat.whatsapp.com/${newInviteCode}`);
            } catch (error) {
                await kord.freply(m, "Failed to reset group invite link. Make sure I have the necessary permissions.");
            }
        }
    },
    {
        usage: ["createpoll"],
        desc: "Create a poll in the group",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: true,
        isPrivateOnly: false,
        emoji: "📊",
        execute: async (sock, m, args) => {
            if (args.length < 3) {
                return await kord.freply(m, "Please provide a question and at least two options. Format: !createpoll Question | Option1 | Option2 | ...");
            }
            const [question, ...options] = args.join(" ").split("|").map(item => item.trim());
            if (options.length < 2) {
                return await kord.freply(m, "Please provide at least two options for the poll.");
            }
            try {
                await sock.sendMessage(m.key.remoteJid, {
                    poll: {
                        name: question,
                        values: options,
                        selectableCount: 1
                    }
                });
            } catch (error) {
                await kord.freply(m, "Failed to create poll. This feature might not be supported in your WhatsApp version.");
            }
        }
    },
    {
        usage: ["gcjid"],
        desc: "Get the group's JID (ID)",
        commandType: "Group",
        isGroupOnly: true,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "🆔",
        execute: async (sock, m) => {
            await kord.freply(m, `Group JID: ${m.key.remoteJid}`);
        }
    },
    {
    usage: ["savecontact"],
    desc: "Save all group members' contacts as a vCard file",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    isPrivateOnly: false,
    emoji: "📠",
    execute: async (sock, m) => {
        try {
            // Fetch group metadata
            const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
            
            // Generate vCard for each member
            let vCards = '';
            for (const participant of groupMetadata.participants) {
                const jid = participant.id;
                
                // Try to get the name from participant data
                let name = participant.notify || jid.split('@')[0] || 'Unknown';
                
                // Parse phone number
                const phoneNumber = jid.split('@')[0];
                const formattedNumber = '+' + phoneNumber;
                
                // Create vCard for this contact
                const card = `BEGIN:VCARD
VERSION:3.0
FN:${name}
N:${name};;;
TEL;TYPE=CELL:${formattedNumber}
END:VCARD
`;
                
                vCards += card + '\n';
                
                // Debugging: Log each vCard
                console.log(`Generated vCard for ${name}:\n${card}`);
            }
            
            // Create a buffer from the vCards string
            const vcfBuffer = Buffer.from(vCards, 'utf-8');
            
            // Send the vCard file
            await sock.sendMessage(m.key.remoteJid, {
                document: vcfBuffer,
                fileName: 'group_contacts.vcf',
                mimetype: 'text/vcard',
            }, { quoted: m });
            
            await kord.freply(m, "Group contacts have been saved and sent as a vCard file.");
        } catch (error) {
            console.error("Error in savecontact command:", error);
            await kord.freply(m, "Failed to save group contacts. Please try again later.");
        }
    }
}
];