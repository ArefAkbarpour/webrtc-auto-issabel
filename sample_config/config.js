const config = {
    socketUrl: "wss://your.domain.com:8089/ws",
    sipUri: "sip:1001@your.domain.com",
    sipPassword: "P@ss0wrd",
    targetUri: "sip:1000@your.domain.com",
    stunServer: "stun:stun.l.google.com:19302"
};
<script>
    // === Initialize JsSIP WebSocket and UA ===
    const socket = new JsSIP.WebSocketInterface('wss://webrtc.aaairan.net:8089/ws');
    const configuration = {
        sockets: [socket],
        uri: 'sip:1001@your.domain.net',
        password: 'yourpassword',
        trace_sip: false
    };
    const ua = new JsSIP.UA(configuration);
    ua.start();

    // === Global variables ===
    let currentSession = null;
    let lineBusy = false;
    let callQueue = [];

    const callButton = document.getElementById('webrtcCallButton');

    // === Helper: reset button state ===
    function resetButton() {
        currentSession = null;
        callButton.textContent = 'تماس مستقیم';
        callButton.classList.remove('hangup');
    }

    // === Handle different failure causes ===
    function handleFailure(e) {
        let reason = 'برقراری تماس با خطا مواجه شد.';
        if (e && e.cause) {
            switch (e.cause) {
                case 'Busy':
                    reason = 'خط مشغول است.';
                    break;
                case 'Rejected':
                    reason = 'تماس رد شد.';
                    break;
                case 'Unavailable':
                    reason = 'مخاطب در دسترس نیست.';
                    break;
                case 'Not Found':
                    reason = 'شماره یافت نشد.';
                    break;
                case 'Connection Error':
                    reason = 'خطا در اتصال به سرور.';
                    break;
                default:
                    reason = `خطا: ${e.cause}`;
            }
        }
        alert(reason);
    }

    // === Check queue and make next call if any ===
    function checkQueue() {
        if (callQueue.length > 0) {
            const nextTarget = callQueue.shift();
            setTimeout(() => makeCall(nextTarget), 2000); // wait 2s before retry
        }
    }

    // === Core call function ===
    function makeCall(targetUri) {
        // If line is busy → queue this call
        if (lineBusy) {
            alert('لطفاً منتظر بمانید تا خط آزاد شود...');
            callQueue.push(targetUri);
            return;
        }

        lineBusy = true;
        callButton.textContent = 'در حال اتصال...';
        callButton.classList.add('hangup');

        const options = {
            mediaConstraints: { audio: true, video: false },
            pcConfig: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            }
        };

        currentSession = ua.call(targetUri, options);

        // === Handle incoming audio track ===
        currentSession.connection.ontrack = (event) => {
            const remoteStream = new MediaStream();
            remoteStream.addTrack(event.track);
            const remoteAudio = new Audio();
            remoteAudio.srcObject = remoteStream;
            remoteAudio.play().catch(err => console.error('Audio play failed', err));
        };

        // === Session events ===
        currentSession.on('accepted', () => {
            callButton.textContent = 'پایان تماس';
        });

        currentSession.on('ended', () => {
            lineBusy = false;
            resetButton();
            checkQueue();
        });

        currentSession.on('failed', (e) => {
            lineBusy = false;
            handleFailure(e);
            resetButton();
            checkQueue();
        });
    }

    // === Button click event ===
    callButton.addEventListener('click', () => {
        const targetUri = 'sip:6101@webrtc.aaairan.net';
        if (!currentSession) {
            makeCall(targetUri);
        } else {
            currentSession.terminate();
            resetButton();
            lineBusy = false;
        }
    });
</script>
