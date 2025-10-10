document.addEventListener('DOMContentLoaded', () => {
    // === JsSIP Setup (UA defined here, initialized later) ===
    const username = '1001';
    const ha1Url = `/webrtc/ha1.php?user=${username}`;
    let ua = null; 

    // === State Variables ===
    let currentSession = null;
    let callStartTime = null;
    let callTimerInterval = null;
    let localMediaStream = null;

    // === DOM Elements ===
    const callButton = document.getElementById('webrtcCallButton');
    const callText = document.createElement('span');
    const callIcon = document.createElement('span');
    callIcon.classList.add('call-icon');
    callButton.innerHTML = '';
    callText.innerHTML = '&nbsp;در حال بارگذاری...';
    callButton.appendChild(callIcon);
    callButton.appendChild(callText);
    callIcon.innerHTML = '🔄';
    callButton.disabled = true;

    // === Audio Setup (BEEP AUDIO REMOVED) ===
    let audioCtx = null;
    let oscillators = [];
    let gainNode = null;
    let ringbackInterval = null;

    // --- Helper Functions ---
    
    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(e => console.error("AudioContext resume failed:", e));
    }

    function startRingbackTone() {
        initAudio(); 
        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.connect(audioCtx.destination);
        const freqs = [440, 480];
        oscillators = freqs.map(freq => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.connect(gainNode);
            return osc;
        });
        oscillators.forEach(osc => osc.start());
        function ringCycle() {
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
            setTimeout(() => gainNode.gain.setValueAtTime(0, audioCtx.currentTime), 2000); 
        }
        ringCycle();
        ringbackInterval = setInterval(ringCycle, 6000); 
    }

    function stopRingbackTone() {
        if (oscillators.length) {
            oscillators.forEach(osc => {
                try { osc.stop(); } catch (e) {}
                try { osc.disconnect(); } catch (e) {}
            });
            oscillators = [];
        }
        if (gainNode) {
            try { gainNode.disconnect(); } catch (e) {}
            gainNode = null;
        }
        if (ringbackInterval) {
            clearInterval(ringbackInterval);
            ringbackInterval = null;
        }
    }

    // === Reset Button and Call Cleanup ===
    function resetButton() {
        currentSession = null;
        callText.innerHTML = '&nbsp;تماس مستقیم';
        callButton.className = 'call-button';
        callIcon.innerHTML = '📞';
        clearInterval(callTimerInterval);
        
        // Clean up mic stream
        if (localMediaStream) {
            localMediaStream.getTracks().forEach(track => {try { track.stop(); } catch (e) {}});
            localMediaStream = null; 
        }

        stopRingbackTone();
    }
    
    // === Failure Handler (Remains the same) ===
    function handleFailure(e) {
        if (!currentSession || currentSession.userCancelled) return;
        let reason = 'برقراری تماس با خطا مواجه شد.';
        if (e && e.response && e.response.status_code) {
            const code = e.response.status_code;
            if (code === 486) reason = 'خط مشغول است.';
            else if (code === 603) reason = 'تماس رد شد.';
            else if (code === 480) reason = 'مخاطب در دسترس نیست.';
            else if (code === 404) reason = 'شماره یافت نشد.';
            else if (code >= 500) reason = 'خطا در سرور مقصد.';
        } else if (e && e.cause) {
            if (e.cause === 'Busy') reason = 'خط مشغول است.';
            else if (e.cause === 'Rejected') reason = 'تماس رد شد.';
            else if (e.cause === 'Unavailable') reason = 'مخاطب در دسترس نیست.';
            else if (e.cause === 'Connection Error') reason = 'خطا در اتصال به سرور.';
        }
        alert(reason);
    }

    // === Timer (Remains the same) ===
    function startCallTimer() {
        stopRingbackTone();

        callStartTime = Date.now();
        callTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const seconds = String(elapsed % 60).padStart(2, '0');
            callText.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    // === Make Call (Now checks for UA availability) ===
    async function makeCall(targetUri) {
        // CRITICAL CHECK: Ensure ua is ready
        if (!ua || !ua.isRegistered()) {
            console.error("JsSIP UA is not registered.");
            alert("سیستم تلفنی آماده نیست یا ثبت نام ناموفق بود.");
            resetButton(); 
            return;
        }

        callButton.classList.add('dialing');
        callIcon.innerHTML = '<span class="dialing-spinner"></span>';
        callText.textContent = 'در حال شماره‌گیری...';

        startRingbackTone(); // Use Web Audio tone instead of beep.wav

        // === 1. Force mic permission and attach ===
        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localMediaStream = stream;
        } catch (err) {
            alert('دسترسی به میکروفون داده نشد.');
            resetButton();
            return;
        }

        const options = {
            mediaConstraints: { audio: true, video: false },
            mediaStream: stream, 
            pcConfig: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
            },
            rtcOfferConstraints: { offerToReceiveAudio: 1 }
        };

        // === 2. Initiate Call ===
        currentSession = ua.call(targetUri, options);
        currentSession.userCancelled = false;

        // === 3. Handle incoming audio (FIXED) ===
        currentSession.connection.ontrack = (event) => {
            stopRingbackTone();
            
            const remoteStream = new MediaStream();
            remoteStream.addTrack(event.track); 
            
            const remoteAudio = new Audio();
            remoteAudio.srcObject = remoteStream;
            remoteAudio.autoplay = true;
            remoteAudio.playsInline = true;
            
            remoteAudio.play().catch(err => {
                 console.error('Remote audio playback blocked/failed:', err);
                 alert('پخش صدای مخاطب مسدود شد. لطفاً تنظیمات مرورگر خود را برای پخش خودکار رسانه بررسی کنید.');
            });

            if (typeof remoteAudio.setSinkId === 'function') {
                remoteAudio.setSinkId('default').catch(() => {});
            }
        };

        // === 4. Call Event Handlers (Remains the same) ===
        currentSession.on('accepted', () => {
            callButton.classList.remove('dialing');
            callButton.classList.add('hangup');
            callIcon.innerHTML = '🔴';
            startCallTimer();
        });

        currentSession.on('ended', () => resetButton());
        currentSession.on('failed', (e) => { handleFailure(e); resetButton(); });
    }
    
    // =======================================================
    // === ASYNC INITIALIZATION FLOW (The Scope Fix) ===
    // =======================================================
    fetch(ha1Url)
        .then(response => response.json())
        .then(data => {
            if (!data.ha1) {
                throw new Error('Invalid HA1 response');
            }

            const socket = new JsSIP.WebSocketInterface('wss://your.domain.com:8089/ws');
            const configuration = {
                sockets: [socket],
                uri: `sip:${data.username}@${data.realm}`,
                ha1: data.ha1,
                realm: data.realm,
                trace_sip: false
            };

            // 1. Initialize the OUTER 'ua' variable
            ua = new JsSIP.UA(configuration);
            ua.start();
            
            // Re-enable button immediately after UA is created
            callButton.disabled = false;
            callText.innerHTML = '&nbsp;تماس مستقیم';
            callIcon.innerHTML = '📞';
            
            ua.on('registrationFailed', (e) => {
                 console.error('JsSIP Registration Failed:', e);
                 callText.innerHTML = '&nbsp;خطای ثبت نام SIP';
                 callIcon.innerHTML = '❌';
                 callButton.disabled = true; // Disable button on failure
                 alert(`ثبت نام SIP ناموفق بود: ${e.cause}`);
            });
            
            // 2. Attach the click listener *after* 'ua' is initialized
            callButton.addEventListener('click', () => {
                const targetUri = 'sip:1111@your.domain.com';
                if (!currentSession) {
                    makeCall(targetUri);
                } else {
                    if (currentSession.isInProgress()) currentSession.userCancelled = true;
                    currentSession.terminate();
                    resetButton();
                }
            });
            
        })
        .catch(err => {
            console.error('Failed to fetch HA1 or initialize JsSIP:', err);
            callText.innerHTML = '&nbsp;خطای راه‌اندازی';
            callIcon.innerHTML = '⚠️';
            callButton.disabled = true;
        });
});
