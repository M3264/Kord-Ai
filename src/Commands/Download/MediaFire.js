const { mediafiredl } = require('@bochilteam/scraper');

module.exports = {
    usage: ["mediafire"],
    desc: "Download files from Mediafire",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "💾",

    async execute(sock, m, args) {
        try {
            // Check if a link is provided
            if (!args[0]) {
                return await global.kord.freply(m, `❌ Enter the Mediafire link next to the command.`);
            }

            // Validate if the link is a Mediafire link
            if (!args[0].match(/mediafire/gi)) {
                return await global.kord.freply(m, `❌ The provided link is incorrect.`);
            }

            // Prepare the link for processing
            let u = /https?:\/\//.test(args[0]) ? args[0] : 'https://' + args[0];

            // Fetch mediafire download info
            const res = await mediafiredl(u);
            let { url, url2, filename, ext, aploud, filesize, filesizeH } = res;

            // Create a caption with the download info
            let caption = `
≡ *MEDIAFIRE DOWNLOAD*

▢ *File Name:* ${filename}
▢ *Size:* ${filesizeH}
▢ *Extension:* ${ext}
▢ *Uploaded:* ${aploud}
`.trim();

            // Send the file or the download link back to the user
            await global.kord.sendDocument(m, url || url2, caption, { mimetype: 'application/octet-stream', fileName: filename });
            
        } catch (error) {
            console.error('Error fetching Mediafire link:', error);
            await global.kord.freply(m, `❌ Failed to fetch Mediafire link. Error: ${error.message}`);
        }
    }
};