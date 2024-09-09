const googlethis = require('googlethis');

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

            // Search Google
            const options = {
                page: 0,
                safe: false,
                additional_params: {
                    hl: 'en'
                }
            };

            const response = await googlethis.search(query, options);

            // Extract and format the search results
            const results = response.results.map((result, index) => (
                `*${index + 1}. ${result.title}*
                ${result.description}
                [Link](${result.url})`
            )).join(" ");

            // Send the formatted results back to the user
            await kord.reply(m, results || "No results found for your query.");

        } catch (error) {
            console.error("Error executing .google command:", error);
            await kord.reply(m, "❌ An error occurred while processing your request. Please try again.");
        }
    }
};