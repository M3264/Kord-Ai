const http = require('http');

module.exports = {
    usage: ["ip", "ipbot"],
    desc: "Fetch the ip address of the bot",
    commandType: "utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "💬",

    async execute(sock, m, args) {
        try {
            http.get({
                'host': 'api.ipify.org',
                'port': 80,
                'path': '/'
            }, function(resp) {
                let data = '';
                resp.on('data', function(chunk) {
                    data += chunk;
                });
                resp.on('end', function() {
                    kord.reply(m, `🔎 My public IP address is: ${data}`);
                });
            }).on('error', function(err) {
                throw err;
            });
        } catch (error) {
            console.error('Error fetching ip:', error.message);
            await kord.reply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};