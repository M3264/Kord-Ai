// ./src/Against/WelcomeMessage.js

module.exports = {
    event: ['group-participants.update'],
    desc: 'Sends a welcome message when new members join the group.',
    isEnabled: settings.SEND_WELCOME_MESSAGE,

    async execute(sock, eventData) {
        if (eventData.action === 'add') {
            const chatId = eventData.id;
            const newMembers = eventData.participants;
            const groupMetadata = await sock.groupMetadata(eventData.id);
            const myID = sock.user.id.split(':')[0] + '@s.whatsapp.net'; // Extract the bot's ID without the resource part

            const isBotAdmin = groupMetadata.participants.some(
                (participant) => participant.id === myID && participant.admin !== null
            );

            if (isBotAdmin) {
                for (const newMember of newMembers) {
                    try {
                        const welcomeMessage = formatWelcomeMessage(newMember, settings.WELCOME_MESSAGE);
                        await sock.sendMessage(chatId, { text: welcomeMessage });
                    } catch (error) {
                        console.error("Error sending welcome message:", error); // Log errors for debugging
                    }
                }
            } else {
                return
            }


        }
    }
};

function formatWelcomeMessage(newMember, template) {
    const mention = `@${newMember.split('@')[0]}`;  // Extract username for mention
    return template.replace(/@user/g, mention);
}
