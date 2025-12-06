let socket;

try {
    socket = io();

    socket.on('connect', () => {
        console.log('Socket connected!', socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        // Optional: Show error to user if connection persists in failing
    });
} catch (error) {
    console.error("Socket.io failed to initialize:", error);
    alert("Erreur de chargement du système de connexion. Vérifiez votre connexion internet et rafraîchissez la page.");
}

// DOM Elements
const loginModal = document.getElementById('login-modal');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const mainInterface = document.getElementById('main-interface');
const localVideo = document.getElementById('local-video');
const videoGrid = document.getElementById('video-grid');
const chatMessages = document.getElementById('chat-messages');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const toggleCameraBtn = document.getElementById('toggle-camera');
const toggleMicBtn = document.getElementById('toggle-mic');
const copyLinkBtn = document.getElementById('copy-link');

// State
let localStream;
let username;
let peers = {}; // Object to store peer connections: { socketId: RTCPeerConnection }
const roomId = 'main-room'; // Single room for everyone

// WebRTC Configuration
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

// --- Event Listeners ---

function handleLogin() {
    username = usernameInput.value.trim();
    if (username) {
        joinBtn.textContent = "Connexion...";
        joinBtn.disabled = true;

        loginModal.style.display = 'none';
        mainInterface.classList.remove('hidden');
        startCall();
    }
}

joinBtn.addEventListener('click', handleLogin);

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

toggleCameraBtn.addEventListener('click', () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        toggleCameraBtn.textContent = videoTrack.enabled ? '📷 Caméra ON' : '📷 Caméra OFF';
        toggleCameraBtn.classList.toggle('active', videoTrack.enabled);
        toggleCameraBtn.classList.toggle('inactive', !videoTrack.enabled);
    }
});

toggleMicBtn.addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        toggleMicBtn.textContent = audioTrack.enabled ? '🎤 Micro ON' : '🎤 Micro OFF';
        toggleMicBtn.classList.toggle('active', audioTrack.enabled);
        toggleMicBtn.classList.toggle('inactive', !audioTrack.enabled);
    }
});

copyLinkBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = "Copié !";
        setTimeout(() => {
            copyLinkBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Lien: ' + window.location.href);
    }
});

// --- Functions ---

async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        // Mute local video to prevent echo for self
        localVideo.muted = true;

        // Connect to socket logic
        socket.emit('join_room', { username, roomId });

    } catch (err) {
        console.error('Error accessing media devices:', err);
        alert('Impossible d\'accéder à la caméra/micro. Vérifiez vos permissions.');
    }
}

function sendMessage() {
    const text = msgInput.value.trim();
    if (text) {
        socket.emit('send_message', { username, text, roomId });
        msgInput.value = '';
    }
}

function addMessageToChat(data) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');

    // Create elements safely to prevent XSS
    const metaDiv = document.createElement('div');
    metaDiv.className = 'meta';

    const strongName = document.createElement('strong');
    strongName.textContent = data.username;

    const timeSpan = document.createTextNode(` - ${data.time}`);

    metaDiv.appendChild(strongName);
    metaDiv.appendChild(timeSpan);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.textContent = data.text;

    msgDiv.appendChild(metaDiv);
    msgDiv.appendChild(contentDiv);

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Socket.io Events ---

socket.on('chat_history', (history) => {
    history.forEach(addMessageToChat);
});

socket.on('receive_message', (data) => {
    addMessageToChat(data);
});

socket.on('user_connected', async (data) => {
    console.log('User connected:', data.username);
    // Initiator creates the offer
    createPeerConnection(data.socketId, data.username, true);
});

socket.on('user_disconnected', (data) => {
    console.log('User disconnected:', data.socketId);
    if (peers[data.socketId]) {
        peers[data.socketId].pc.close();

        // Remove video element
        const videoWrapper = document.getElementById(`wrapper-${data.socketId}`);
        if (videoWrapper) videoWrapper.remove();

        delete peers[data.socketId];
    }
});

socket.on('signal', async (data) => {
    const { from, signal } = data;

    // If peer connection doesn't exist (receiver side), create it
    if (!peers[from]) {
        await createPeerConnection(from, "Utilisateur", false);
    }

    const peer = peers[from];
    const pc = peer.pc;

    try {
        if (signal.type === 'offer') {
            // Avoid collision: if we are also offering, we might need to handle glare
            // For simple mesh, the latest joiner usually initiates.
            if (pc.signalingState !== "stable") {
                // If we are already negotiating, we might ignore or rollback (simplified here)
                // In simple strict initiator logic, this shouldn't happen often if logic is sound.
                await Promise.all([
                    pc.setLocalDescription({type: "rollback"}),
                    pc.setRemoteDescription(new RTCSessionDescription(signal))
                ]);
            } else {
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', { to: from, signal: answer });

            // Process queued candidates
            while (peer.iceQueue.length > 0) {
                const candidate = peer.iceQueue.shift();
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

        } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));

            // Process queued candidates
            while (peer.iceQueue.length > 0) {
                const candidate = peer.iceQueue.shift();
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

        } else if (signal.type === 'candidate') {
            if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } else {
                // Queue candidate if remote description is not set yet
                peer.iceQueue.push(signal.candidate);
            }
        }
    } catch (err) {
        console.error('Error handling signal:', err);
    }
});

// --- WebRTC Logic ---

async function createPeerConnection(socketId, remoteUsername, isInitiator) {
    const pc = new RTCPeerConnection(rtcConfig);

    // Queue for ICE candidates that arrive before remote description
    const iceQueue = [];

    // Store peer info
    peers[socketId] = { pc, username: remoteUsername, iceQueue, isNegotiating: false };

    // Add local tracks to the connection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // Handle incoming tracks
    pc.ontrack = (event) => {
        const stream = event.streams[0];

        if (!document.getElementById(`video-${socketId}`)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            wrapper.id = `wrapper-${socketId}`;

            const video = document.createElement('video');
            video.id = `video-${socketId}`;
            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = stream;

            const label = document.createElement('span');
            label.className = 'video-label';
            label.textContent = remoteUsername || "Utilisateur";

            wrapper.appendChild(video);
            wrapper.appendChild(label);
            videoGrid.appendChild(wrapper);
        }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', {
                to: socketId,
                signal: { type: 'candidate', candidate: event.candidate }
            });
        }
    };

    // Create offer if initiator
    if (isInitiator) {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('signal', {
                to: socketId,
                signal: offer
            });
        } catch (err) {
            console.error('Error creating offer:', err);
        }
    }
}
