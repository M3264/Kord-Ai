const fetch = require('node-fetch');

module.exports = {
    usage: "wiki",
    desc: "Searches Wikipedia for the given term and returns a summary.",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📚",

    async execute(sock, m, args) {
        try {
            // Check if the query is provided
            if (!args.length) {
                return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a search term." });
            }

            // Construct the query URL with user input
            const query = encodeURIComponent(args.join(" "));
            const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;

            // Fetch the results from the Wikipedia API
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if the API returned an error
            if (response.status !== 200 || data.type === 'https://en.wikipedia.org/api/rest_v1/page/summary/Error') {
                return sock.sendMessage(m.key.remoteJid, { text: `❌ Error fetching results: ${data.detail || 'Unknown error'}` });
            }

            // Extract and format the summary
            const title = data.title;
            const extract = data.extract;

            // Send the formatted results back to the user
            await sock.sendMessage(m.key.remoteJid, { text: `*${title}*\n\n${extract}` || "No results found for your query." });

        } catch (error) {
            console.error("Error executing .wiki command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred while processing your request. Please try again." });
        }
    }
};