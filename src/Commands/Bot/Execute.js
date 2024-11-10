const { performance } = require('perf_hooks');
const util = require('util');

module.exports = {
    usage: ["exec", "run"],
    desc: "Execute JavaScript code with advanced features (admin-only)",
    commandType: 'Bot',
    isPrivateOnly: false,
    isAdminOnly: true,
    emoji: "🚀",
    async execute(sock, m, args) {
        try {
            const sender = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;
            if (!args || args.length === 0) {
                return kord.reply(m, '❓ Please provide the JavaScript code you want to execute.');
            }

            const codeToExecute = args.join(' ');
            const startTime = performance.now();

            // Capture console.log output
            let consoleOutput = [];
            const originalConsoleLog = console.log;
            console.log = (...args) => {
                consoleOutput.push(args.map(arg => util.inspect(arg, { depth: 2, colors: false })).join(' '));
                originalConsoleLog(...args);
            };

            // Execute the code with a timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Execution timed out')), 30000)
            );
            const executionPromise = new Promise(async (resolve) => {
                const result = await eval(`(async () => { ${codeToExecute} })()`);
                resolve(result);
            });

            const result = await Promise.race([executionPromise, timeoutPromise]);
            const endTime = performance.now();

            // Restore original console.log
            console.log = originalConsoleLog;

            // Format the result
            const formattedResult = util.inspect(result, { depth: 2, colors: false });
            
            const executionTime = (endTime - startTime) / 1000;
            const memoryUsage = process.memoryUsage();

            let replyMessage = `🚀 *Code Execution Report* 🚀\n\n`;
            replyMessage += `📊 *Result:*\n\`\`\`\n${formattedResult}\n\`\`\`\n\n`;
            if (consoleOutput.length > 0) {
                replyMessage += `📟 *Console Output:*\n\`\`\`\n${consoleOutput.join('\n')}\n\`\`\`\n\n`;
            }
            replyMessage += `📈 *Performance Metrics:*\n`;
            replyMessage += `⏱️ Execution Time: ${executionTime.toFixed(3)} seconds\n`;
            replyMessage += `💾 Memory Usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`;
            replyMessage += `👤 *Executed By:* @${sender.split("@")[0]}\n`;
            replyMessage += `🕒 *Timestamp:* ${new Date().toISOString()}\n`;

            const mentions = m.key.remoteJid.endsWith('@g.us') ? [sender] : [];
            await kord.replyWithMention(m, replyMessage, mentions);

            // Log execution details
            console.log(`Code executed by ${sender}:\n${codeToExecute}\n`);
            console.log(`Execution result:`, result);
        } catch (error) {
            console.error('Error executing code:', error);
            const errorMessage = `⚠️ *Execution Error*\n\n` +
                                 `🔴 *Message:* ${error.message}\n` +
                                 `📍 *Stack:*\n\`\`\`\n${error.stack}\n\`\`\``;
            await kord.reply(m, errorMessage);
        }
    }
};
