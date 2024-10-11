module.exports = {
    usage: ["setname"],
    desc: "Set your WhatsApp profile name",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: true,
    isOwnerOnly: true,
    emoji: "📝",
    execute: async (sock, m, args) => {
        try {
            // Check if a new name is provided
            const newName = args.join(" ");
            if (!newName) {
                await kord.reply(m, 'Please provide a new name to set.');
                await kord.react(m, '❌');
                return;
            }

            console.log('Updating profile name to:', newName);

            // Update the profile name
            await sock.updateProfileName(newName);
            console.log('Profile name updated successfully');

            await kord.reply(m, 'Your WhatsApp profile name has been updated successfully! 🎉');
            await kord.react(m, '✅');
        } catch (error) {
            console.error('Error updating profile name:', error);
            await kord.reply(m, `Failed to update profile name. \nError: ${error.message}`);
            await kord.react(m, '❌');
        }
    }
};