const axios = require('axios');

// Helper function to fetch random character image
async function fetchRandomCharacterImage(characterId) {
    try {
        // Fetch all available pictures for the character
        const response = await axios.get(`https://api.jikan.moe/v4/characters/${characterId}/pictures`);
        if (response.data.data && response.data.data.length > 0) {
            // Randomly select one image from all available images
            const randomIndex = Math.floor(Math.random() * response.data.data.length);
            return response.data.data[randomIndex].jpg.image_url;
        }
        
        // If no pictures found, try fetching from alternative sources
        const altResponse = await axios.get(`https://api.jikan.moe/v4/characters/${characterId}`);
        if (altResponse.data.data?.images?.jpg?.image_url) {
            return altResponse.data.data.images.jpg.image_url;
        }
        
        return null;
    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error.message);
        return null;
    }
}

// Helper function to fetch images from Danbooru as backup
async function fetchBackupImage(characterName, series) {
    try {
        const response = await axios.get('https://danbooru.donmai.us/posts.json', {
            params: {
                tags: `${characterName} ${series} rating:safe`,
                limit: 20,
                random: true
            }
        });

        if (response.data && response.data.length > 0) {
            const randomPost = response.data[Math.floor(Math.random() * response.data.length)];
            return randomPost.file_url || randomPost.large_file_url;
        }
        return null;
    } catch (error) {
        console.error('Error fetching backup image:', error.message);
        return null;
    }
}

// Add delay between API calls to respect rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Common execute function template with random image selection
const createCharacterCommand = (name, characterId, emoji, series) => ({
    usage: [name.toLowerCase()],
    desc: `Fetch random ${name} images from ${series}`,
    commandType: "Anime",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emoji,

    async execute(sock, m, args) {
        try {
            await global.kord.reply(m, `> Fetching a random ${name} image...`);
            
            // Try primary source first
            let imageUrl = await fetchRandomCharacterImage(characterId);
            
            // If primary source fails, try backup source
            if (!imageUrl) {
                await delay(1000); // Respect API rate limits
                imageUrl = await fetchBackupImage(name, series);
            }
            
            if (!imageUrl) {
                return await global.kord.reply(m, `❌ Failed to fetch ${name}'s image. Please try again later.`);
            }

            const caption = `✨ *${name}*\n` +
                          `🎌 From: ${series}\n` +
                          `💫 Use .char ${name} for more info!`;

            await global.kord.sendImage(m, imageUrl, caption);
        } catch (error) {
            console.error(`Error in ${name} command:`, error.message);
            await global.kord.reply(m, '❌ An error occurred while fetching the image. Please try again later.');
        }
    }
});

