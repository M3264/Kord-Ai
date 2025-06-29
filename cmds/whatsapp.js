const { kord, wtype, isAdmin, prefix, isBotAdmin} = require("../core")

kord({
  cmd: "delete|del|dlt",
  desc: "delete a replied message",
  fromMe: wtype,
  type: "user",
}, async (m, text) => {
  if (!m.quoted) return await m.send("_Reply to a message to delete_")

  if (m.isGroup) {
    if (m.quoted.fromMe && m.isCreator) {
      await m.send(m.quoted, {}, "delete")
      return await m.send(m, {}, "delete")
    }

    let ad = await isAdmin(m)
    let botAd = await isBotAdmin(m)
    if (!botAd) return await m.send("_I'm not admin.._")
    if (!ad) return await m.send("_You're not admin.._")

    await m.send(m.quoted, {}, "delete")
    return await m.send(m, {}, "delete")
  }

  if (!m.isCreator) return await m.send("_I don't know you.._")
  await m.send(m.quoted, {}, "delete")
  if (m.fromMe) {
  return await m.send(m, {}, "delete")
  } else return
})


kord({
        cmd: "archive",
        desc: "archive a chat",
        fromMe: true,
        type: "user",
}, async (m, text) => {
        const lmsg = {
        message: m.message,
        key: m.key,
        messageTimestamp: m.timestamp };
await m.client.chatModify({
        archive: true,
        lastMessages: [lmsg]
}, m.chat);
return await m.send('_chat archived_')
})

kord({
        cmd: "unarchive",
        desc: "unarchive a chat",
        fromMe: true,
        type: "user",
}, async (m, text) => {
        const lmsg = {
        message: m.message,
        key: m.key,
        messageTimestamp: m.timestamp };
await m.client.chatModify({
        archive: false,
        lastMessages: [lmsg]
}, m.chat);
return await m.send('_chat unarchived_')
})


kord({
        cmd: "jid",
        desc: "gets jid of either replied user or present chat",
        fromMe: wtype,
        type: "user",
}, async (m) => {
        if (m.quoted.sender) return await m.send(m.quoted.sender);
        else return await m.send(m.chat);
})

kord({
        cmd: "pp|setpp",
        desc: "changes profile pic to replied photo",
        fromMe: true,
        type: "user",
}, async (m, text) => {
        if (!m.quoted.image && !m.image) return await m.send("_reply to a picture_")
        if (m.quoted.image) {
        var picpath = await m.quoted.download()
        } else {
        picpath = await m.client.downloadMediaMessage(m)
        }
        await m.client.updateProfilePicture(m.user.jid, picpath);
        return await m.send("_profile pic changed_")
})

kord({
        cmd: "removepp",
        desc: "removes profile picture",
        fromMe: true,
        type: "user",
}, async (m, text) => {
        await m.client.removeProfilePicture(m.user.jid);
        return await m.send("_profile pic removed.._");
})

kord({
        cmd: "clear",
        desc: "clear a chat",
        fromMe: true,
        type: "user",
}, async (m, text) => {
        await m.client.chatModify({
        delete: true,
        lastMessages: [{
                key: m.key,
                messageTimestamp: m.messageTimestamp
        }]
}, m.chat)
await m.send('_Chat Cleared_')        
})

kord({
        cmd: "pinchat|chatpin",
        desc: "pin a chat",
        fromMe: true,
        type: "user"
}, async (m, text) => {
        await m.client.chatModify({
        pin: true
        }, m.chat);
        await m.send('_Chat Pined_')
})

kord({
        cmd: "unpinchat|unchatpin",
        desc: "unpin a chat",
        fromMe: true,
        type: "user"
}, async (m, text) => {
        await m.client.chatModify({
                pin: false
        }, m.chat);
        await m.send('_Chat Unpined_')
})

kord({
        cmd: "block",
        desc: 'block a user',
        fromMe: true,
        type: 'user',
}, async (m, text) => {
        if (m.isGroup && m.quoted?.sender) {
                await m.client.updateBlockStatus(m.quoted?.sender, "block")
        } else {
                await m.client.updateBlockStatus(m.chat, "block")
        }
})

kord({
        cmd: "unblock",
        desc: 'unblock a user',
        fromMe: true,
        type: 'user',
}, async (m, text) => {
        if (m.isGroup && m.quoted?.sender) {
                await m.client.updateBlockStatus(m.quoted?.sender, "unblock")
        } else {
                await m.client.updateBlockStatus(m.chat, "unblock")
        }
})

kord({
        cmd: "blocklist",
        desc: "fetches list of blocked numbers",
        fromMe: true,
        type: 'user',
}, async (m, text) => {
        const num = await m.client.fetchBlocklist();
        if (!num?.length) return await m.send("_No blocked users found!_");
        const blockList = `_*❏ Block List ❏*_\n\n${num.map(n => `➟ +${n.replace('@s.whatsapp.net', '')}`).join('\n')}`;
        return await m.send(blockList);        
})

