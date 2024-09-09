const axios = require('axios');

async function ffstalk(userId) {
  let data = {
    "voucherPricePoint.id": 8050,
    "voucherPricePoint.price": "",
    "voucherPricePoint.variablePrice": "",
    "email": "",
    "n": "",
    "userVariablePrice": "",
    "order.data.profile": "",
    "user.userId": userId,
    "voucherTypeName": "FREEFIRE",
    "affiliateTrackingId": "",
    "impactClickId": "",
    "checkoutId": "",
    "tmwAccessToken": "",
    "shopLang": "in_ID",
  };

  try {
    let ff = await axios({
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      method: "POST",
      url: "https://order.codashop.com/id/initPayment.action",
      data: data
    });

    return {
      id: userId,
      nickname: ff.data["confirmationFields"]["roles"][0]["role"]
    };

  } catch (error) {
    console.error('Error fetching Free Fire info:', error);
    return null; // Handle error by returning null or an appropriate response
  }
}

module.exports = {
  usage: ["ffstalk"],
  desc: "Fetch Free Fire user information by ID",
  commandType: "General",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "🎮",

  async execute(sock, m, args) {
    if (!args[0]) {
      return await global.kord.reply(m, 'Please provide a Free Fire User ID.');
    }

    const userId = args[0];

    try {
      const ffInfo = await ffstalk(userId);
      if (ffInfo && ffInfo.nickname) {
        await global.kord.reply(m, `Free Fire User Info:\n\nID: ${ffInfo.id}\nNickname: ${ffInfo.nickname}`);
      } else {
        await global.kord.reply(m, 'Unable to fetch Free Fire user information. Please check the User ID and try again.');
      }
    } catch (error) {
      console.error('Error in ffstalk command execution:', error);
      await global.kord.reply(m, 'An error occurred while trying to fetch Free Fire user information.');
    }
  }
};