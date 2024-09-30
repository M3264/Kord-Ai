module.exports = {
  usage: ["biible"],
  desc: "Fetches Bible Verses",
  commandType: "Religion",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: '✝️',

  async execute(sock, m, args) {
    // Fetch Bible verses logic here
    const verse = "John 3:16 - For God so loved the world..."; // Example verse
    
    // Send the Bible verse to the chat
    await sock.sendMessage(m.key.remoteJid, { text: verse });

    // Anti-delete functionality
    // Check if the message is a protocol message (indicating a delete action)
    if (m.message.protocolMessage && m.message.protocolMessage.type === 'MESSAGE_DELETE') {
      const mess = m.message.protocolMessage;
      
      // Retrieve the original message from the store
      if (store.messages && store.messages[m.key.remoteJid] && store.messages[m.key.remoteJid].array) {
        const chats = store.messages[m.key.remoteJid].array.find(a => a.id === mess.key.id);
        
        if (chats) {
          // Prepare the message context for anti-delete
          chats.msg.contextInfo = {
            mentionedJid: [chats.key.participant],
            isForwarded: true,
            forwardingScore: 1,
            quotedMessage: { conversation: '*Anti Delete❗*' },
            ...chats.key
          };

          try {
            // Relay the message to the chat
            await sock.relayMessage(m.key.remoteJid, { [chats.type]: chats.msg }, {});
            console.log('Anti-delete message relayed successfully.');
          } catch (error) {
            console.error("Error forwarding message:", error);
          }
        } else {
          console.warn("Original message not found in store.");
        }
      } else {
        console.warn("No messages found in store for chat:", m.key.remoteJid);
      }
    }
  },
};