module.exports = {
    event: ['call'],
    desc: 'Reject Whatsapp Call Coming to Bot!',
    isEnabled: global.settings.REJECT_CALLS,
    async execute(sock, call) {
        const chalk = (await import('chalk')).default;
        console.log(chalk.blue('RejectCall: Incoming call detected'));

        // Access the call object and status
        const callFrom = call.from || call[0]?.from;
        console.log(chalk.cyan(`RejectCall: Incoming call from ${callFrom}`));

        try {
            // Reject the call immediately
            if (typeof sock.rejectCall === 'function') {
                await sock.rejectCall(call.id, callFrom);
                console.log(chalk.green(`RejectCall: Call from ${callFrom} rejected successfully`));
            } else {
                console.error(chalk.red('RejectCall: sock.rejectCall is not a function, falling back.'));
                
                // Fallback to updating presence if rejectCall is unavailable
                if (typeof sock.updatePresence === 'function') {
                    await sock.updatePresence(callFrom, 'unavailable');
                    console.log(chalk.green(`RejectCall: Presence set to 'unavailable' for ${callFrom}`));
                } else {
                    console.error(chalk.red('RejectCall: No method available to reject the call.'));
                }
            }

            // Send a message to the caller
            const message = "You Can't Call Me At The Moment, Try Again Later";
            await sock.sendMessage(callFrom, { text: message });
            console.log(chalk.green(`RejectCall: Sent message to ${callFrom}: "${message}"`));

        } catch (error) {
            console.error(chalk.red(`RejectCall: Error rejecting call:`, error));
        }
    }
};
