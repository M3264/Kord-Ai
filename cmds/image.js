/* 
 * Copyright © 2025 Kenny
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const {
   kord,
   wtype,
   prefix,
   remini,
   upscaleImage,
   config,
   Baileys
} = require("../core")


const getImageUrl = async (m) => {
    if (m.quoted.image) {
        return await m.upload(await m.quoted.download(), "temp")
    } else if (m.quoted.sender) {
        return await m.client.profilePictureUrl(m.quoted.sender, 'image')
    }
    throw new Error("No valid image source found")
}



kord({
        cmd: "remini|upscale|hd",
        desc: "increase the quality of an image(pixelcut)",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
      try {
        if (!(m.image || m.quoted.image)) return await m.send("_Reply to a image_")
        await m.react("⏳")
        var mss = m.image ? m : m.quoted.image ? m.quoted : null
        var media = await m.client.downloadMediaMessage(m.image ? m : m.quoted.image ? m.quoted: null)
        var pic = await upscaleImage(media, mss.mtype)
        await m.react("")
        return await m.send(pic, { caption: "> here's your upscaled image.." }, "image")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
})


kord({
        cmd: "gfx|gfx1",
        desc: "create gfx image",
        fromMe: wtype,
        type: "image"
}, async (m, text, c) => {
        try {
        if (!text) return await m.send(`_*provide two texts*_\n_example: ${prefix}gfx I Am;Kord_`)
        var txt = text.split(";")
        if (!txt[0] || !txt[1]) return await m.send(`_*provide two texts*_\n_example: ${c} I Am;Kord_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)

kord({
        cmd: "gfx2",
        desc: "create gfx2 image",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide two texts*_\n_example: ${prefix}gfx2 I Am;Kord_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx2?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx3",
        desc: "create gfx3 image",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide two texts*_\n_example: ${prefix}gfx3 I Am;Kord_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx3?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx4",
        desc: "create gfx4 image",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide two texts*_\n_example: ${prefix}gfx4 I Am;Kord_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx4?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx5",
        desc: "create gfx5 image with three texts",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide three texts*_\n_example: ${prefix}gfx5 I Am;Kord;Dev_`)
        var txt = text.split(";")
        if (txt.length < 3) return await m.send(`_*provide all three texts separated by semicolons*_\n_example: ${prefix}gfx5 I Am;Kord;Dev_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx5?apikey=free_key@maher_apis&text1=${txt[0]}&text2=${txt[1]}&text3=${txt[2]}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx6",
        desc: "create gfx6 image with three texts",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide three texts*_\n_example: ${prefix}gfx6 I Am;Kord;Dev_`)
        var txt = text.split(";")
        if (txt.length < 3) return await m.send(`_*provide all three texts separated by semicolons*_\n_example: ${prefix}gfx6 I Am;Kord;Dev_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx6?apikey=free_key@maher_apis&text1=${txt[0]}&text2=${txt[1]}&text3=${txt[2]}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx7",
        desc: "create gfx7 image",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide two texts*_\n_example: ${prefix}gfx7 I Am;Kord_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx7?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx8",
        desc: "create gfx8 image",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide two texts*_\n_example: ${prefix}gfx8 I Am;Kord_`)
        var txt = text.split(";")
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx8?apikey=free_key@maher_apis&text1=${txt[1]}&text2=${txt[0]}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx9",
        desc: "create gfx9 image with single text",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide text*_\n_example: ${prefix}gfx9 Kord_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx9?apikey=free_key@maher_apis&text=${encodeURIComponent(text)}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx10",
        desc: "create gfx10 image with single text",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide text*_\n_example: ${prefix}gfx10 Kord_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx10?apikey=free_key@maher_apis&text=${encodeURIComponent(text)}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)

kord({
        cmd: "gfx11",
        desc: "create gfx11 image with single text",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide text*_\n_example: ${prefix}gfx11 Kord_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx11?apikey=free_key@maher_apis&text=${encodeURIComponent(text)}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)


kord({
        cmd: "gfx12",
        desc: "create gfx12 image with single text",
        fromMe: wtype,
        type: "image"
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide text*_\n_example: ${prefix}gfx12 Kord_`)
        await m.react("⏳")
         await m.send(`https://api.nexoracle.com/image-creating/gfx12?apikey=free_key@maher_apis&text=${encodeURIComponent(text)}`, {caption: config().CAPTION}, "image")
         await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)

kord({
        cmd: "carbon",
        desc: "create carbon image from code",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
        const codeText = m.quoted?.text || text
        
        if (!codeText) return await m.send(`_*provide code or reply to a message with code*_\n_example: ${prefix}carbon console.log("Hello World")_`)
        
        await m.react("⏳")
        await m.send(
                `https://api.nexoracle.com/image-creating/carbon-img?apikey=free_key@maher_apis&text=${encodeURIComponent(codeText)}`, 
                {caption: config().CAPTION}, 
                "image"
        )
        await m.react("")
        } catch (err) {
                console.error(err)
                return await m.send(`error ${err}`)
        }
}
)

kord({
        cmd: "wanted",
        desc: "create mock wanted poster of replied user or pic",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Reply to a user or a photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/wanted?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("")
        } catch (err) {
            console.error(err)
            return await m.send(`Error: ${err}`)
        }
})

kord({
        cmd: "wasted",
        desc: "create GTA wasted effect on replied user or pic",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Reply to a user or a photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/wasted?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("")
        } catch (err) {
            console.error(err)
            return await m.send(`Error: ${err}`)
        }
})

kord({
        cmd: "rainbow",
        desc: "apply rainbow filter to replied user or pic",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Reply to a user or a photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/rainbow?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("")
        } catch (err) {
            console.error(err)
            return await m.send(`Error: ${err}`)
        }
})

kord({
        cmd: "trigger-meme",
        desc: "create triggered meme of replied user or pic",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Reply to a user or a photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/trigger?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("")
        } catch (err) {
            console.error(err)
            return await m.send(`Error: ${err}`)
        }
})

kord({
        cmd: "rip-meme",
        desc: "create RIP meme of replied user or pic",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Reply to a user or a photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/rip?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("")
        } catch (err) {
            console.error(err)
            return await m.send(`Error: ${err}`)
        }
})

kord({
        cmd: "mnm",
        desc: "create M&M candy effect with replied user or pic",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Reply to a user or a photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/mnm?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("")
        } catch (err) {
            console.error(err)
            return await m.send(`Error: ${err}`)
        }
})

kord({
        cmd: "jail",
        desc: "put replied user or pic behind bars",
        fromMe: wtype,
        type: "image-meme",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Reply to a user or a photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/jail?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("")
        } catch (err) {
            console.error(err)
            return await m.send(`Error: ${err}`)
        }
})

kord({
        cmd: "invert",
        desc: "invert colors of replied user or pic",
        fromMe: wtype,
        type: "image",
}, async (m, text) => {
        try {
            if (!m.quoted?.sender && !m.quoted?.image) return await m.send("_*Reply to a user or a photo*_")
            await m.react("⏳")
            
            const imgUrl = await getImageUrl(m)
            await m.send(
                `https://api.nexoracle.com/image-processing/invert?apikey=free_key@maher_apis&img=${encodeURIComponent(imgUrl)}`,
                {caption: config().CAPTION},
                "image"
            )
            await m.react("")
        } catch (err) {
            console.error(err)
            return await m.send(`Error: ${err}`)
        }
})


kord({
  cmd: "naturewlp",
  desc: "sends slides of nature wallpapers",
  fromMe: wtype,
  type: "image",
}, async (m, text) => {
  try {
        const response = await m.axios(`https://api.kord.live/api/lumina/search?query=${text}`)
        const { wallpapers } = response
        const jid = m.chat
        const baileys = await Baileys()
        const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = baileys

        const slides = wallpapers.map(wallpaper => {
            const stats = `❐ ${wallpaper.downloads} ✰ ${wallpaper.likes} ✡ ${wallpaper.views}`;
            const details = `Resolution: ${wallpaper.resolution}\nSize: ${formatFileSize(wallpaper.size * 1024)}`;
            
            return [
                wallpaper.thumbnail,
                `${text} wallpapers`,
                `${details}`,
                wallpaper.tags,
                'Download',
                wallpaper.image,
                'cta_url',
                wallpaper.image
            ];
        });

        const cards = await Promise.all(
            slides.map(async ([image, titMess, boMessage, fooMess, textCommand, command, buttonType, url]) => ({
                body: proto.Message.InteractiveMessage.Body.fromObject({ text: boMessage }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: fooMess }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: titMess,
                    hasMediaAttachment: true,
                    ...(await prepareWAMessageMedia(
                        { image: { url: image } },
                        { upload: m.client.waUploadToServer }
                    ))
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [{
                        name: buttonType,
                        buttonParamsJson: JSON.stringify({
                            display_text: textCommand,
                            url,
                            merchant_url: url
                        })
                    }]
                })
            }))
        )

        const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `*Explore ...*\n★★★`
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: ''
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: `*${text} Wallpapers*`,
                subtitle: 'Swipe to enjoy!',
                hasMediaAttachment: false
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
        });

        const msg = generateWAMessageFromContent(
            jid,
            { viewOnceMessage: { message: { interactiveMessage } } },
            { quoted: m }
        );

        await m.client.relayMessage(jid, msg.message, { messageId: msg.key.id });
    } catch (error) {
        console.error('Error fetching nature wlp:', error)
        return await m.send(`[ERROR!] ${error}`)
    }
})