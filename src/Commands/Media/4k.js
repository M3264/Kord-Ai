const fetch = require('node-fetch');

module.exports = {
  usage: '4kpic',
  description: 'Fetch and send the first 5 wallpapers based on a search query.',
  isPrivateOnly: false,
  isGroupOnly: false,
  isAdminOnly: false,
  async execute(sock, m, args) {
    if (!args.length) {
      return await kord.freply(m, '*Please provide a search query!*');
    }

    const query = args.join(' ');
    const apiUrl = `https://api.kordai.us.kg/wallpapers/search?q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch wallpapers.');

      const result = await response.json();
      
      if (!result.success || !result.data || !result.data.wallpapers || !result.data.wallpapers.length) {
        return await kord.freply(m, '*No wallpapers found!*');
      }
      
      await kord.freply(m, `_*Sending 5 First Pictures for ${query}_*`)

      const wallpapers = result.data.wallpapers.slice(0, 5);
      for (const wallpaper of wallpapers) {
        if (wallpaper.highestResLink && wallpaper.highestResLink.url) {
          let caption = `*${wallpaper.title || 'Wallpaper'}*\n` +
                       `Resolution: ${wallpaper.highestResLink.resolution}\n` +
                       `Category: ${wallpaper.highestResLink.category}\n` +
                       `Tags: ${wallpaper.tags.join(', ')}`;
          
          caption = await kord.changeFont(caption, 'smallBoldScript');
          
          await kord.sendImage(m, wallpaper.highestResLink.url, caption);
        }
      }
    } catch (error) {
      await kord.freply(m, `Error: ${error.message}`);
    }
  }
};