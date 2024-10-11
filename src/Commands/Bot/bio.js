module.exports = {
    usage: ["setbio", "bio"],
    desc: "Updates the Bot's bio",
    commandType: "utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "⚙️",

    async execute(sock, m, args) {
            if (!args[0]) return await global.kord.freply(m, 'Provide a text to update bio');
            const newBio = args[0];
            try {
            await sock.updateProfileStatus(newBio);
            await kord.freply(m, "Successfullly Updated!✨");
        } catch (error) {
            console.error('Error updating bio', error.message);
            await kord.freply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};