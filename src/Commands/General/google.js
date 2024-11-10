const GoogleSearch = require('../../Plugin/googlesc'); // Adjust path

module.exports = {
    usage: ["google"],
    desc: "Searches Google and returns the results.",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🔍",

    async execute(sock, m, args) {
        try {
            // Check if the query is provided
            if (!args.length) {
                return kord.reply(m, "❌ Please provide a search query.");
            }

            // Construct the query
            const query = args.join(" ");

            // Initialize GoogleSearch instance
            const googleSearch = new GoogleSearch({ lang: 'en', timeout: 5000, safe: 'active' });

            // Perform the search (limit to 5 results)
            const searchResults = await googleSearch.search(query, 5);

            // Extract and format the search results
            const results = searchResults.map((result, index) => (
                `*${index + 1}. ${result.title}*\n${result.description}\n[Link](${result.url})`
            )).join("\n\n");

            // Send the formatted results back to the user
            await kord.reply(m, results || "No results found for your query🙁.");

        } catch (error) {
            console.error("Error executing .google command:", error);
            await kord.reply(m, `❌ An error occurred while processing your request. Please try again\n${error.message}.`);
        }
    }
};
