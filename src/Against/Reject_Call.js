// ./src/Against/RejectCall.js
module.exports = {
    event: ['call'],
    desc: 'Reject Whatsapp Call Coming to Bot!',
    isEnabled: settings.REJECT_CALLS,
    async execute(sock, data) {
        const { from, id } = data;
        const delay = 2000; // 2 seconds delay

        setTimeout(async () => {
            await sock.rejectCall(id, from);
        }, delay);
    }
};