module.exports = {
    usage: ["sendandclear"],
    desc: "Send a message to someone and then clear it from your chat history.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📨",

    async execute(sock, m, args) {
        try {
            const recipientJid = args[0] + '@s.whatsapp.net';  // Assumes the number is provided in the first argument
            const messageContent = args.slice(1).join(" ");  // Joins the remaining arguments as the message content

            // Send the message to the recipient
            const sentMessage = await sock.sendMessage(recipientJid, { text: messageContent });

            // Clear the sent message from your chat history
            await sock.chatModify(
                { clear: { messages: [{ id: sentMessage.key.id, fromMe: true, timestamp: sentMessage.messageTimestamp }] } },
                recipientJid,
                []
            );
        } catch (error) {
            console.error("Error sending and clearing message:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "An error occurred while sending and clearing the message." });
        }
    }
};