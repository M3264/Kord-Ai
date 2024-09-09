// const axios = require('axios');
// const tf = require('@tensorflow/tfjs-node');
// const nsfw = require('nsfwjs');

// module.exports = {
//     event: ['messages.upsert'],
//     desc: 'Deletes inappropriate images if found in messages.',
//     isEnabled: settings.DELETE_WA_LINKS,

//     async execute(sock, ms) {
//         const m = ms.messages[0];
//         const imageMessage = m.message?.imageMessage;

//         // Function to classify an image using NSFWJS
//         async function classifyImage(url) {
//             const pic = await axios.get(url, { responseType: 'arraybuffer' });
//             const image = await tf.node.decodeImage(pic.data, 3);
//             const predictions = await nsfwModel.classify(image);
//             image.dispose();
//             return predictions;
//         }

//         // Load NSFWJS model (you can load this once globally to avoid reloading on each message)
//         const nsfwModel = await nsfw.load();

//         // Handle image messages
//         if (imageMessage) {
//             const imageUrl = await sock.downloadMediaMessage(m);
//             const predictions = await classifyImage(imageUrl);

//             const inappropriate = predictions.some(prediction => 
//                 prediction.className === 'Porn' || 
//                 prediction.className === 'Sexy' || 
//                 prediction.className === 'Hentai'
//             );

//             if (inappropriate) {
//                 await sock.sendMessage(m.key.remoteJid, { delete: m.key });
//                 console.log(`Deleted inappropriate image in chat ${m.key.remoteJid}`);
//             }
//         }
//     }
// };
