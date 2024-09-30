const axios = require('axios');
const fs = require('fs'); // Regular fs for streams
const fsPromises = require('fs').promises; // Promise-based fs for async operations
const path = require('path');
const os = require('os');
const FormData = require('form-data');

module.exports = {
    usage: ["ocr", "itt"],
    desc: "Extract text from an image using OCR.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",

    async execute(sock, m, args) {
        let tempFilePath;
        let mediaBuffer;
        let fileExtension;

        try {
            // Check if the message is quoted
            if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage) {
                const quotedMedia = await global.kord.downloadQuotedMedia(m);

                if (quotedMedia) {
                    mediaBuffer = quotedMedia.buffer;
                    fileExtension = quotedMedia.extension; // Get the file extension
                } else {
                    return await global.kord.reply(m, "❌ Failed to download the quoted media.");
                }
            } else {
                // No quoted message, download media from the main message
                const mediaMsg = await global.kord.downloadMediaMsg(m);

                if (mediaMsg) {
                    mediaBuffer = mediaMsg.buffer;
                    fileExtension = mediaMsg.extension; // Get the file extension
                } else {
                    return await global.kord.reply(m, "❌ Failed to download the media.");
                }
            }

            // Create a temporary file path
            tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${fileExtension}`);

            // Save the media to the temp file
            await fsPromises.writeFile(tempFilePath, mediaBuffer);
            console.log("File downloaded to:", tempFilePath);

            // Upload the image to itzprire.com for OCR
            const formData = new FormData();
            formData.append('file', fs.createReadStream(tempFilePath)); // Use regular fs for streams

            const uploadResponse = await axios.post('https://itzpire.com/tools/upload', formData, {
                headers: {
                    ...formData.getHeaders(),
                }
            });

            const uploadResult = uploadResponse.data;

            if (uploadResult.status === 'success') {
                const fileUrl = uploadResult.fileInfo.url;
                
                // Perform OCR on the uploaded image
                const ocrResponse = await axios.get(`https://itzpire.com/tools/ocr?url=${encodeURIComponent(fileUrl)}`);
                const ocrResult = ocrResponse.data;

                if (ocrResult.status === 'success') {
                    const parsedText = ocrResult.data.ParsedText || 'No text found.';
                    await sock.sendMessage(m.key.remoteJid, { text: `📝 Extracted Text:\n\n${parsedText}` }, { quoted: m });
                } else {
                    throw new Error('OCR processing failed: ' + (ocrResult.data.ErrorMessage || 'Unknown error'));
                }
            } else {
                throw new Error('Upload failed: ' + (uploadResult.message || 'Unknown error'));
            }

        } catch (error) {
            console.error("Error in ocr command:", error.response ? error.response.data : error.message);

            // Send error message
            if (error.response) {
                await sock.sendMessage(m.key.remoteJid, { text: `🤖 Oops! Something went wrong.\n\nError: ${error.response.data.message || error.message}` }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: `🤖 Oops! Something went wrong.\n\nError: ${error.message}` }, { quoted: m });
            }
        } finally {
            // Clean up: delete the temporary file
            if (tempFilePath) {
                try {
                    await fsPromises.unlink(tempFilePath);
                    console.log("Temporary file deleted:", tempFilePath);
                } catch (unlinkError) {
                    console.error("Error deleting temporary file:", unlinkError);
                }
            }
        }
    }
};
