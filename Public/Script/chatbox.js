document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const toggleChatButton = document.getElementById('toggle-chat');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendMessageButton = document.getElementById('send-message');
    const connectionStatus = document.getElementById('connection-status');
    const typingIndicator = document.getElementById('typing-indicator');
    const onlineUsers = document.querySelector('.online-users');
    const darkModeToggle = document.createElement('button');

    let typingTimeout;
    let ws;
    let nameUser;
    let color;

    const colors = [
        'red',
        'orange',
        'yellow',
        'green',
        'teal',
        'blue',
        'indigo',
        'purple',
        'pink',
    ];

    // Generate a random index based on the length of the colors array
    const randomIndex = Math.floor(Math.random() * colors.length);

    // Get the random color from the colors array using the random index
    const randomColor = colors[randomIndex];

    color = randomColor;

    fetch('/ownername')
        .then(response => response.text())
        .then(data => {
            nameUser = data;
        })
        .catch(error => {
            console.error('Error fetching owner name:', error);
        });


    darkModeToggle.classList.add('dark-mode-toggle');
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(darkModeToggle);

    // Dark mode toggle
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        darkModeToggle.innerHTML = document.body.classList.contains('dark-mode')
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    });

    // Toggle chat box
    toggleChatButton.addEventListener('click', () => {
        chatBox.classList.toggle('collapsed');
        toggleChatButton.querySelector('i').classList.toggle('fa-chevron-down');
        toggleChatButton.querySelector('i').classList.toggle('fa-chevron-up');
    });

    // Update connection status
    const updateConnectionStatus = (status) => {
        connectionStatus.style.backgroundColor = status ? '#4ade80' : '#f87171';
        connectionStatus.setAttribute('aria-label', status ? 'Online' : 'Offline');
    };

    // Show typing with his name
    const showTypingIndicator = (typer) => {
        typingIndicator.style.display = 'flex';
        const typerElement = typingIndicator.querySelector('.name');
        typerElement.textContent = `${typer} is typing. `;
    };


    // Hide typing indicator
    const hideTypingIndicator = () => {
        typingIndicator.style.display = 'none';
    };


    // Add a new message
    const addMessageText = (message, user) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${user === nameUser ? 'user' : 'other'}`;

        messageElement.innerHTML = `
        ${!user === nameUser ? '<div><img src="https://picsum.photos/32/32" alt="User Avatar"></div>' : ''}
        <div class="text">
            <div class="nameUser text-${color}-400"><b>${user === nameUser ? 'You' : message.name}</b></div>
            <span class="text-gray-900" id="text-mess">${message.content}</span>
        </div>
        <div class="time">${new Date(message.timestamp).toLocaleTimeString()}</div>
    `;

        const chatMessages = document.getElementById('chat-messages'); // Assuming chatMessages is the ID of the messages container
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addMessageImage = (message, user) => {
        const base64 = message.imageData;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${user === nameUser ? 'user' : 'other'}`;
    
        messageElement.innerHTML = `
            <div class="image-message">
                <img src="data:image/jpeg;base64, ${base64}" alt="Image" class="message-img">
                <div class="caption">
                    <div class="sender">${user === nameUser ? 'You' : message.name}</div>
                    <div class="text-gray-900">${message.caption}</div>
                </div>
                <a href="data:image/jpeg;base64, ${base64}" download class="download-icon"><i class="fas fa-download"></i></a>
            </div>
            <div class="time">${new Date(message.timestamp).toLocaleTimeString()}</div>
        `;
    
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    



    // Send a message
    const sendMessage = () => {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        const message = {
            type: 'message',
            content: messageText,
            name: nameUser, // Replace with actual username
        };

        ws.send(JSON.stringify(message));
        messageInput.value = '';
    };


    // Function to send an image message
    const sendImageMessage = async (base64String) => {
        const message = {
            type: 'image',
            name: nameUser, // Replace with actual username
            imageData: base64String,
        };

        ws.send(JSON.stringify(message));
    };

    // Handle typing event
    const handleTyping = () => {
        clearTimeout(typingTimeout);
        ws.send(JSON.stringify({ type: 'typing', name: nameUser, typing: true }));

        typingTimeout = setTimeout(() => {
            ws.send(JSON.stringify({ type: 'typing', name: nameUser, typing: false }));
        }, 3000);
    };

    // Initialize WebSocket connection
    const initWebSocket = () => {
        ws = new WebSocket('wss://web-socket-djtj.onrender.com'); // Adjust the URL to match your server

        ws.onopen = () => {
            console.log('Connected to the WebSocket server');
            updateConnectionStatus(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'userCount':
                    onlineUsers.textContent = `${data.count} Online`;
                    break;
                case 'message':
                    addMessageText(data, data.name);
                    break;
                case 'typing':
                    if (data.typing) {
                        showTypingIndicator(data.name);
                    } else {
                        hideTypingIndicator();
                    }
                    break;
                case 'image':
                    console.log(data);
                    addMessageImage(data, data.name)
                    break;
                case 'userList':
                    // Update user list if needed
                    break;
                case 'presence':
                    // Handle user presence updates if needed
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from the WebSocket server');
            updateConnectionStatus(false);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    };

    initWebSocket();

    sendMessageButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        } else {
            handleTyping();
        }
    });

    // Handle tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            // Here you can add logic to switch chat content based on the selected tab
        });
    });

    // Handle footer button clicks
    const footerButtons = document.querySelectorAll('.footer-btn');
    footerButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Add functionality for footer buttons (settings, volume, help, logout)
            console.log(`Clicked ${button.querySelector('i').className}`);
        });
    });

    // Handle action button clicks
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const iconClass = button.querySelector('i').className;

            if (iconClass.includes('fa-image')) {
                // User clicked on the image icon
                try {
                    const file = await selectImageFile(); // Function to select image file
                    if (file) {
                        const base64String = await convertImageToBase64(file); // Function to convert image to base64
                        console.log('Base64 image:', base64String);
                        sendImageMessage(base64String); // Send image message
                    }
                } catch (error) {
                    console.error('Error selecting or converting image:', error);
                }
            } else {
                console.log(`Clicked ${iconClass}`);
            }
        });
    });
});


function selectImageFile() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*'; // Accept only image files
        input.maxlength = 10 * 1024 * 1024; // Set maximum file size to 10MB (in bytes)
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                resolve(file);
            } else {
                reject(new Error('No file selected'));
            }
        };
        
        input.click(); // Trigger file selection dialog
    });
}


// Function to convert an image file to base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result.split(',')[1]); // Extract base64 string without data URL prefix
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}