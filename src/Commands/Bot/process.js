// commands/shutdown.js
const { exec } = require("child_process");

module.exports = [
  {
  usage: "shutdown",
  emoji: "⚙️",
  isOwnerOnly: true,
  
  execute: async (sock, m, args, kord) => {
    try {
      await kord.reply("Shutting down bot...");
      
      // Using PM2 to stop the process properly
      exec("npx pm2 stop kord-ai", (err) => {
        if (err) {
          kord.reply(`Failed to shutdown\nError: ${err}`);
          return;
        }
        // PM2 will handle the graceful shutdown
      });
    } catch (error) {
      await kord.reply(`Error during shutdown: ${error.message}`);
    }
  }
  },
  {
  usage: "restart",
  emoji: "⚙️",
  isOwnerOnly: true,
  
  execute: async (sock, m, args, kord) => {
    try {
      await kord.reply("Restarting bot...");
      
      // Using PM2 to restart the process
      exec("npx pm2 restart kord-ai", (err) => {
        if (err) {
          kord.reply(`Failed to restart\nError: ${err}`);
          return;
        }
        // PM2 will handle the restart
      });
    } catch (error) {
      await kord.reply(`Error during restart: ${error.message}`);
    }
  }
  },
  {
  usage: "forcekill",
  emoji: "⚙️",
  isOwnerOnly: true,
  
  execute: async (sock, m, args, kord) => {
    try {
      await kord.reply("Force killing process...");
      
      // First try graceful shutdown through PM2
      exec(`npx pm2 delete kord-ai`, (err) => {
        if (err) {
          // If PM2 fails, use force kill as fallback
          exec("kill -9 " + process.pid, (killErr) => {
            if (killErr) {
              kord.reply(`Failed to kill process\nError: ${killErr}`);
              return;
            }
          });
          return;
        }
      });
    } catch (error) {
      await kord.reply(`Error during force kill: ${error.message}`);
    }
  }
  },
  {
  usage: "status",
  emoji: "⚙️",
  isOwnerOnly: true,
  
  execute: async (sock, m, args, kord) => {
    try {
      exec("npx pm2 status kord-ai", async (err, stdout, stderr) => {
        if (err) {
          await kord.reply(`Error getting status: ${err}`);
          return;
        }
        
        // Format the PM2 status output to be more readable
        const statusText = stdout
          .split('\n')
          .filter(line => line.includes('kord-ai'))
          .join('\n');
          
        await kord.reply(`Bot Status:\n${statusText}`);
      });
    } catch (error) {
      await kord.reply(`Error checking status: ${error.message}`);
    }
  },
}
]