kord({
        cmd: "setname",
        desc: "set profile name",
        fromMe: true,
        type: "user",
}, async (m, text) => {
        q = text
if (!q) return await m.send(`_*provide a name to set!*_\n_Example: ${prefix}setname Mirage_`);
        await m.client.updateProfileName(q);
        await m.reply(`_Profile name updated to ${q}_`);        
})

kord({
        cmd: "bio|setbio",
        desc: "set bio for profile",
        fromMe: true,
        type: "user",
}, async (m, text) => {
        let query = text
    if (!query) return await m.send(`*_Provide A Text*_\n_example: ${prefix}setbio urgent calls only._`);
    await m.client.updateProfileStatus(query);
    await m.send('_Bio updated_');        
})

kord({
  cmd: "getpp",
  desc: "get profile pic of a user/group",
  fromMe: true,
  type: "user",
}, async (m, text) => {
  if (m.isGroup && !m.quoted.sender) {
    var pic = await m.client.profilePictureUrl(m.chat, 'image')
    return await m.send(pic, {}, "image")
  } else if (m.isGroup && m.quoted.sender) {
    var pic = await m.client.profilePictureUrl(m.quoted.sender, 'image')
    return await m.send(pic, {}, "image")
  } else if (m.quoted.sender) {
    var pic = await m.client.profilePictureUrl(m.quoted.sender, 'image')
    return await m.send(pic, {}, "image")
  } else {
    var pic = await m.client.profilePictureUrl(m.chat, 'image')
    return await m.send(pic, {}, "image")
  }
})


kord({
        cmd: "forward|fwrd",
        desc: "forward a message",
        fromMe: true,
        type: "user",
}, async (m, text, cmd, store) => {
        if (!m.quoted) return await m.send("_reply to the msg you want to forward.._")
        if (!text) return await m.send(`_*Provide a number/jid!*_\n_example ${cmd} 2348033221144_\n_${cmd} 2348033221144@s.whatsapp.net_\n\nuse ${prefix}jid to get the jid of a chat`)
        let jidd
        if (text.includes("@g.us") || text.includes("@s.whatsapp.net") || text.includes("newsletter")) {
        jidd = text;
} else {
        jidd = `${text}@s.whatsapp.net`;
}
        await m.forwardMessage(jidd, await store.loadMessage(m.chat, m.quoted))
})

kord({
	cmd: 'lastseen',
	fromMe: true,
	desc: 'to change lastseen privacy',
	type: 'privacy'
}, async (message, match, cmd) => {
	if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change last seen privacy settings_`);
	const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
	if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
	await message.client.updateLastSeenPrivacy(match)
	await message.send(`_Privacy settings *last seen* Updated to *${match}*_`);
})
kord({
	cmd: 'online',
	fromMe: true,
	desc: 'to change online privacy',
	type: 'privacy'
}, async (message, match, cmd) => {
	if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *online*  privacy settings_`);
	const available_privacy = ['all', 'match_last_seen'];
	if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
	await message.client.updateOnlinePrivacy(match)
	await message.send(`_Privacy Updated to *${match}*_`);
})
kord({
	cmd: 'mypp',
	fromMe: true,
	desc: 'privacy setting profile picture',
	type: 'privacy'
}, async (message, match, cmd) => {
	if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *profile picture*  privacy settings_`);
	const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
	if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
	await message.client.updateProfilePicturePrivacy(match)
	await message.send(`_Privacy Updated to *${match}*_`);
})
kord({
	cmd: 'mystatus',
	fromMe: true,
	desc: 'privacy for my status',
	type: 'privacy'
}, async (message, match, cmd) => {
	if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *status*  privacy settings_`);
	const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
	if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
	await message.client.updateStatusPrivacy(match)
	await message.send(`_Privacy Updated to *${match}*_`);
})
kord({
	cmd: 'read',
	fromMe: true,
	desc: 'privacy for read message',
	type: 'privacy'
}, async (message, match, cmd) => {
	if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *read and receipts message*  privacy settings_`);
	const available_privacy = ['all', 'none'];
	if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
	await message.client.updateReadReceiptsPrivacy(match)
	await message.send(`_Privacy Updated to *${match}*_`);
})
kord({
	cmd: 'allow-gcadd|groupadd',
	fromMe: true,
	desc: 'privacy for group add',
	type: 'privacy'
}, async (message, match, cmd) => {
	if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *group add*  privacy settings_`);
	const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
	if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
	await message.client.updateGroupsAddPrivacy(match)
	await message.send(`_Privacy Updated to *${match}*_`);
})
