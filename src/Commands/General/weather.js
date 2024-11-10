const axios = require('axios');

module.exports = {
    usage: ["weather"],
    desc: "Gives Weather info about the given location",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🌤️",

    async execute(sock, m, args) {
        try {
            // Check if the query is provided
            if (!args.length) {
                return kord.reply(m, "❌ Please provide a location query.");
            }

            // Construct the query URL with user input
            const query = args.join(" ");
            let wdata = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273&language=en`);
                let textw = `╭─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╮
┊ ️🌤️*Weather of  ${query}*    ┊
╰─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╯\n\n*Weather:-* ${wdata.data.weather[0].main}\n*Description:-* ${wdata.data.weather[0].description}\n*Avg Temp:-* ${wdata.data.main.temp}\n*Feels Like:-* ${wdata.data.main.feels_like}\n*Pressure:-* ${wdata.data.main.pressure}\n*Humidity:-* ${wdata.data.main.humidity}\n*Humidity:-* ${wdata.data.wind.speed}\n*Latitude:-* ${wdata.data.coord.lat}\n*Longitude:-* ${wdata.data.coord.lon}\n*Country:-* ${wdata.data.sys.country}\n`
            
            await sock.sendMessage(m.key.remoteJid, { text: textw || "No results found for your query." });
            
        } catch (error) {
              console.error (`Error Fetching weather info`, error);
              await kord.reply (m, 'Opps, Something Unexpected Happened')
            }
    }
};