const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { delay } = require('@whiskeysockets/baileys');
const path = require('path');
const os = require('os');
const fsPromises = require('fs').promises;

// Emojis for more expressive messages
const emojis = {
    cartoon: '🎨',
    processing: '⚙️',
    success: '✨',
    error: '❌',
    face: '😊',
    noface: '🙈',
    sticker: '🖼️',
    download: '📥'
};

module.exports = {
    usage: ["tocartoon"],
    desc: "Converts an image to a cartoon style and creates a sticker.",
    commandType: "AI",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.cartoon,

    async execute(sock, m, args) {
        let mediaBuffer, fileExtension, tempFilePath;

        try {
            await kord.react(m, emojis.processing);

            // Check if there's a quoted message with media
            const quotedMedia = await kord.getQuotedMedia(m);
            
            if (!quotedMedia) {
                await kord.freply(m, `${emojis.error} Please reply to an image to convert it to a cartoon.`);
                return;
            }

            const downloadedMedia = await kord.downloadQuotedMedia(m);

            if (downloadedMedia) {
                mediaBuffer = downloadedMedia.buffer;
                fileExtension = downloadedMedia.extension;
            } else {
                throw new Error("Failed to download the quoted media.");
            }

            // Create a temporary file path
            tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${fileExtension}`);

            // Save the media to the temp file
            await fsPromises.writeFile(tempFilePath, mediaBuffer);
            console.log("File downloaded to:", tempFilePath);

            await kord.freply(m, `${emojis.processing} Converting your image to cartoon...`);

            const cartoonResult = await Cartoon(tempFilePath);

            if (cartoonResult.message === 'success') {
                const sentMsg = await kord.sendImage(
                    m,
                    cartoonResult.download.full,
                    `${emojis.success} Cartoon conversion complete!`
                );

                const sticker = new Sticker(cartoonResult.download.head, {
                    pack: global.packname,
                    author: "Kord-Ai",
                    type: StickerTypes.FULL,
                    categories: ['🤩', '🎉'],
                    id: randomId(),
                    quality: 100,
                    background: '#00000000',
                });

                await sock.sendMessage(m.key.remoteJid, await sticker.toMessage(), { quoted: m });
                await kord.react(m, emojis.sticker);

                // Delay and then edit the message for a dramatic reveal
                await delay(1500);
                await kord.editMsg(m, sentMsg, `${emojis.success} Cartoon conversion complete!\n\n${emojis.sticker} Bonus: Check out that awesome sticker!`);
            } else {
                throw new Error('No face detected in the image');
            }
        } catch (error) {
            console.error(`[ERROR] Cartoon Conversion:`, error);
            await kord.react(m, emojis.error);
            if (error.message === 'No face detected in the image') {
                await kord.freply(m, `${emojis.noface} Oops! I couldn't find a face in that image. Can you try another one with a clear face?`);
            } else {
                await kord.freply(m, `${emojis.error} Uh oh! Something went wrong during the cartoon conversion. ${error.message}`);
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

async function GetBuffer(filepath) {
    return await fsPromises.readFile(filepath);
}

function GetType(Data) {
    return new Promise((resolve) => {
        let Result, Status;
        if (Buffer.isBuffer(Data)) {
            Result = Data.toString('base64');
            Status = 0;
        } else {
            Status = 1;
        }
        resolve({
            status: Status,
            result: Result,
        });
    });
}

async function Cartoon(filepath) {
    return new Promise(async (resolve, reject) => {
        let Data;
        try {
            let buffer = await GetBuffer(filepath);
            let Base64 = await GetType(buffer);
            await axios
                .request({
                    url: 'https://access1.imglarger.com/PhoAi/Upload',
                    method: 'POST',
                    headers: {
                        connection: 'keep-alive',
                        accept: 'application/json, text/plain, */*',
                        'content-type': 'application/json',
                    },
                    data: JSON.stringify({
                        type: 11,
                        base64Image: Base64.result,
                    }),
                })
                .then(async ({ data }) => {
                    let code = data.data.code;
                    let type = data.data.type;
                    while (true) {
                        let LopAxios = await axios.request({
                            url: 'https://access1.imglarger.com/PhoAi/CheckStatus',
                            method: 'POST',
                            headers: {
                                connection: 'keep-alive',
                                accept: 'application/json, text/plain, */*',
                                'content-type': 'application/json',
                            },
                            data: JSON.stringify({
                                code: code,
                                isMember: 0,
                                type: type,
                            }),
                        });
                        let status = LopAxios.data.data.status;
                        if (status == 'success') {
                            Data = {
                                message: 'success',
                                download: {
                                    full: LopAxios.data.data.downloadUrls[0],
                                    head: LopAxios.data.data.downloadUrls[1],
                                },
                            };
                            break;
                        } else if (status == 'noface') {
                            Data = {
                                message: 'noface',
                            };
                            break;
                        }
                        await delay(2000); // Wait for 2 seconds before checking again
                    }
                });
        } catch (error) {
            Data = false;
        } finally {
            if (Data === false) {
                reject(new Error('Cartoon conversion failed'));
            }
            resolve(Data);
        }
    });
}

function randomId() {
    return Math.floor(100000 + Math.random() * 900000);
}