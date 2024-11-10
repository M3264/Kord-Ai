const fetch = require('node-fetch');
const { writeFileSync } = require('fs');
const path = require('path');

module.exports = {
    usage: ["element", "ptable"],
    desc: "Fetches information about an element from the periodic table using the Popcat API.",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🔬",

    async execute(sock, m, args) {
        try {
            // Check if the element name is provided
            if (!args.length) {
                return await kord.reply(m, "❌ Please provide an element name.");
            }

            // Construct the query URL with the element name
            const elementName = encodeURIComponent(args.join(" "));
            const apiUrl = `https://api.popcat.xyz/periodic-table?element=${elementName}`;

            // Fetch the element data from the API
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if the API returned valid data
            if (response.status !== 200 || !data.name) {
                return await kord.reply(m, "❌ No data found for the specified element.");
            }

            // Fetch the image of the element
            const imageUrl = data.image;
            const responseText = `
*Element Name:* ${data.name}
*Symbol:* ${data.symbol}
*Atomic Number:* ${data.atomic_number}
*Atomic Mass:* ${data.atomic_mass}
*Period:* ${data.period}
*Phase:* ${data.phase}
*Discovered By:* ${data.discovered_by}

*Summary:* ${data.summary}
`;

            // Send the image along with the element details as the caption
            await kord.sendImage(m, imageUrl, responseText);

        } catch (error) {
            console.error("Error fetching element data:", error);
            await kord.reply(m, "❌ An error occurred while fetching the element data. Please try again.");
        }
    }
};
