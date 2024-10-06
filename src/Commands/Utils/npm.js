const fetch = require('node-fetch');

module.exports = {
    usage: ["npm"],
    desc: "Searches the npm registry for a specified package using the Popcat API.",
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
            const apiUrl = `https://api.popcat.xyz/npm?q=${packageName}`;

            // Fetch the results from the API
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if the API returned an error or no results
            if (response.status !== 200 || !data.name) {
                return kord.reply(m, "❌ No results found for the specified package name.");
            }

            // Extract and format the search results
            const responseText = `
*Package Name:* ${data.name}
*Version:* ${data.version}
*Description:* ${data.description}
*Author:* ${data.author} (${data.author_email || "No email"})
*Last Published:* ${data.last_published}
*Downloads This Year:* ${data.downloads_this_year}
*Repository:* ${data.repository || "None"}
`;

            // Send the formatted result back to the user
            await kord.reply(m, responseText);

        } catch (error) {
            console.error("Error executing npm command:", error);
            await kord.reply(m, "❌ An error occurred while processing your request. Please try again.");
        }
    }
};
