const axios = require('axios');

module.exports = [
    {
        usage: ["bing-ai"],
        desc: "Get a response from Bing AI",
        commandType: "AI",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "🤖",
        execute: async (sock, m, args) => {
            const query = args.join(" ");
            if (!query) return await global.kord.freply(m, "Please provide a query for Bing AI.", "Bing AI");
            try {
                const response = await axios.get(`https://itzpire.com/ai/bing-ai?model=Creative&q=${encodeURIComponent(query)}`);
                await global.kord.freply(m, response.data.result, "Bing AI");
            } catch (error) {
                console.error("Error with Bing AI:", error);
                await global.kord.freply(m, "Failed to get a response from Bing AI.", "Error");
            }
        }
    },
    {
        usage: ["chat"],
        desc: "Chat with Blackbox AI",
        commandType: "AI",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "💬",
        execute: async (sock, m, args) => {
            const query = args.join(" ");
            if (!query) return await global.kord.freply(m, "Please provide a message for the chat.", "Blackbox AI");
            try {
                const response = await axios.get(`https://itzpire.com/ai/blackbox-ai?q=${encodeURIComponent(query)}`);
                await global.kord.freply(m, response.data.result, "Blackbox AI");
            } catch (error) {
                console.error("Error with Blackbox AI:", error);
                await global.kord.freply(m, "Failed to get a response from the chat AI.", "Error");
            }
        }
    },
    {
        usage: ["cohere"],
        desc: "Get a response from Cohere AI",
        commandType: "AI",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "🧠",
        execute: async (sock, m, args) => {
            const query = args.join(" ");
            if (!query) return await global.kord.freply(m, "Please provide a query for Cohere AI.", "Cohere AI");
            try {
                const response = await axios.get(`https://itzpire.com/ai/cohere?q=${encodeURIComponent(query)}`);
                await global.kord.freply(m, response.data.result, "Cohere AI");
            } catch (error) {
                console.error("Error with Cohere AI:", error);
                await global.kord.freply(m, "Failed to get a response from Cohere AI.", "Error");
            }
        }
    },
    {
        usage: ["copilotrip"],
        desc: "Get travel assistance from Copilot",
        commandType: "AI",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "✈️",
        execute: async (sock, m, args) => {
            const query = args.join(" ");
            if (!query) return await global.kord.freply(m, "Please provide a travel-related query for Copilot.", "Copilot");
            try {
                const response = await axios.get(`https://itzpire.com/ai/copilot2trip?q=${encodeURIComponent(query)}`);
                await global.kord.freply(m, response.data.result, "Copilot");
            } catch (error) {
                console.error("Error with Copilot:", error);
                await global.kord.freply(m, "Failed to get a response from Copilot.", "Error");
            }
        }
    },
    {
        usage: ["gemini"],
        desc: "Get a response from Gemini AI",
        commandType: "AI",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "♊",
        execute: async (sock, m, args) => {
            const query = args.join(" ");
            if (!query) return await global.kord.freply(m, "Please provide a query for Gemini AI.", "Gemini AI");
            try {
                const response = await axios.get(`https://itzpire.com/ai/gemini-ai?q=${encodeURIComponent(query)}`);
                await global.kord.freply(m, response.data.result, "Gemini AI");
            } catch (error) {
                console.error("Error with Gemini AI:", error);
                await global.kord.freply(m, "Failed to get a response from Gemini AI.", "Error");
            }
        }
    },
    {
        usage: ["podcast"],
        desc: "Get podcast recommendations or chat",
        commandType: "AI",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "🎙️",
        execute: async (sock, m, args) => {
            const query = args.join(" ");
            if (!query) return await global.kord.freply(m, "Please provide a query for podcast recommendations or chat.", "Podcast AI");
            try {
                const response = await axios.get(`https://itzpire.com/ai/jams?q=${encodeURIComponent(query)}&type=chat`);
                await global.kord.freply(m, response.data.data.response, "Podcast AI");
            } catch (error) {
                console.error("Error with Podcast AI:", error);
                await global.kord.freply(m, "Failed to get a response from the Podcast AI.", "Error");
            }
        }
    },
    {
        usage: ["lexica"],
        desc: "Generate an image using Lexica",
        commandType: "Image",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "🖼️",
        execute: async (sock, m, args) => {
            const prompt = args.join(" ");
            if (!prompt) return await global.kord.freply(m, "Please provide a prompt for image generation.", "Lexica");
            try {
                const response = await axios.get(`https://itzpire.com/ai/lexica?prompt=${encodeURIComponent(prompt)}`);
                const imageUrl = response.data.data.images[0].url;
                await sock.sendMessage(m.key.remoteJid, { image: { url: imageUrl }, caption: `Generated image for: ${prompt}` });
            } catch (error) {
                console.error("Error with Lexica:", error);
                await global.kord.freply(m, "Failed to generate an image with Lexica.", "Error");
            }
        }
    },
    {
        usage: ["lofi"],
        desc: "Generate a Lo-Fi style image",
        commandType: "Image",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "🎨",
        execute: async (sock, m, args) => {
            const prompt = args.join(" ");
            if (!prompt) return await global.kord.freply(m, "Please provide a prompt for Lo-Fi image generation.", "Lo-Fi");
            try {
                const response = await axios.get(`https://itzpire.com/ai/lofi?prompt=${encodeURIComponent(prompt)}`);
                await sock.sendMessage(m.key.remoteJid, { image: { url: response.data.result }, caption: `Lo-Fi image for: ${prompt}` });
            } catch (error) {
                console.error("Error with Lo-Fi image generation:", error);
                await global.kord.freply(m, "Failed to generate a Lo-Fi image.", "Error");
            }
        }
    },
    {
        usage: ["tool-ai"],
        desc: "Get information from Tool AI",
        commandType: "AI",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "🛠️",
        execute: async (sock, m, args) => {
            if (args.length < 2) return await global.kord.freply(m, "Please provide a query and description for Tool AI. Usage: !tool-ai <query> | <description>", "Tool AI");
            
            const [query, description] = args.join(" ").split("|").map(arg => arg.trim());
            if (!description) return await global.kord.freply(m, "Please provide both a query and a description separated by '|'.", "Tool AI");
            
            try {
                const response = await axios.get(`https://itzpire.com/ai/Toolbot?q=${encodeURIComponent(query)}&description=${encodeURIComponent(description)}`);
                await global.kord.freply(m, response.data.result, "Tool AI");
            } catch (error) {
                console.error("Error with Tool AI:", error);
                await global.kord.freply(m, "Failed to get a response from Tool AI.", "Error");
            }
        }
    },
    {
        usage: ["3dcartoon"],
        desc: "Generate a 3D cartoon image",
        commandType: "Image",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "🎭",
        execute: async (sock, m, args) => {
            const prompt = args.join(" ");
            if (!prompt) return await global.kord.freply(m, "Please provide a prompt for 3D cartoon image generation.", "3D Cartoon");
            try {
                const response = await axios.get(`https://itzpire.com/ai/3dcartoon?prompt=${encodeURIComponent(prompt)}`);
                await sock.sendMessage(m.key.remoteJid, { image: { url: response.data.result }, caption: `3D cartoon image for: ${prompt}` });
            } catch (error) {
                console.error("Error with 3D cartoon image generation:", error);
                await global.kord.freply(m, "Failed to generate a 3D cartoon image.", "Error");
            }
        }
    }
];