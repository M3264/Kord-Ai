// are you a cloner or reader?

const textMaker = require('../../Plugin/textmaker');
const fetch = require('node-fetch');

const createTextEffectCommand = (name, effectUrl, emoji, description, options = {}) => ({
    usage: [name.toLowerCase()],
    desc: `Creates ${description} using EpPhoto360`,
    commandType: "fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emoji,

    async execute(sock, m, args, kord) {
        const joinedText = args.join(' ');
        const hasSemicolon = joinedText.includes(';');
        let textInputs = [];
        let radioOption = null;
        
        if (hasSemicolon) {
            const splitInputs = joinedText.split(';').map(item => item.trim());
            if (options.hasRadio && splitInputs.length > 0) {
                const lastItem = splitInputs[splitInputs.length - 1];
                if (/^\d+$/.test(lastItem)) {
                    radioOption = lastItem;
                    textInputs = splitInputs.slice(0, splitInputs.length - 1);
                } else {
                    textInputs = splitInputs;
                }
            } else {
                textInputs = splitInputs;
            }
        } else {
            textInputs = joinedText ? [joinedText] : [];
        }
        
        if (options.needsMultipleTexts && textInputs.length < options.numTexts) {
            if (global.settings?.INVINCIBLE_MODE) {
                await kord.react("🚫");
                return await kord.sendErr(null, {
                    context: `${name} Text Effect Command`,
                    info: `_*Need ${options.numTexts} texts${options.hasRadio ? " and Radio option" : ""} but got only ${textInputs.length}*_`
                });
            } else {
                let radioOptionsList = "";
                if (options.hasRadio) {
                    radioOptionsList = "\n_You can use the following numbers:_\n" + 
                        options.radioOptions.map((ro, index) => `_${index + 1} - ${ro.dataTitle}_`).join("\n");
                }
                
                kord.freply(`_provide the correct arguments_.\n` +
                    `_*Example: ${global.settings.PREFIX[0]}${name} text1;text2${options.numTexts > 2 ? ';text3' : ''}${options.numTexts > 3 ? ';text4' : ''}${options.hasRadio ? ';1' : ''}*_\n` +
                    `${radioOptionsList}`);
                return;
            }
        } else if (!options.needsMultipleTexts && textInputs.length === 0 && !options.hasRadio) {
            if (global.settings?.INVINCIBLE_MODE) {
                await kord.react("🚫");
                return await kord.sendErr(null, {
                    context: `${name} Text Effect Command`,
                    info: "_*No text provided for effect*_"
                });
            } else {
                kord.freply(`_provide text for the ${name} effect_\n` +
                    `_*Example: ${global.settings.PREFIX[0]}${name} Hello World*_`);
                return;
            }
        }
        
        if (options.hasRadio) {
            if (!radioOption) {
                if (global.settings?.INVINCIBLE_MODE) {
                    await kord.react("🚫");
                    return await kord.sendErr(null, {
                        context: `${name} Text Effect Command`,
                        info: "_*No radio option provided*_"
                    });
                } else {
                    let radioOptionsList = "\n_You can use the following numbers:_\n" + 
                        options.radioOptions.map((ro, index) => `_${index + 1} - ${ro.dataTitle}_`).join("\n");
                    
                    kord.freply(`_*provide a radio option*_.\n` +
                        `_*Example: ${global.settings.PREFIX[0]}${name} ${options.needsMultipleTexts ? `text1;text2${options.numTexts > 2 ? ';text3' : ''}${options.numTexts > 3 ? ';text4' : ''}` : "text"};1*_\n` +
                        `${radioOptionsList}`);
                    return;
                }
            }
            
            const radioIndex = parseInt(radioOption);
            
            if (isNaN(radioIndex) || radioIndex < 1 || radioIndex > options.radioOptions.length) {
                if (global.settings?.INVINCIBLE_MODE) {
                    await kord.react("🚫");
                    return await kord.sendErr(null, {
                        context: `${name} Text Effect Command`,
                        info: `_*Invalid radio option: ${radioOption}*_`
                    });
                } else {
                    let availableOptions = options.radioOptions.map((ro, index) => `${ro.dataTitle} (${index + 1})`).join(", ");
                    kord.freply(`_Invalid radio option. choose a number from 1 to ${options.radioOptions.length}_\n` +
                        `_You can use the following numbers:_\n` + 
                        options.radioOptions.map((ro, index) => `_${index + 1} - ${ro.dataTitle}_`).join("\n"));
                    return;
                }
            }
        }

        try {
            //kord.freply(`⌛ Creating your ${name} text...`);

            let result;
            if (options.hasRadio) {
                const radioIndex = parseInt(radioOption);
                const selectedOption = options.radioOptions[radioIndex - 1];
                
                const optionValue = selectedOption.dataTitle.toLowerCase();
                
                result = await textMaker(effectUrl, options.needsMultipleTexts ? textInputs : [textInputs[0]], 
                    { [options.radioName]: optionValue });
            } else {
                result = await textMaker(effectUrl, options.needsMultipleTexts ? textInputs : [textInputs[0]]);
            }

            if (!result.status || !result.url) {
                if (global.settings?.INVINCIBLE_MODE) {
                    await kord.react("🚫");
                    return await kord.sendErr(result, {
                        context: `${name} Text Effect Command`,
                        info: "_*Failed to generate effect*_"
                    });
                } else {
                    throw new Error('Failed to generate effect');
                }
            }

            const response = await fetch(result.url);

            if (!response.ok) {
                if (global.settings?.INVINCIBLE_MODE) {
                    await kord.react("🚫");
                    return await kord.sendErr(response, {
                        context: `${name} Text Effect Command`,
                        info: "_*Failed to fetch generated image*_"
                    });
                } else {
                    throw new Error('Failed to fetch generated image');
                }
            }

            const buffer = await response.buffer();

            await sock.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™',
                mimetype: 'image/jpeg'
            }, { quoted: m });

        } catch (error) {
            console.error(`Error in ${name} command:`, error);
            if (global.settings?.INVINCIBLE_MODE) {
                await kord.react("🚫");
                await kord.sendErr(error, {
                    context: `${name} Text Effect Command`,
                    info: "_*Unexpected error in text effect generation*_"
                });
            } else {
                kord.freply(`An error occurred: ${error.message}`);
            }
        }
    }
});


