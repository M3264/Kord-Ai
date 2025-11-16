// const toBool = (x) => x == 'true'
const { existsSync } = require('fs')
if (existsSync('config.env')) require('dotenv').config({ path: './config.env' })

module.exports = { 
    SESSION_ID: process.env.SESSION_ID || '',
    OWNER_NUMBER: process.env.OWNER_NUMBER || "2349067339193",
    WORKTYPE: process.env.WORKTYPE || "private",
    PREFIX: process.env.PREFIX || "[.]",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || true,
    MONGODB_URI: process.env.MONGODB_URI || "",
    STATUS_VIEW: process.env.STATUS_VIEW || true,
    SAVE_STATUS: process.env.SAVE_STATUS || false,
    LIKE_STATUS: process.env.SAVE_STATUS || false,
    STATUS_EMOJI: process.env.STATUS_EMOJI || "🥏",
    ERROR_MSG: process.env.ERROR_MSG || true,
    TIMEZONE: process.env.TIMEZONE || "Africa/Lagos",
    CAPTION: process.env.CAPTION || "",
    STICKER_PACKNAME: process.env.STICKER_PACKNAME || "Kord",
    STICKER_AUTHOR: process.env.STICKER_AUTHOR || "🤍",
    BOT_PRESENCE: process.env.BOT_PRESENCE || "unavailable",
    REACT: process.env.REACT || false,
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    OWNER_NAME: process.env.OWNER_NAME || "kelin",
    BOT_NAME: process.env.BOT_NAME || "Kelin",
    RENDER_API_KEY: process.env.RENDER_API_KEY,
    ANTIDELETE: process.env.ANTIDELETE || "off",
    ANTIDELETE_INCHAT: process.env.ANTIDELETE_INCHAT || "off",
    ANTI_EDIT: process.env.ANTI_EDIT || "off",
    ANTI_EDIT_IN_CHAT: process.env.ANTI_EDIT_IN_CHAT || "off",
    AUDIO_DATA: process.env.AUDIO_DATA || "Kord;🤍",
    SUDO: process.env.SUDO || "",
    MODS: process.env.MODS || "",
    REJECT_CALL: process.env.REJECT_CALL || "off",
    WARNCOUNT: process.env.WARNCOUNT || "4",
    LANG_CODE: process.env.LANG_CODE || "en",
    VV_CMD: process.env.VV_CMD || "👀",
    SAVE_CMD: process.env.SAVE_CMD || "📥",
    RES_TYPE: process.env.RES_TYPE || "text",
    CMD_REACT: process.env.CMD_REACT || "off",
    LOG_MESSAGES: process.env.LOG_MESSAGES || "off",
    STARTUP_MSG: process.env.STARTUP_MSG || "on",
    MENU_IMAGE: process.env.MENU_IMAGE || "",
    WELCOME_MESSAGE: process.env.WELCOME_MESSAGE ||  `╭━━━✦✧┈┈┈┈┈୨♡୧┈┈┈┈┈✧✦━━━╮
┃ ✿ﾟ*々 Welcome @user! to @gname*
┃ ✿ﾟ*々 Members: @count*
┃ ✿ﾟWe Hope You Have A Nice Time Here!
┗━━━━✦✧┈┈┈┈┈୨♡୧┈┈┈┈┈✧✦━━━━━━━━`,
    GOODBYE_MESSAGE: process.env.GOODBYE_MESSAGE || `╭━━✦✧┈┈┈┈┈୨♡୧┈┈┈┈┈✧✦━━━╮
┃ ✿ﾟ *々 @user! left @gname!*
┃ ✿ﾟ Members: @count*
┃ ✿ﾟ We Hope He/She Had A Nice Time Here!
┗━━━━━✦✧┈┈┈┈┈୨♡୧┈┈┈┈┈✧✦━━━━━`
}