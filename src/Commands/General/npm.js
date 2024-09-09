const fetch = require('node-fetch');

module.exports = {
    usage: ["npm"],
    desc: "Searches the npm registry for a specified package using the GiftedTech Nexus API.",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📦",

    async execute(sock, m, args) {
        try {
            // Check if the package name is provided
            if (!args.length) {
                return kord.reply(m, "❌ Please provide a package name to search for.");
            }

            // Construct the query URL with the package name
            const packageName = encodeURIComponent(args.join(" "));
            const apiKey = "gifted"; // Provided API key
            const apiUrl = `https://api.giftedtechnexus.co.ke/api/search/npmsearch?packagename=${packageName}&apikey=${apiKey}`;

            // Fetch the results from the API
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if the API returned an error or no results
            if (response.status !== 200 || !data.results || data.results.length === 0) {
                return kord.reply(m, "❌ No results found for the specified package name.");
            }

            // Extract and format the search results
            const result = data.results[0]; // Assuming we're interested in the first result
            const responseText = `
*Package Name:* ${result.name}
*Version:* ${result.version}
*Description:* ${result.description}
*Author:* ${result.author}
*Link:* [${result.name}](${result.url})
`;

            // Send the formatted result back to the user
            await kord.reply(m, responseText);

        } catch (error) {
            console.error("Error executing npm command:", error);
            await kord.reply(m, "❌ An error occurred while processing your request. Please try again.");
        }
    }
};