module.exports = [
    createTextEffectCommand("neonlight", "https://en.ephoto360.com/create-light-effects-green-neon-online-429.html", "💡", "neon light text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("typography", "https://en.ephoto360.com/create-online-typography-art-effects-with-multiple-layers-811.html", "✨", "typography text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("wetglass", "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html", "💧", "wet glass text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("glitch", "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html", "🤖", "digital glitch text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("pavement", "https://en.ephoto360.com/create-typography-text-effect-on-pavement-online-774.html", "🛤️", "pavement text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("colorfulneon", "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html", "💡", "colorful neon light text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("futuristiclight", "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html", "🤖", "futuristic technology text effect", {
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "05acf523-6deb-4b9d-bb28-abc4354d0858", dataTitle: "Style 1" },
            { name: "radio0[radio]", value: "843a4fc2-059c-4283-87e4-c851c013073b", dataTitle: "Style 2" },
            { name: "radio0[radio]", value: "d951e4be-450e-4658-9e73-0f7c82c63ee3", dataTitle: "Style 3" },
            { name: "radio0[radio]", value: "a5b374f3-2f29-4da4-ae15-32dec01198e2", dataTitle: "Style 4" }
        ],
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("pubgmascot", "https://en.ephoto360.com/pubg-mascot-logo-maker-for-an-esports-team-612.html", "🎮", "PUBG mascot logo", { needsMultipleTexts: true, numTexts: 2 }),
    createTextEffectCommand("pubglogo", "https://en.ephoto360.com/pubg-logo-maker-cute-character-online-617.html", "🎮", "PUBG logo with cute character", {
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "c566c68d-f8b9-4e0f-bb07-011da043d677", dataTitle: "Chicken" },
            { name: "radio0[radio]", value: "d4401b94-41d7-434c-af20-1ffca1aea281", dataTitle: "Soldier" }
        ],
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("valorantbanner", "https://en.ephoto360.com/create-valorant-banner-youtube-online-588.html", "🎮", "Valorant YouTube banner", {
        needsMultipleTexts: true,
        numTexts: 3,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
              {
        "name": "radio0[radio]",
        "value": "072dd1a0-db7d-4b87-b3e7-b142c2e8cad6",
        "dataTitle": "Brimstone"
      },
      {
        "name": "radio0[radio]",
        "value": "784a10c2-660e-4955-901a-a1b57881df42",
        "dataTitle": "Cypher"
      },
      {
        "name": "radio0[radio]",
        "value": "00251bca-e044-42bd-8dd7-f536ac0c42b4",
        "dataTitle": "Jett"
      },
      {
        "name": "radio0[radio]",
        "value": "882898c0-054d-4dce-b08a-823af1f4cfc7",
        "dataTitle": "Killjoy"
      },
      {
        "name": "radio0[radio]",
        "value": "4f51675f-4ad4-42a4-ad1e-1eb8792dfad6",
        "dataTitle": "Omen"
      },
      {
        "name": "radio0[radio]",
        "value": "90d9209e-0739-4079-81f7-959fd12f3bbe",
        "dataTitle": "Phoenix"
      },
      {
        "name": "radio0[radio]",
        "value": "dbd319cf-a529-4958-b43e-7f2e19f05853",
        "dataTitle": "Raze"
      },
      {
        "name": "radio0[radio]",
        "value": "71b52833-5560-46b4-ac88-92054c6d1f5a",
        "dataTitle": "Reyna"
      },
      {
        "name": "radio0[radio]",
        "value": "acc7c093-9937-4a3d-85da-d66c02c92751",
        "dataTitle": "Sage"
      },
      {
        "name": "radio0[radio]",
        "value": "48ab2129-3543-4fa9-9361-2868fab8f073",
        "dataTitle": "Viper"
      },
        ]
    }),
    createTextEffectCommand("codwarzonebanner", "https://en.ephoto360.com/create-call-of-duty-warzone-youtube-banner-online-548.html", "🎮", "Call of Duty Warzone YouTube banner", {
        needsMultipleTexts: true,
        numTexts: 2,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "182a06fa-03e0-4c26-b1eb-fb9e46f3255a", dataTitle: "Banner 1" },
            { name: "radio0[radio]", value: "8b1be550-f6f4-43d8-bb23-58403fc079db", dataTitle: "Banner 2" },
            { name: "radio0[radio]", value: "23f570de-58c9-4cbb-9349-d1a06cd5fa1c", dataTitle: "Banner 3" },
        ]
    }),
    createTextEffectCommand("lolwallpaper", "https://en.ephoto360.com/make-your-own-league-of-legends-wallpaper-full-hd-442.html", "🎮", "League of Legends wallpaper", {
        needsMultipleTexts: false,
        numTexts: 1,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            {
        "name": "radio0[radio]",
        "value": "e5fd2f91-fa40-4569-b9b1-12f489f3a308",
        "dataTitle": "Aphelios"
      },
      {
        "name": "radio0[radio]",
        "value": "f8cd6994-d4de-4d2e-aabd-bfadd08762f5",
        "dataTitle": "Karma"
      },
      {
        "name": "radio0[radio]",
        "value": "2e4f5c59-7ace-4cc4-9f53-7ac3ef6c365f",
        "dataTitle": "Lee Sin 2"
      },
      {
        "name": "radio0[radio]",
        "value": "e6a67c50-5d6d-4bde-8dab-f182a5f6efc0",
        "dataTitle": "Nidalee 2"
      },
      {
        "name": "radio0[radio]",
        "value": "74703d89-b9b3-4d0d-bc0a-7dc9a0839381",
        "dataTitle": "Soraka 2"
      },
      {
        "name": "radio0[radio]",
        "value": "a90ada92-1c5f-4d50-9594-8b73b185d3f6",
        "dataTitle": "Soraka 3"
      },
      {
        "name": "radio0[radio]",
        "value": "5f3d160e-b55b-4454-9b2b-98b021378ddb",
        "dataTitle": "Swain"
      },
      {
        "name": "radio0[radio]",
        "value": "40d5677c-99d8-45c3-b95c-1734120b5dce",
        "dataTitle": "Akali 4"
      },
      {
        "name": "radio0[radio]",
        "value": "4fbbf1e4-9fc2-4b70-8734-5513743f9e3d",
        "dataTitle": "Ekko 2"
      },
      {
        "name": "radio0[radio]",
        "value": "30cb23c0-4c2c-4969-8325-b9bd1325ffad",
        "dataTitle": "Qiyana"
      },
        ]
    }),
    createTextEffectCommand("amongusavatar", "https://en.ephoto360.com/create-a-banner-game-among-us-with-your-name-763.html", "🎮", "Among Us avatar banner", {
        needsMultipleTexts: true,
        numTexts: 2
    }),
    createTextEffectCommand("angel", "https://en.ephoto360.com/create-colorful-angel-wing-avatars-731.html", "👼", "angel wing avatar", {
        needsMultipleTexts: false,
        numTexts: 1,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            {
        "name": "radio0[radio]",
        "value": "fed58002-b0fe-4193-885e-5cb7b5214305",
        "dataTitle": "Blue"
      },
      {
        "name": "radio0[radio]",
        "value": "19c58774-962d-4a12-8b75-769b2e188ad1",
        "dataTitle": "Cyan"
      },
      {
        "name": "radio0[radio]",
        "value": "6ac134d1-f593-499d-8641-e7ce45af680e",
        "dataTitle": "Gold"
      },
      {
        "name": "radio0[radio]",
        "value": "20fb811f-d9c2-42c9-a1fa-1fcee791c22c",
        "dataTitle": "Green"
      },
      {
        "name": "radio0[radio]",
        "value": "c82cbc01-e167-47bb-8714-02b073c3738d",
        "dataTitle": "Magenta"
      },
      {
        "name": "radio0[radio]",
        "value": "23fa67cb-b95e-49b3-8abe-ec9e3ae13456",
        "dataTitle": "Orange"
      },
      {
        "name": "radio0[radio]",
        "value": "4d1e64fd-6601-4fd1-acfd-dbdad36c401a",
        "dataTitle": "Pink"
      },
      {
        "name": "radio0[radio]",
        "value": "3a5ea326-65d6-43f1-abc8-b576e7c8cfa4",
        "dataTitle": "Purple"
      },
      {
        "name": "radio0[radio]",
        "value": "18c4658a-e1b1-46ba-9d23-1fa051e67105",
        "dataTitle": "Red"
      },
      {
        "name": "radio0[radio]",
        "value": "a5cbd215-ac33-46e2-97e5-5bd6e1c800b3",
        "dataTitle": "Silver"
      },
      {
        "name": "radio0[radio]",
        "value": "8be96a94-82d9-4f75-bb2c-63311944e8a0",
        "dataTitle": "White"
      },
      {
        "name": "radio0[radio]",
        "value": "41021a6d-2d02-4759-b8bc-6b941bda4dbc",
        "dataTitle": "Yellow"
      },
      {
        "name": "radio0[radio]",
        "value": "0b5a4d0b-f896-4def-bfb8-e2177fca2360",
        "dataTitle": "Black"
      },
      {
        "name": "radio0[radio]",
        "value": "a60760ea-f266-4064-bde0-8d02f174254d",
        "dataTitle": "Galaxy "
      },
      {
        "name": "radio0[radio]",
        "value": "c542dab0-ea54-44a5-9976-c6af66f71d9c",
        "dataTitle": "Galaxy 2"
      },
      {
        "name": "radio0[radio]",
        "value": "7cdb6c7b-1c37-41c6-b50d-500c6111833d",
        "dataTitle": "Galaxy 3"
      },
      {
        "name": "radio0[radio]",
        "value": "868cf218-c4c9-432a-b737-8d43ecdc580c",
        "dataTitle": "Galaxy 4"
      },
      {
        "name": "radio0[radio]",
        "value": "df2d7c1e-7319-4157-a02c-0c7f71f41cc3",
        "dataTitle": "Galaxy 5"
      }
        ]
    }),
    createTextEffectCommand("greenbrush", "https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html", "🖌️", "green brush text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("neon", "https://en.ephoto360.com/neon-text-effect-online-78.html", "💡", "neon text effect", {
        needsMultipleTexts: true,
        numTexts: 2
    }),
    createTextEffectCommand("neonlightsignature", "https://en.ephoto360.com/create-multicolored-neon-light-signatures-591.html", "✨", "multicolored neon light signature", {
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "188eb364-5a04-446e-a779-0e2f427b7bc3", dataTitle: "1" },
            { name: "radio0[radio]", value: "a35d8b0d-bb89-4718-8723-71c5a9e9de4a", dataTitle: "2" },
            { name: "radio0[radio]", value: "3938db27-c48c-4d96-ab60-f1bd1e312abf", dataTitle: "3" }
        ],
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("lightbulb", "https://en.ephoto360.com/create-realistic-vintage-3d-light-bulb-608.html", "💡", "realistic 3D light bulb", {
        needsMultipleTexts: true,
        numTexts: 2
    }),
    createTextEffectCommand("glitter", "https://en.ephoto360.com/free-glitter-text-effect-maker-online-656.html", "✨", "glitter text effect", {
        needsMultipleTexts: true,
        numTexts: 2,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "1ad3c6ed-ba1e-4582-95cf-b5e2d7d1a125", dataTitle: "Blue" },
            { name: "radio0[radio]", value: "9a0f8a8a-d4b0-42bf-945f-06e75a2ac6a4", dataTitle: "Gold" },
            { name: "radio0[radio]", value: "83d9bd14-0ebe-470b-a2c7-bdda4f37ef17", dataTitle: "Green" }
        ]
    }),
    createTextEffectCommand("watercolor", "https://en.ephoto360.com/create-a-watercolor-text-effect-online-655.html", "🎨", "watercolor text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("papercut", "https://en.ephoto360.com/multicolor-3d-paper-cut-style-text-effect-658.html", "✂️", "3D paper cut text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("tiktok-text", "https://en.ephoto360.com/tik-tok-text-effects-online-generator-485.html", "📹", "TikTok text effect", {
        needsMultipleTexts: true,
        numTexts: 2
    }),
    createTextEffectCommand("metallogo", "https://en.ephoto360.com/metal-mascots-logo-maker-486.html", "🏆", "metal mascot logo", {
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "206bc58d-00cc-4442-bc00-dcf221b40aa0", dataTitle: "Snake & Lion" },
            { name: "radio0[radio]", value: "de5f4f9c-95f0-411d-9ac9-5086409ad09a", dataTitle: "Dragon" },
            { name: "radio0[radio]", value: "657a0d32-84f6-4d6b-aab3-0b6768d27d0e", dataTitle: "Dragon 2" }
        ],
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("galaxyneon", "https://en.ephoto360.com/making-neon-light-text-effect-with-galaxy-style-521.html", "🌌", "galaxy neon light text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("blueneon", "https://en.ephoto360.com/create-blue-neon-logo-online-507.html", "💙", "blue neon logo", {
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "2cb0949e-9e73-4e46-b149-e7e3927ba535", dataTitle: "Tiger" },
            { name: "radio0[radio]", value: "6e80d164-85bd-412f-ae4b-36c09a9fc6ad", dataTitle: "Shark" },
            { name: "radio0[radio]", value: "f81ef052-83f9-46a3-bbbc-4ce2653f735e", dataTitle: "Dugong" }
        ],
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("galaxywallpaper", "https://en.ephoto360.com/create-galaxy-wallpaper-mobile-online-528.html", "🌌", "galaxy wallpaper", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("glossychrome", "https://en.ephoto360.com/glossy-chrome-text-effect-online-424.html", "🤖", "glossy chrome text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("wetglass2", "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html", "💧", "wet glass text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("gloweffect", "https://en.ephoto360.com/advanced-glow-effects-74.html", "✨", "advanced glow text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("wood3d", "https://en.ephoto360.com/wooden-3d-text-effect-59.html", "🌳", "3D wooden text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("sunsetlight", "https://en.ephoto360.com/create-sunset-light-text-effects-online-807.html", "🌆", "sunset light text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("pencilsketch", "https://en.ephoto360.com/create-a-pencil-sketch-logo-online-719.html", "✏️", "pencil sketch logo", {
        needsMultipleTexts: true,
        numTexts: 2,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "481e1fc1-600d-44d6-b82d-7ead83fb1f3a", dataTitle: "Bird" },
            { name: "radio0[radio]", value: "badd5200-1d09-450f-b7d5-d31e7e50c995", dataTitle: "Butterfly" },
            { name: "radio0[radio]", value: "35cd5d5d-96af-451e-bca3-eabe5adfcee1", dataTitle: "Coffee" }
        ]
    }),
    createTextEffectCommand("starzodiac", "https://en.ephoto360.com/create-star-zodiac-wallpaper-mobile-online-604.html", "🌟", "star zodiac wallpaper", {
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "a57c8514-b6e6-4507-be7d-f9929bdbdbb0", dataTitle: "Aquarius" },
            { name: "radio0[radio]", value: "60fb40f8-c477-4e69-a5cd-2662e455924e", dataTitle: "Aries" },
            { name: "radio0[radio]", value: "3088de9c-f86b-4a63-92d8-65dc36b3b783", dataTitle: "Cancer" }
        ],
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("floralluxury", "https://en.ephoto360.com/floral-luxury-logo-collection-for-branding-616.html", "🌺", "floral luxury logo", {
        needsMultipleTexts: true,
        numTexts: 2,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "d4764301-5311-47c6-82aa-5aa36e9e9500", dataTitle: "Style 1" },
            { name: "radio0[radio]", value: "483b9b2a-2c87-4714-a7a7-6d0cc7b70d26", dataTitle: "Style 2" },
            { name: "radio0[radio]", value: "f6b48e3f-9481-40ae-a47e-56ba5471b892", dataTitle: "Style 3" }
        ]
    }),
    createTextEffectCommand("hackerneon", "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html", "🕵️", "hacker neon avatar", {
        needsMultipleTexts: false,
        numTexts: 1,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "984dd03e-220d-4335-a6ba-7ac56b092240", dataTitle: "Style 1" },
            { name: "radio0[radio]", value: "71074346-5cb3-4b7d-9b8b-a84e4f142ba4", dataTitle: "Style 2" },
            { name: "radio0[radio]", value: "88bacc38-e755-450a-bbc1-f5671d77c8a7", dataTitle: "Style 3" }
        ]
    }),
    createTextEffectCommand("neondevil", "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html", "😈", "neon devil wings text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("crack3d", "https://en.ephoto360.com/create-3d-crack-text-effect-online-704.html", "💥", "3D crack text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("scifilogo", "https://en.ephoto360.com/create-a-awesome-logo-sci-fi-effects-492.html", "🤖", "sci-fi logo", {
        needsMultipleTexts: true,
        numTexts: 3
    }),
    createTextEffectCommand("sandwriting", "https://en.ephoto360.com/create-a-summery-sand-writing-text-effect-577.html", "🏖️", "sand writing text effect", {
        needsMultipleTexts: false,
        numTexts: 1,
    }),
    createTextEffectCommand("letterlogo", "https://en.ephoto360.com/create-letter-logos-online-for-free-545.html", "🔤", "letter logo", {
        needsMultipleTexts: true,
        numTexts: 2,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
            { name: "radio0[radio]", value: "b5843159-7265-445a-8890-bbde408fab8e", dataTitle: "A" },
            { name: "radio0[radio]", value: "4925f62e-1446-4496-aa17-bafea9d7fc2c", dataTitle: "B" },
            { name: "radio0[radio]", value: "e6191f22-07e0-478c-9d1e-7d021395f7aa", dataTitle: "C" }
        ]
    }),
    createTextEffectCommand("gamingmascot", "https://en.ephoto360.com/create-a-gaming-mascot-logo-free-560.html", "🎮", "gaming mascot logo", {
        needsMultipleTexts: false,
        numTexts: 1,
        hasRadio: true,
        radioName: "radio0",
        radioOptions: [
      {
        "name": "radio0[radio]",
        "value": "67eac32d-52da-48b7-92b4-0b6d053fb712",
        "dataTitle": "Bear 2"
      },
      {
        "name": "radio0[radio]",
        "value": "52ebb5fb-19a7-461b-bfb3-19e3d49c7a91",
        "dataTitle": "Dragon 2"
      },
      {
        "name": "radio0[radio]",
        "value": "1508810c-a33b-4261-ad04-48dea8932865",
        "dataTitle": "Hydra"
      },
      {
        "name": "radio0[radio]",
        "value": "a04d53f2-1449-4491-9f96-041e7ea7c47d",
        "dataTitle": "Lion"
      },
      {
        "name": "radio0[radio]",
        "value": "0dfd9278-65ac-4688-98a2-06eb76b0f50d",
        "dataTitle": "Reaper"
      },
      {
        "name": "radio0[radio]",
        "value": "42d73af1-9c38-43b5-abdb-de0bb435dfbe",
        "dataTitle": "Wolf 2"
      },
      {
        "name": "radio0[radio]",
        "value": "d95b06e0-537d-40a8-a35c-0b89f1134ef0",
        "dataTitle": "Bear"
      },
      {
        "name": "radio0[radio]",
        "value": "3a75b5da-ec04-4216-8c4e-c900359cfd0d",
        "dataTitle": "Eagle"
      },
      {
        "name": "radio0[radio]",
        "value": "031e93f6-097d-4873-bb21-d3eaa6d7e70a",
        "dataTitle": "Iguana"
      },
      {
        "name": "radio0[radio]",
        "value": "200c1bb0-cb27-4838-80c8-d140867c1739",
        "dataTitle": "Shark"
      },
      {
        "name": "radio0[radio]",
        "value": "26fd6ea7-92b5-4747-9de5-c537289e2318",
        "dataTitle": "Snake"
      },
      {
        "name": "radio0[radio]",
        "value": "1fd77707-3f5c-48e0-8021-a832bb5b2339",
        "dataTitle": "Spartan"
      },
      {
        "name": "radio0[radio]",
        "value": "6fda04fc-79e8-46d9-bded-01250d43e253",
        "dataTitle": "Griffin"
      },
      {
        "name": "radio0[radio]",
        "value": "e6e37e54-4fc3-473b-b930-4a75ef065c88",
        "dataTitle": "Owl"
      },
      {
        "name": "radio0[radio]",
        "value": "7e8d1d6b-1b72-481a-bc38-a9d26513a803",
        "dataTitle": "Wolf"
      },
      {
        "name": "radio0[radio]",
        "value": "ad7ec525-b2c4-4560-9a25-a36fb3da3b5f",
        "dataTitle": "Tiger"
      },
      {
        "name": "radio0[radio]",
        "value": "656111bb-2832-4a73-b337-10e1eea54bd3",
        "dataTitle": "Wolver"
      },
      {
        "name": "radio0[radio]",
        "value": "cd5465d9-9c5e-4d08-9f1b-3b9f3a45a858",
        "dataTitle": "Dragon"
      }
        ]
    })
];