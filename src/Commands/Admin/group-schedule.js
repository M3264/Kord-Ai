const { getData, storeData } = require("../../Database/syncdb");
const cron = require("node-cron");

const activeJobs = new Map();


(async function() {
  const configs = ["amute_config", "aunmute_config"];
  for (const config of configs) {
    const exist = await getData(config);
    if (!exist) await storeData(config, "[]");
  }
})();


async function addSchedule(type, chatId, time) {
  try {
    const configKey = type === "mute" ? "amute_config" : "aunmute_config";
    let data = await getData(configKey);
    if (!Array.isArray(data)) data = [];

    const newEntry = { id: chatId, [type]: time };
    const existingIndex = data.findIndex(entry => entry.id === chatId);

    if (existingIndex !== -1) {
      data[existingIndex][type] = time;
    } else {
      data.push(newEntry);
    }

    await storeData(configKey, data);
    
    refreshSchedule(type, chatId, time);
    
    return time;
  } catch (e) {
    return e;
  }
}

async function deleteSchedule(type, chatId) {
  try {
    const configKey = type === "mute" ? "amute_config" : "aunmute_config";
    let data = await getData(configKey);
    if (!Array.isArray(data)) return "No valid data found.";

    const existingIndex = data.findIndex(entry => entry.id === chatId);
    if (existingIndex === -1) return `No ${type} schedule found for this group`;

    if (type === "all") {
      data = data.filter(entry => entry.id !== chatId);
    } else {
      data[existingIndex][type] = "false";
    }

    await storeData(configKey, data);
   
    const jobKey = `${chatId}_${type}`;
    if (activeJobs.has(jobKey)) {
      activeJobs.get(jobKey).stop();
      activeJobs.delete(jobKey);
    }
    
    return `Deleted ${type} schedule for this group`;
  } catch (e) {
    return e;
  }
}

function refreshSchedule(type, chatId, time, sock) {
  const jobKey = `${chatId}_${type}`;
  
  if (activeJobs.has(jobKey)) {
    activeJobs.get(jobKey).stop();
    activeJobs.delete(jobKey);
  }
  
  if (time === "false" || !time) return;
  
  const [hr, min] = time.split(":");
  const groupSetting = type === "mute" ? "announcement" : "not_announcement";
  
  const job = cron.schedule(`${min} ${hr} * * *`, async () => {
    try {
      if (!sock) {
        console.error('No sock instance available for scheduled task');
        return;
      }
      await sock.groupSettingUpdate(chatId, groupSetting);
      console.log(`${type} executed for ${chatId} at ${hr}:${min}`);
    } catch (error) {
      console.error(`Error in cron job for ${chatId}:`, error);
    }
  }, {
    scheduled: true,
    timezone: global.settings.TIME_ZONE
  });
  
  activeJobs.set(jobKey, job);
}

async function initSchedules(sock) {
  try {
    const muteData = await getData("amute_config");
    if (Array.isArray(muteData)) {
      for (const entry of muteData) {
        if (entry.mute && entry.mute !== "false") {
          refreshSchedule("mute", entry.id, entry.mute, sock);
        }
      }
    }
    const unmuteData = await getData("aunmute_config");
    if (Array.isArray(unmuteData)) {
      for (const entry of unmuteData) {
        if (entry.unmute && entry.unmute !== "false") {
          refreshSchedule("unmute", entry.id, entry.unmute, sock);
        }
      }
    }
    
    console.log("All schedules initialized successfully");
  } catch (error) {
    console.error("Error initializing schedules:", error);
  }
}

