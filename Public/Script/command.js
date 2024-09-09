// Command response functions
document.getElementById('checkCommandsBtn').addEventListener('click', function () {
    document.getElementById('commandResponse').classList.remove('hidden');
    document.getElementById('commandResponse').innerHTML = '<p>Checking commands... Please wait.</p>';
    // Simulate API call
    setTimeout(() => {
        document.getElementById('commandResponse').innerHTML = '<p>All commands are up to date!</p>';
    }, 2000);
});

document.getElementById('getResponseBtn').addEventListener('click', function () {
    document.getElementById('commandResponse').classList.remove('hidden');
    document.getElementById('commandResponse').innerHTML = '<p>Getting response... Please wait.</p>';
    // Simulate API call
    setTimeout(() => {
        document.getElementById('commandResponse').innerHTML = '<p>Response received: Bot is functioning normally.</p>';
    }, 2000);
});

document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/messagestotal'); // Sending a GET request to /stats
    const socket = io(); // Connect to the Socket.IO server
    const messageSentElement = document.getElementById('messageSent');

    if (response) {
        const ssd = await response.json()
        messageSentElement.textContent = ssd.messageTotal.toLocaleString(); // Format number with commas
    }

    // Example: Handle 'messageCount' event from server
    socket.on('messageCount', (count) => {
        console.log('Total messages sent:', count);
        messageSentElement.textContent = count.toLocaleString(); // Format number with commas
        
        // Apply animation
        messageSentElement.classList.add('animate');
        setTimeout(() => {
            messageSentElement.classList.remove('animate');
        }, 1000); // Duration of the animation in milliseconds
    });
});