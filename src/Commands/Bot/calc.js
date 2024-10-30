module.exports = {
    usage: ["calc", "calculate"],
    desc: "Performs basic arithmetic calculations",
    commandType: "utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🧮",

    async execute(sock, m, args) {
        if (!args[0]) return await global.kord.freply(m, 'Please provide a calculation to perform. Example: 2 + 2');

        const calculation = args.join(' ');
        try {
            // Using eval() can be dangerous if user input is not sanitized properly
            // Here we're using a simple regex to allow only basic arithmetic operations
            if (!/^[\d\s\+\-\*\/\(\)\.]+$/.test(calculation)) {
                throw new Error('Invalid characters in calculation');
            }

            const result = eval(calculation);
            await global.kord.freply(m, `Result: ${calculation} = ${result}`);
        } catch (error) {
            console.error('Error in calculation', error.message);
            await global.kord.freply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};