module.exports = [
  {
    usage: ["amute", "schedule-mute"],
    desc: "Automatically mutes group at a given time",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    execute: async (sock, m, args, kord) => {
      try {
        if (!args[0] || !args[0].includes(":")) {
          return kord.reply(`_Provide correct format.\nEg: ${global.settings.PREFIX[0]}amute 22:00_`);
        }
        await addSchedule("mute", m.chat, args[0]);
        
        refreshSchedule("mute", m.chat, args[0], sock);
        
        kord.reply(`_Scheduled mute at ${args[0]}_`);
      } catch (e) {
        console.error(e);
        kord.send(`${e}`);
      }
    }
  },
  {
    usage: ["aunmute", "schedule-unmute"],
    desc: "Automatically unmutes group at a given time",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    execute: async (sock, m, args, kord) => {
      try {
        if (!args[0] || !args[0].includes(":")) {
          return kord.reply(`_Provide correct format.\nEg: ${global.settings.PREFIX[0]}aunmute 22:00_`);
        }
        await addSchedule("unmute", m.chat, args[0]);
        refreshSchedule("unmute", m.chat, args[0], sock);
        
        kord.reply(`_Scheduled unmute at ${args[0]}_`);
      } catch (e) {
        console.error(e);
        kord.send(`${e}`);
      }
    }
  },
  {
    usage: ["dlt-mute", "delete-schedule-mute"],
    desc: "Remove automatic mute for a group",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    execute: async (sock, m, args, kord) => {
      try {
        const result = await deleteSchedule("mute", m.chat);
        kord.reply(`_${result}_`);
      } catch (err) {
        console.error(err);
        kord.send(`${err}`);
      }
    }
  },
  {
    usage: ["dlt-unmute", "delete-schedule-unmute"],
    desc: "Remove automatic unmute for a group",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    execute: async (sock, m, args, kord) => {
      try {
        const result = await deleteSchedule("unmute", m.chat);
        kord.reply(`_${result}_`);
      } catch (err) {
        console.error(err);
        kord.send(`${err}`);
      }
    }
  },
  {
    usage: ["schedule-list", "list-schedules"],
    desc: "Show all scheduled mute/unmute for this group",
    commandType: "Group",
    isGroupOnly: true,
    execute: async (sock, m, args, kord) => {
      try {
        const muteData = await getData("amute_config");
        const unmuteData = await getData("aunmute_config");
        
        const muteInfo = Array.isArray(muteData) ? 
          muteData.find(entry => entry.id === m.chat && entry.mute && entry.mute !== "false") : null;
        
        const unmuteInfo = Array.isArray(unmuteData) ? 
          unmuteData.find(entry => entry.id === m.chat && entry.unmute && entry.unmute !== "false") : null;
        
        let message = "*Group Schedule Settings*\n\n";
        message += muteInfo ? `*Mute*: ${muteInfo.mute}\n` : "*Mute*: Not scheduled\n";
        message += unmuteInfo ? `*Unmute*: ${unmuteInfo.unmute}` : "*Unmute*: Not scheduled";
        
        kord.reply(message);
      } catch (err) {
        console.error(err);
        kord.send(`${err}`);
      }
    }
  },
  {
    usage: ["dlt-all-schedules", "clear-schedules"],
    desc: "Remove all schedules for this group",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    execute: async (sock, m, args, kord) => {
      try {
        await deleteSchedule("mute", m.chat);
        await deleteSchedule("unmute", m.chat);
        kord.reply("_All schedules have been cleared for this group_");
      } catch (err) {
        console.error(err);
        kord.send(`${err}`);
      }
    }
  },
  {
    usage: ["schedule", "set-schedule"],
    desc: "Set both mute and unmute times at once",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    execute: async (sock, m, args, kord) => {
      try {
        if (args.length < 2 || !args[0].includes(":") || !args[1].includes(":")) {
          return kord.reply(`_Provide correct format.\nEg: ${global.settings.PREFIX[0]}schedule 22:00 06:00_\n(mute_time unmute_time)`);
        }
        
        const muteTime = args[0];
        const unmuteTime = args[1];
        
        await addSchedule("mute", m.chat, muteTime);
        await addSchedule("unmute", m.chat, unmuteTime);
        
        refreshSchedule("mute", m.chat, muteTime, sock);
        refreshSchedule("unmute", m.chat, unmuteTime, sock);
        
        kord.reply(`_Schedule set:\nMute at ${muteTime}\nUnmute at ${unmuteTime}_`);
      } catch (e) {
        console.error(e);
        kord.send(`${e}`);
      }
    }
  }
];


module.exports.initSchedules = initSchedules;