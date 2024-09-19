module.exports = {
    usage: ["checkme", "chkme"],
    desc: "Generates Random info about a user",
    commandType: "utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "💬",

    async execute(sock, m, args) {
        const sifat = ['Fine', 'Unfriendly', 'Chapri', 'Nibba/nibbi', 'Annoying', 'Dilapidated', 'Angry person', 'Polite', 'Burden', 'Great', 'Cringe', 'Liar'];
        const hoby = ['Cooking', 'Dancing', 'Playing', 'Gaming', 'Painting', 'Helping Others', 'Watching anime', 'Reading', 'Riding Bike', 'Singing', 'Chatting', 'Sharing Memes', 'Drawing', 'Eating Parents Money', 'Playing Truth or Dare', 'Staying Alone'];
        const cakep = ['Yes', 'No', 'Very Ugly', 'Very Handsome'];
        const wetak = ['Caring', 'Generous', 'Angry person', 'Sorry', 'Submissive', 'Fine', 'Im sorry', 'Kind Hearted', 'Patient', 'UwU', 'Top', 'Helpful'];

        const getRandomValue = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const getRandomPercentage = () => Math.floor(Math.random() * 101);

        const profile = `*Name :* ${m.pushName}
*Characteristic :* ${getRandomValue(sifat)}
*Hobby :* ${getRandomValue(hoby)}
*Simp :* ${getRandomPercentage()}%
*Great :* ${getRandomPercentage()}%
*Handsome :* ${getRandomValue(cakep)}
*Character :* ${getRandomValue(wetak)}
*Good Morals :* ${getRandomPercentage()}%
*Bad Morals :* ${getRandomPercentage()}%
*Intelligence :* ${getRandomPercentage()}%
*Courage :* ${getRandomPercentage()}%
*Afraid :* ${getRandomPercentage()}%`;

        let ppuser;
        try {
            ppuser = await sock.profilePictureUrl(m.sender, 'image');
        } catch (err) {
            ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60';
        }

        const ppkord = await getBuffer(ppuser);

        // Assuming you have a function to send a message with an image
        await sock.sendMessage(m.chat, { image: ppkord, caption: profile }, { quoted: m });
    }
};