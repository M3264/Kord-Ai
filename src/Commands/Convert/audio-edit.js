const { toAudio,
    toPTT,
    toVideo,
    extractUrlsFromString
} = require("../../Plugin/funcs")
const fs = require('fs');
const fsp = require("fs").promises
const ffmpeg = require('fluent-ffmpeg')
const ff = require("fluent-ffmpeg")
const path = require('path');
const { getBuffer, isMediaURL } = require("../../Plugin/tools")
const {
   read
} = require('jimp');
const {
   fromBuffer
} = require('file-type');
let input;
let output;

const mediaDir = './media';
if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
}

async function processAudio(sock, m, effect, options) {
    const inputPath = await sock.downloadAndSaveMediaMessage(m.quoted);
    const outputPath = `./media/${effect}.mp3`;

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions(options)
            .save(outputPath)
            .on('error', (err) => {
            console.error(err)
                reject(`${err}`);
            })
            .on('end', async () => {
                resolve(outputPath);
                fs.unlinkSync(inputPath);
            });
    });
}

module.exports = [
  {
    usage: "voice",
    desc: "converts audio to ptt",
    commamdType: "Converter",
    emoji: "🫆",
    
    execute: async(sock, m, args, kord) => {
      try {
      if (!m.quoted || (!m.quoted.audio && !m.quoted.video)) return kord.reply("*_reply to a video/audio_*")
      let media = await toPTT(await m.quoted.download())
      return await m.send(media,{
        mimetype: 'audio/mpeg',
        ptt: true
    }, 'audio')
      } catch (e) {
        console.error(e)
        kord.send(`${e}`)
      }
    }
  },
    {
        usage: "bass",
        desc: "Apply bass effect to audio",
        commandType: "Converter",
        emoji: "🔊",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "bass", [
                    "-af", "equalizer=f=54:width_type=o:width=2:g=20"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath); 
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "deep",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "deep", [
                    "-af atempo=4/4,asetrate=44500*2/3"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath);
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "blown",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "blown", [
                    "-af acrusher=.1:1:64:0:log"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath);
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "earrape",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "earrape", [
                    "-af volume=12"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath);
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "fast",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "fast", [
                    "-filter:a atempo=1.63,asetrate=44100"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath);
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "fat",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "fat", [
                    "-filter:a atempo=1.6,asetrate=22100"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath);
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "nightcore",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "nightcore", [
                    "-filter:a atempo=1.06,asetrate=44100*1.25"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath);
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "reverse",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "reverse", [
                    "-filter_complex areverse"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath);
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "squirrel",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                const outputPath = await processAudio(sock, m, "squirrel", [
                    "-filter:a atempo=0.5,asetrate=65100"
                ]);
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                fs.unlinkSync(outputPath);
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
        usage: "slow",
        desc: "Apply voice effect",
        commandType: "Converter",
        emoji: "🎙️",
        execute: async (sock, m, args, kord) => {
            try {
              if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
                input = await sock.downloadAndSaveMediaMessage(m.quoted)
                output = "./media/sloww.mp3"
                await ffmpeg(input)
        .audioFilter("atempo=0.5")
        .outputOptions(["-y", "-af", "asetrate=44100*0.9"])
        .save(output)
        .on('error', async(err) => {
                return await m.send(`*error while degreasing audio speed*`);
         })
        .on('end', async () => {
            await sock.sendMessage(m.key.remoteJid, {
                audio: fs.readFileSync(output),
                mimetype: 'audio/mp4',
                ptt: false
            })
            fs.unlinkSync(input);
            fs.unlinkSync(output);
      });
                
                
            } catch (error) {
                await kord.send(`${error}`)
            }
        }
    },
    {
      usage: ["black", "audio2vid"],
      desc: "converts replied audio to video",
      commandType: "Converter",
      emoji: "📽️",
      
      execute: async(sock, m, args, kord) => {
        try {
          if (!m.quoted || !m.quoted.audio) return kord.reply("*_reply to an audio_*")
          const ffmpegg = ff();
      let file = path.join(__dirname, '../../Assets/black.jpg')
      if (!fs.existsSync(file)) {
        const blackImg = await getBuffer("https://cdn.kordai.biz.id/serve/n2BwUtItyeae.jpg");
        fs.writeFileSync(file, blackImg);
      }
      if (args[0] && await isMediaURL(args[0])) {
         const buff = await getBuffer(extractUrlsFromString(args)[0])
         const readed = await read(buff);
         if (readed.getWidth() != readed.getHeight()) return await m.send('_image width and height must be same!!_');
              const {
                        mime
                } = await fromBuffer(buff);
              if (!['jpg', 'jpeg', 'png'].includes(mime.split('/')[1])) return await m.send("*_please provide a image url_*");
              file = '../../Assets/' + mime.replace('/', '.');
              fs.writeFileSync(file, buff);
      }
const audioFile = path.join(__dirname, '../../Assets/audio.mp3');
      var buf = await m.quoted.download()
      fs.writeFileSync(audioFile, buf);
      const Opath = path.join(__dirname, '../../Assets/videoMixed.mp4')
      ffmpegg.input(file);
      ffmpegg.input(audioFile);
      ffmpegg.output(Opath);
      ffmpegg.on('end', async () => {
         await m.send(fs.readFileSync(Opath), {}, 'video');
         fs.unlinkSync(audioFile)
       fs.unlinkSync(Opath)
      });
      ffmpegg.on('error', async (err) => {
         await m.send(`${err}`);
      });
    
      ffmpegg.run();
       
        } catch (err) {
          console.error(err)
          kord.send(`${err}`)
        }
      }
    }
];