module.exports = [
    // Naruto Series
    createCharacterCommand("Naruto", 17, "🍜", "Naruto"),
    createCharacterCommand("Sasuke", 13, "⚡", "Naruto"),
    createCharacterCommand("Sakura", 145, "👊", "Naruto"),
    createCharacterCommand("Kakashi", 85, "📖", "Naruto"),
    createCharacterCommand("Hinata", 1555, "👀", "Naruto"),
    createCharacterCommand("Itachi", 14, "🌙", "Naruto"),
    createCharacterCommand("Jiraiya", 2423, "🐸", "Naruto"),
    createCharacterCommand("Tsunade", 2767, "💎", "Naruto"),
    createCharacterCommand("Gaara", 1662, "🏜️", "Naruto"),
    createCharacterCommand("Minato", 2730, "⚡", "Naruto"),

    // One Piece
    createCharacterCommand("Luffy", 40, "🏴‍☠️", "One Piece"),
    createCharacterCommand("Zoro", 62, "🗡️", "One Piece"),
    createCharacterCommand("Nami", 723, "🗺️", "One Piece"),
    createCharacterCommand("Sanji", 305, "🍳", "One Piece"),
    createCharacterCommand("Ace", 724, "🔥", "One Piece"),
    createCharacterCommand("Robin", 309, "🌸", "One Piece"),
    createCharacterCommand("Chopper", 307, "🦌", "One Piece"),
    createCharacterCommand("Usopp", 306, "🎯", "One Piece"),
    createCharacterCommand("Brook", 308, "🎻", "One Piece"),
    createCharacterCommand("Franky", 310, "🤖", "One Piece"),

    // Attack on Titan
    createCharacterCommand("Eren", 40882, "🔥", "Attack on Titan"),
    createCharacterCommand("Mikasa", 40881, "⚔️", "Attack on Titan"),
    createCharacterCommand("Levi", 45627, "🗡️", "Attack on Titan"),
    createCharacterCommand("Armin", 46494, "📚", "Attack on Titan"),
    createCharacterCommand("Annie", 46494, "💎", "Attack on Titan"),
    createCharacterCommand("Historia", 46494, "👑", "Attack on Titan"),
    createCharacterCommand("Reiner", 46494, "🛡️", "Attack on Titan"),
    createCharacterCommand("Zeke", 46494, "🐒", "Attack on Titan"),

    // Demon Slayer
    createCharacterCommand("Tanjiro", 146156, "💧", "Demon Slayer"),
    createCharacterCommand("Nezuko", 146157, "🎎", "Demon Slayer"),
    createCharacterCommand("Zenitsu", 146158, "⚡", "Demon Slayer"),
    createCharacterCommand("Inosuke", 146159, "🐗", "Demon Slayer"),
    createCharacterCommand("Giyu", 146160, "🌊", "Demon Slayer"),
    createCharacterCommand("Rengoku", 146161, "🔥", "Demon Slayer"),
    createCharacterCommand("Shinobu", 146162, "🦋", "Demon Slayer"),
    createCharacterCommand("Muzan", 146163, "🌙", "Demon Slayer"),

    // My Hero Academia
    createCharacterCommand("Deku", 117921, "🦸", "My Hero Academia"),
    createCharacterCommand("Bakugo", 117911, "💥", "My Hero Academia"),
    createCharacterCommand("Todoroki", 127222, "❄️", "My Hero Academia"),
    createCharacterCommand("AllMight", 117917, "💪", "My Hero Academia"),
    createCharacterCommand("Uraraka", 117916, "🎈", "My Hero Academia"),
    createCharacterCommand("Kirishima", 117912, "🪨", "My Hero Academia"),
    createCharacterCommand("Iida", 117918, "🏃", "My Hero Academia"),
    createCharacterCommand("Aizawa", 117913, "👁️", "My Hero Academia"),

    // Dragon Ball Series
    createCharacterCommand("Goku", 246, "🐉", "Dragon Ball"),
    createCharacterCommand("Vegeta", 913, "👑", "Dragon Ball"),
    createCharacterCommand("Gohan", 305, "📚", "Dragon Ball"),
    createCharacterCommand("Trunks", 914, "⚔️", "Dragon Ball"),
    createCharacterCommand("Piccolo", 915, "👽", "Dragon Ball"),
    createCharacterCommand("Goten", 916, "👦", "Dragon Ball"),
    createCharacterCommand("Frieza", 917, "🦎", "Dragon Ball"),
    createCharacterCommand("Beerus", 918, "🐱", "Dragon Ball"),

    // Jujutsu Kaisen
    createCharacterCommand("Yuji", 163847, "👊", "Jujutsu Kaisen"),
    createCharacterCommand("Megumi", 163848, "🐺", "Jujutsu Kaisen"),
    createCharacterCommand("Nobara", 163849, "🔨", "Jujutsu Kaisen"),
    createCharacterCommand("Gojo", 163850, "👁️", "Jujutsu Kaisen"),
    createCharacterCommand("Sukuna", 163851, "👿", "Jujutsu Kaisen"),
    createCharacterCommand("Nanami", 163852, "⚔️", "Jujutsu Kaisen"),
    createCharacterCommand("Maki", 163853, "🗡️", "Jujutsu Kaisen"),
    createCharacterCommand("Todo", 163854, "💪", "Jujutsu Kaisen"),

    // Death Note
    createCharacterCommand("Light", 80, "📓", "Death Note"),
    createCharacterCommand("L", 71, "🍬", "Death Note"),
    createCharacterCommand("Misa", 81, "👗", "Death Note"),
    createCharacterCommand("Near", 82, "🎲", "Death Note"),
    createCharacterCommand("Mello", 83, "🍫", "Death Note"),
    createCharacterCommand("Ryuk", 75, "🍎", "Death Note"),

    /* // Tokyo Revengers
    createCharacterCommand("Takemichi", 173530, "⏰", "Tokyo Revengers"),
    createCharacterCommand("Mikey", 173531, "🏍️", "Tokyo Revengers"),
    createCharacterCommand("Draken", 173532, "🐉", "Tokyo Revengers"),
    createCharacterCommand("Chifuyu", 173533, "🐺", "Tokyo Revengers"),
    createCharacterCommand("Baji", 173534, "⚔️", "Tokyo Revengers"),

    // Chainsaw Man
    createCharacterCommand("Denji", 170734, "⛓️", "Chainsaw Man"),
    createCharacterCommand("Power", 170735, "🩸", "Chainsaw Man"),
    createCharacterCommand("Makima", 170736, "👁️", "Chainsaw Man"),
    createCharacterCommand("Aki", 170737, "🦊", "Chainsaw Man"),
    createCharacterCommand("Reze", 170738, "💣", "Chainsaw Man"),

    // Tokyo Ghoul
    createCharacterCommand("Kaneki", 87275, "👁️", "Tokyo Ghoul"),
    createCharacterCommand("Touka", 87277, "🦋", "Tokyo Ghoul"),
    createCharacterCommand("Hide", 87278, "🎧", "Tokyo Ghoul"),
    createCharacterCommand("Rize", 87276, "📚", "Tokyo Ghoul"),
    createCharacterCommand("Juuzou", 87279, "🧵", "Tokyo Ghoul"),

    // Black Clover
    createCharacterCommand("Asta", 139891, "⚔️", "Black Clover"),
    createCharacterCommand("Yuno", 139892, "🌪️", "Black Clover"),
    createCharacterCommand("Noelle", 139893, "💧", "Black Clover"),
    createCharacterCommand("Yami", 139894, "⚔️", "Black Clover"),
    createCharacterCommand("Luck", 139895, "⚡", "Black Clover"),

    // Hunter x Hunter
    createCharacterCommand("Gon", 30, "🎣", "Hunter x Hunter"),
    createCharacterCommand("Killua", 27, "⚡", "Hunter x Hunter"),
    createCharacterCommand("Kurapika", 28, "⛓️", "Hunter x Hunter"),
    createCharacterCommand("Leorio", 29, "💼", "Hunter x Hunter"),
    createCharacterCommand("Hisoka", 31, "🃏", "Hunter x Hunter"),

    // Bleach
    createCharacterCommand("Ichigo", 5, "⚔️", "Bleach"),
    createCharacterCommand("Rukia", 6, "❄️", "Bleach"),
    createCharacterCommand("Aizen", 314, "👓", "Bleach"),
    createCharacterCommand("Byakuya", 7, "🌸", "Bleach"),
    createCharacterCommand("Toshiro", 8, "❄️", "Bleach"),

    // Full Metal Alchemist
    createCharacterCommand("Edward", 11, "⚗️", "Fullmetal Alchemist"),
    createCharacterCommand("Alphonse", 12, "🛡️", "Fullmetal Alchemist"),
    createCharacterCommand("Mustang", 13, "🔥", "Fullmetal Alchemist"),
    createCharacterCommand("Hawkeye", 14, "🎯", "Fullmetal Alchemist"),
    createCharacterCommand("Armstrong", 15, "💪", "Fullmetal Alchemist"),

    // Haikyuu
    createCharacterCommand("Hinata", 64769, "🏐", "Haikyuu"),
    createCharacterCommand("Kageyama", 64771, "👑", "Haikyuu"),
    createCharacterCommand("Oikawa", 64773, "🌟", "Haikyuu"),
    createCharacterCommand("Kenma", 64775, "🎮", "Haikyuu"),
    createCharacterCommand("Bokuto", 64777, "🦉", "Haikyuu"),

    // [Continue with more characters...]

    // Additional Popular Characters
    createCharacterCommand("ZeroTwo", 155679, "🦖", "Darling in the Franxx"),
    createCharacterCommand("Marin", 185217, "👗", "My Dress-Up Darling"),
    createCharacterCommand("Anya", 185151, "🥜", "Spy x Family"),
    createCharacterCommand("Loid", 185152, "🕵️", "Spy x Family"),
    createCharacterCommand("Yor", 185153, "🗡️", "Spy x Family"),
    createCharacterCommand("Miku", 40391, "🎤", "Vocaloid"),
    createCharacterCommand("Violet", 141354, "✉️", "Violet Evergarden"),
    createCharacterCommand("Shinobu", 187789, "🦋", "Monogatari Series"),
    createCharacterCommand("Asuna", 36828, "⚔️", "Sword Art Online"),
    createCharacterCommand("Kirito", 36765, "⚔️", "Sword Art Online"),
    
    createCharacterCommand("Lelouch", 417, "👁️", "Code Geass"),
    createCharacterCommand("CC", 418, "🍕", "Code Geass"),
    createCharacterCommand("Suzaku", 419, "⚔️", "Code Geass"),
    createCharacterCommand("Kallen", 420, "🤖", "Code Geass"),
    createCharacterCommand("Nunnally", 421, "🦋", "Code Geass"),

    // Steins;Gate
    createCharacterCommand("Okabe", 35252, "⚗️", "Steins;Gate"),
    createCharacterCommand("Kurisu", 34470, "🧪", "Steins;Gate"),
    createCharacterCommand("Mayuri", 35253, "🕊️", "Steins;Gate"),
    createCharacterCommand("Daru", 35254, "💻", "Steins;Gate"),
    createCharacterCommand("Suzuha", 35255, "🚲", "Steins;Gate"), 
    // JoJo's Bizarre Adventure
    createCharacterCommand("Jonathan", 4714, "⭐", "JoJo's Bizarre Adventure"),
    createCharacterCommand("Joseph", 4715, "🧠", "JoJo's Bizarre Adventure"),
    createCharacterCommand("Jotaro", 4716, "👊", "JoJo's Bizarre Adventure"),
    createCharacterCommand("Dio", 4717, "🧛", "JoJo's Bizarre Adventure"),
    createCharacterCommand("Giorno", 4718, "🌟", "JoJo's Bizarre Adventure"),

    // One Punch Man
    createCharacterCommand("Saitama", 73935, "👊", "One Punch Man"),
    createCharacterCommand("Genos", 73979, "🤖", "One Punch Man"),
    createCharacterCommand("Tatsumaki", 81929, "🌪️", "One Punch Man"),
    createCharacterCommand("Garou", 112889, "👹", "One Punch Man"),
    createCharacterCommand("King", 81931, "👑", "One Punch Man"),

    // Re:Zero
    createCharacterCommand("Subaru", 118735, "🕰️", "Re:Zero"),
    createCharacterCommand("Emilia", 118737, "❄️", "Re:Zero"),
    createCharacterCommand("Rem", 118736, "🌸", "Re:Zero"),
    createCharacterCommand("Ram", 118739, "🎀", "Re:Zero"),
    createCharacterCommand("Beatrice", 118738, "📚", "Re:Zero"),

    // Gintama
    createCharacterCommand("Gintoki", 672, "🍬", "Gintama"),
    createCharacterCommand("Kagura", 674, "☂️", "Gintama"),
    createCharacterCommand("Shinpachi", 673, "👓", "Gintama"),
    createCharacterCommand("Hijikata", 677, "🚬", "Gintama"),
    createCharacterCommand("Okita", 676, "⚔️", "Gintama"),

    // No Game No Life
    createCharacterCommand("Sora", 82523, "🎮", "No Game No Life"),
    createCharacterCommand("Shiro", 82525, "🎲", "No Game No Life"),
    createCharacterCommand("Jibril", 82527, "📚", "No Game No Life"),
    createCharacterCommand("Stephanie", 82524, "👑", "No Game No Life"),
    createCharacterCommand("Izuna", 82526, "🦊", "No Game No Life"),

    // Mob Psycho 100
    createCharacterCommand("Mob", 89334, "💫", "Mob Psycho 100"),
    createCharacterCommand("Reigen", 89333, "💼", "Mob Psycho 100"),
    createCharacterCommand("Dimple", 89335, "👻", "Mob Psycho 100"),
    createCharacterCommand("Ritsu", 89336, "🌱", "Mob Psycho 100"),
    createCharacterCommand("Teru", 89337, "⚡", "Mob Psycho 100"),

    // The Rising of the Shield Hero
    createCharacterCommand("Naofumi", 107918, "🛡️", "Shield Hero"),
    createCharacterCommand("Raphtalia", 107919, "🗡️", "Shield Hero"),
    createCharacterCommand("Filo", 107920, "🐦", "Shield Hero"),
    createCharacterCommand("Melty", 107921, "💧", "Shield Hero"),
    createCharacterCommand("Glass", 107922, "🏮", "Shield Hero"),

    // The Promised Neverland
    createCharacterCommand("Emma", 146156, "📝", "The Promised Neverland"),
    createCharacterCommand("Norman", 146157, "🧠", "The Promised Neverland"),
    createCharacterCommand("Ray", 146158, "📚", "The Promised Neverland"),
    createCharacterCommand("Isabella", 146159, "🌹", "The Promised Neverland"),
    createCharacterCommand("Phil", 146160, "👶", "The Promised Neverland"),

    // Made in Abyss
    createCharacterCommand("Riko", 133332, "🔍", "Made in Abyss"),
    createCharacterCommand("Reg", 133333, "🤖", "Made in Abyss"),
    createCharacterCommand("Nanachi", 136717, "🐰", "Made in Abyss"),
    createCharacterCommand("Bondrewd", 136718, "🎭", "Made in Abyss"),
    createCharacterCommand("Ozen", 136719, "⚔️", "Made in Abyss"),

    // Fate Series
    createCharacterCommand("Saber", 497, "⚔️", "Fate Series"),
    createCharacterCommand("Rin", 498, "💎", "Fate Series"),
    createCharacterCommand("Archer", 496, "🏹", "Fate Series"),
    createCharacterCommand("Kirito", 494, "🗡️", "Fate Series"),
    createCharacterCommand("Gilgamesh", 495, "👑", "Fate Series"),

    // Overlord
    createCharacterCommand("Ainz", 116281, "💀", "Overlord"),
    createCharacterCommand("Albedo", 116275, "👼", "Overlord"),
    createCharacterCommand("Shalltear", 116277, "🦇", "Overlord"),
    createCharacterCommand("Demiurge", 116279, "😈", "Overlord"),
    createCharacterCommand("Cocytus", 116278, "❄️", "Overlord"),

    // Dr. Stone
    createCharacterCommand("Senku", 148984, "🧪", "Dr. Stone"),
    createCharacterCommand("Taiju", 148985, "💪", "Dr. Stone"),
    createCharacterCommand("Chrome", 148986, "⚗️", "Dr. Stone"),
    createCharacterCommand("Gen", 148987, "🎭", "Dr. Stone"),
    createCharacterCommand("Kohaku", 148988, "🗡️", "Dr. Stone"),

    // Fire Force
    createCharacterCommand("Shinra", 147456, "🔥", "Fire Force"),
    createCharacterCommand("Arthur", 147457, "⚔️", "Fire Force"),
    createCharacterCommand("Tamaki", 147458, "😺", "Fire Force"),
    createCharacterCommand("Maki", 147459, "💪", "Fire Force"),
    createCharacterCommand("Obi", 147460, "👨‍🚒", "Fire Force"),

    // Noragami
    createCharacterCommand("Yato", 84677, "⚔️", "Noragami"),
    createCharacterCommand("Hiyori", 84678, "🌸", "Noragami"),
    createCharacterCommand("Yukine", 84679, "⚡", "Noragami"),
    createCharacterCommand("Bishamon", 84680, "👑", "Noragami"),
    createCharacterCommand("Kofuku", 84681, "💰", "Noragami"),

    // The Devil is a Part-Timer!
    createCharacterCommand("Maou", 70733, "👿", "The Devil is a Part-Timer"),
    createCharacterCommand("Emi", 70734, "⚔️", "The Devil is a Part-Timer"),
    createCharacterCommand("Chiho", 70735, "🎀", "The Devil is a Part-Timer"),
    createCharacterCommand("Alciel", 70736, "👔", "The Devil is a Part-Timer"),
    createCharacterCommand("Lucifer", 70737, "😈", "The Devil is a Part-Timer"),

    // That Time I Got Reincarnated as a Slime
    createCharacterCommand("Rimuru", 162887, "🌊", "Tensei Slime"),
    createCharacterCommand("Benimaru", 162888, "🔥", "Tensei Slime"),
    createCharacterCommand("Shion", 162889, "🗡️", "Tensei Slime"),
    createCharacterCommand("Milim", 162890, "👸", "Tensei Slime"),
    createCharacterCommand("Veldora", 162891, "🐉", "Tensei Slime"),

    // Assassination Classroom
    createCharacterCommand("Korosensei", 65645, "🐙", "Assassination Classroom"),
    createCharacterCommand("Nagisa", 71933, "🗡️", "Assassination Classroom"),
    createCharacterCommand("Karma", 71935, "😈", "Assassination Classroom"),
    createCharacterCommand("Kaede", 71936, "🎭", "Assassination Classroom"),
    createCharacterCommand("Irina", 71937, "💋", "Assassination Classroom"),

    // Soul Eater
    createCharacterCommand("Maka", 8439, "📚", "Soul Eater"),
    createCharacterCommand("Soul", 8440, "🎹", "Soul Eater"),
    createCharacterCommand("BlackStar", 8441, "⭐", "Soul Eater"),
    createCharacterCommand("DeathTheKid", 8442, "💀", "Soul Eater"),
    createCharacterCommand("Crona", 8443, "🗡️", "Soul Eater"),

    // Fairy Tail
    createCharacterCommand("Natsu", 5188, "🔥", "Fairy Tail"),
    createCharacterCommand("Lucy", 5189, "⭐", "Fairy Tail"),
    createCharacterCommand("Erza", 5190, "⚔️", "Fairy Tail"),
    createCharacterCommand("Gray", 5191, "❄️", "Fairy Tail"),
    createCharacterCommand("Happy", 5192, "🐱", "Fairy Tail"), */

    // The God of High School
    createCharacterCommand("Mori", 142421, "👊", "The God of High School"),
    createCharacterCommand("Daewi", 142422, "💪", "The God of High School"),
    createCharacterCommand("Mira", 142423, "🗡️", "The God of High School"),
    createCharacterCommand("Ilpyo", 142424, "🦊", "The God of High School"),
    createCharacterCommand("Mandeok", 142425, "🐉", "The God of High School"),
    
    // Blue Exorcist
    createCharacterCommand("Rin", 24482, "🔥", "Blue Exorcist"),
    createCharacterCommand("Yukio", 24483, "🔫", "Blue Exorcist"),
    createCharacterCommand("Shiemi", 24484, "🌱", "Blue Exorcist"),
    createCharacterCommand("Mephisto", 24485, "🎭", "Blue Exorcist"),
    createCharacterCommand("Shura", 24486, "🗡️", "Blue Exorcist"),

    // Classroom of the Elite
    createCharacterCommand("Ayanokoji", 123165, "🧠", "Classroom of the Elite"),
    createCharacterCommand("Horikita", 123166, "📚", "Classroom of the Elite"),
    createCharacterCommand("Kushida", 123167, "🎭", "Classroom of the Elite"),
    createCharacterCommand("Karuizawa", 123168, "👑", "Classroom of the Elite"),
    createCharacterCommand("Ryuuen", 123169, "🐉", "Classroom of the Elite"),

    // Golden Kamuy
    createCharacterCommand("Sugimoto", 124891, "🐻", "Golden Kamuy"),
    createCharacterCommand("Asirpa", 124892, "🏹", "Golden Kamuy"),
    createCharacterCommand("Shiraishi", 124893, "🦊", "Golden Kamuy"),
    createCharacterCommand("Tsurumi", 124894, "🎭", "Golden Kamuy"),
    createCharacterCommand("Tanigaki", 124895, "🗡️", "Golden Kamuy"),

    // Bungo Stray Dogs
    createCharacterCommand("Atsushi", 124683, "🐯", "Bungo Stray Dogs"),
    createCharacterCommand("Dazai", 124684, "🌊", "Bungo Stray Dogs"),
    createCharacterCommand("Chuuya", 124685, "🎩", "Bungo Stray Dogs"),
    createCharacterCommand("Akutagawa", 124686, "🐉", "Bungo Stray Dogs"),
    createCharacterCommand("Kyouka", 124687, "🗡️", "Bungo Stray Dogs"),

    // Grand Blue
    createCharacterCommand("Iori", 157567, "🏊", "Grand Blue"),
    createCharacterCommand("Kouhei", 157568, "🍺", "Grand Blue"),
    createCharacterCommand("Chisa", 157569, "🤿", "Grand Blue"),
    createCharacterCommand("Nanaka", 157570, "🌊", "Grand Blue"),
    createCharacterCommand("Azusa", 157571, "🏖️", "Grand Blue"),

    // Link Click
    createCharacterCommand("Xiaoshi", 176937, "📸", "Link Click"),
    createCharacterCommand("LuGuang", 176938, "⏰", "Link Click"),
    createCharacterCommand("Qiao", 176939, "🎭", "Link Click"),
    createCharacterCommand("Ling", 176940, "🌸", "Link Click"),
    createCharacterCommand("Emma", 176941, "🎨", "Link Click"),

    // Bungou Stray Dogs
    createCharacterCommand("Ranpo", 124688, "🔍", "Bungo Stray Dogs"),
    createCharacterCommand("Kunikida", 124689, "📝", "Bungo Stray Dogs"),
    createCharacterCommand("Yosano", 124690, "⚕️", "Bungo Stray Dogs"),
    createCharacterCommand("Fitzgerald", 124691, "💰", "Bungo Stray Dogs"),
    createCharacterCommand("Fukuzawa", 124692, "⚔️", "Bungo Stray Dogs")
];