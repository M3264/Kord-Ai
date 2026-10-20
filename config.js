// const toBool = (x) => x == 'true'
const { existsSync } = require('fs')
if (existsSync('config.env')) require('dotenv').config({ path: './config.env' })

module.exports = {
    SESSION_ID: process.env.SESSION_ID || '',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '',
    OWNER_USERNAME: process.env.OWNER_USERNAME || '',
    WORKTYPE: process.env.WORKTYPE || "private",
    PREFIX: process.env.PREFIX || "[-/]",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "off",
    MONGODB_URI: process.env.MONGODB_URI || '',
    STATUS_VIEW: process.env.STATUS_VIEW || "off",
    SAVE_STATUS: process.env.SAVE_STATUS || "off",
    ERROR_MSG: process.env.ERROR_MSG || true,
    TIMEZONE: process.env.TIMEZONE || "Africa/Lagos",
    CAPTION: process.env.CAPTION || "",
    STICKER_PACKNAME: process.env.STICKER_PACKNAME || "Kord",
    STICKER_AUTHOR: process.env.STICKER_AUTHOR || "🤍",
    BOT_PRESENCE: process.env.BOT_PRESENCE || "available",
    REACT: process.env.REACT || false,
    READ_MESSAGE: process.env.READ_MESSAGE || "on",
    OWNER_NAME: process.env.OWNER_NAME || '',
    BOT_NAME: process.env.BOT_NAME || "Kord",

    ANTIDELETE: process.env.ANTIDELETE || "on",
    ANTIDELETE_INCHAT: process.env.ANTIDELETE_INCHAT || "off",
    AUDIO_DATA: process.env.AUDIO_DATA || "Kord;🤍",
    SUDO: process.env.SUDO || '',
    REJECT_CALL: process.env.REJECT_CALL || "on",
    WARNCOUNT: process.env.WARNCOUNT || "4",
    LANG_CODE: process.env.LANG_CODE || "en",
    VV_CMD: process.env.VV_CMD || "🔹",
    RES_TYPE: process.env.RES_TYPE || "poll",
    CMD_REACT: process.env.CMD_REACT || "off",
    MODS: process.env.MODS || '',
    LIKE_STATUS: process.env.LIKE_STATUS || "on",
    STATUS_EMOJI: process.env.STATUS_EMOJI || "👀,🤍,🥏",
    STARTUP_MSG: process.env.STARTUP_MSG || "on",
    ANTI_EDIT: process.env.ANTI_EDIT || "off",
    ANTI_EDIT_IN_CHAT: process.env.ANTI_EDIT_IN_CHAT || "off",
    WARNCOUNT: process.env.WARNCOUNT || "4",
    MENU_IMAGE: process.env.MENU_IMAGE || "",
    KENNY_DEV: process.env.KENNY_DEV || "true"

}