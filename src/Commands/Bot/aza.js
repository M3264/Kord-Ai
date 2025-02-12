const fs = require("fs");
const path = require("path");

module.exports = {
  usage: ["aza"],
  desc: "Retrieve or set banking account details.",
  commandType: "Utility",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  isOwnerOnly: true,
  emoji: "💳",

  async execute(sock, m, args, kord) {
    try {
      const configPath = path.resolve(__dirname, "../../../Config.js");
      
      if (args[0] === "-set") {
        const [bank, accNumber, accName] = args.slice(1);

        if (!bank || !accNumber || !accName) {
          console.error("Incomplete banking details");
          
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react( "🚫");
            await kord.sendErr( args, {
              context: "Banking Details Set",
              info: "Incomplete banking details provided",
              example: ".aza -set <Bank> <Account Number> <Account Name>"
            });
            return;
          } else {
            return await kord.freply(
              
              "Invalid usage. Example:\n.aza -set <Bank> <Account Number> <Account Name>"
            );
          }
        }

        try {
          const configContent = fs.readFileSync(configPath, "utf8");
         
          const updatedContent = configContent.replace(
            /BANKING_DETAILS:\s*{[^}]*}/,
            `BANKING_DETAILS: {\n  bank: "${bank}",\n  acc_number: "${accNumber}",\n  acc_name: "${accName}"\n}`
          );

          fs.writeFileSync(configPath, updatedContent, "utf8");
          
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react( "✅");
            await kord.sendErr( "done", {
              context: "Account Details",
              info: "Aza Details Successfully Set",
            });
          } else {
            await kord.freply( "Banking details have been updated successfully!");
          }
        } catch (writeError) {
          console.error("Error writing to config file:", writeError);
          await kord.freply( `Failed to update banking details: ${writeError.message}`);
          return;
        }
        return; // Add return to exit after setting details
      }

      // Retrieve banking details
      const { bank, acc_number: accNumber, acc_name: accName } = global.settings.BANKING_DETAILS || {};
      
      const isDefaultConfig =
        bank === "Kord-Ai Bank" &&
        accNumber === "1234567890" &&
        accName === "MyAccountName";

      if (!bank || !accNumber || !accName || isDefaultConfig) {
        console.error("Banking details not configured");
        
        if (global.settings?.INVINCIBLE_MODE) {
          await kord.react( "🚫");
          await kord.sendErr( {}, {
            context: "Banking Details Retrieval",
            info: "Banking details not configured"
          });
          return;
        } else {
          return await kord.freply( "_Not Configured_\n_Example: .aza -set Bankname AccNo AccName_");
        }
      }

      const reply = `
〄━━━━━━━━━━━━━
╏⑉ 🏦 Bank Details
〄━━━━━━━━━━━━━
╏ *Bank Name:* ${bank}
╏
╏ *Account Number:* ${accNumber}
╏
╏ *Account Name:* ${accName}
╏
〄━━━━━━━━━━━━━
〄━━━━━━━━━━━━━
      `.trim();

      const imageUrl = "https://files.catbox.moe/el3qx7.png";

      await kord.sendImage( imageUrl, reply);

    } catch (error) {
      console.error("Critical Error in Banking Details Command:", error);

      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react( "🚫");
        await kord.sendErr( error, {
          context: "Account Details",
          info: "Failed to process the command",
        });
      } else {
        await kord.freply(
          
          `Failed to process the command. Please try again later.\nError: ${error.message}`
        );
      }
    }
  },
};