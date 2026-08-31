'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import * as THREE from 'three';

interface VoiceChatProps {
  socket: Socket | null;
  roomId: string;
  isMicOn: boolean;
  isDeafened: boolean;
  myPosition: { x: number; y: number; z: number };
  remotePositions: Record<string, { x: number; y: number; z: number }>;
  onTalkingChange: (userId: string, isTalking: boolean) => void;
  initialPlayers: any[];
  myUserId: string;
}

export default function VoiceChat({
  socket,
  roomId,
  isMicOn,
  isDeafened,
  myPosition,
  remotePositions,
  onTalkingChange,
  initialPlayers,
  myUserId
}: VoiceChatProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const localStream = useRef<MediaStream | null>(null);
  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const audioContext = useRef<AudioContext | null>(null);
  const audioElements = useRef<Record<string, HTMLAudioElement>>({});
  const panners = useRef<Record<string, PannerNode>>({});
  const gainNodes = useRef<Record<string, GainNode>>({});
  const filters = useRef<Record<string, BiquadFilterNode>>({});
  const analyser = useRef<AnalyserNode | null>(null);
  const rafId = useRef<number | null>(null);

  const onTalkingChangeRef = useRef(onTalkingChange);
  const socketRef = useRef(socket);
  const initialPlayersRef = useRef(initialPlayers);
  const myUserIdRef = useRef(myUserId);
  const isDeafenedRef = useRef(isDeafened);

  useEffect(() => {
    onTalkingChangeRef.current = onTalkingChange;
    socketRef.current = socket;
    initialPlayersRef.current = initialPlayers;
    myUserIdRef.current = myUserId;
    isDeafenedRef.current = isDeafened;
  }, [onTalkingChange, socket, initialPlayers, myUserId, isDeafened]);

  useEffect(() => {
    const currentPeers = peers.current;
    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStream.current = stream;
        setHasPermission(true);

        const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.current = actx;
        const source = actx.createMediaStreamSource(stream);
        const anlyz = actx.createAnalyser();
        anlyz.fftSize = 256;
        source.connect(anlyz);
        analyser.current = anlyz;

        const checkTalking = () => {
          if (!analyser.current) return;
          const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
          analyser.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;
          const talking = average > 10;
          onTalkingChangeRef.current('me', talking);
          if (socketRef.current) socketRef.current.emit('talking_state', { talking });
          rafId.current = requestAnimationFrame(checkTalking);
        };
        checkTalking();
      } catch (err) {
        console.warn('Microphone permission denied:', err);
      }
    };
    initMic();
    return () => {
      if (localStream.current) localStream.current.getTracks().forEach(t => t.stop());
      if (audioContext.current) audioContext.current.close();
      if (rafId.current) cancelAnimationFrame(rafId.current);
      Object.values(currentPeers).forEach(p => p.close());
    };
  }, []);

  useEffect(() => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => track.enabled = isMicOn);
    }
  }, [isMicOn]);

  useEffect(() => {
    if (!isDeafened && audioContext.current?.state === 'suspended') {
      audioContext.current.resume();
    }
    Object.values(gainNodes.current).forEach(gain => {
      if (audioContext.current) gain.gain.setTargetAtTime(isDeafened ? 0 : 1, audioContext.current.currentTime, 0.1);
    });
  }, [isDeafened]);

  useEffect(() => {
    if (!socket || !hasPermission) return;

    initialPlayersRef.current.forEach(p => {
      if (p.userId !== myUserIdRef.current) {
        createPeer(p.socketId || p.userId, true);
      }
    });

    const createPeer = (peerId: string, initiator: boolean) => {
      if (peers.current[peerId]) return peers.current[peerId];
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peers.current[peerId] = pc;

      if (localStream.current) {
        localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current!));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('webrtc_signal', { target: peerId, type: 'candidate', candidate: e.candidate });
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!audioContext.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioContext.current = new AudioContextClass();
          }
        }
        if (audioContext.current?.state === 'suspended') {
          audioContext.current.resume();
        }
        if (!audioContext.current) return;
        const actx = audioContext.current;
        
        const source = actx.createMediaStreamSource(stream);
        const gain = actx.createGain();
        gain.gain.value = isDeafenedRef.current ? 0 : 1;
        
        const filter = actx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 20000;
        
        const panner = actx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 25;
        panner.rolloffFactor = 2;

        source.connect(gain);
        gain.connect(filter);
        filter.connect(panner);
        panner.connect(actx.destination);

        panners.current[peerId] = panner;
        gainNodes.current[peerId] = gain;
        filters.current[peerId] = filter;

        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.muted = true;
        audioElements.current[peerId] = audio;
      };

      if (initiator) {
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
          socket.emit('webrtc_signal', { target: peerId, type: 'offer', offer });
        });
      }
      return pc;
    };

    socket.on('world:player_joined', (p) => createPeer(p.socketId || p.userId, true));
    socket.on('webrtc_signal', async ({ sender, type, offer, answer, candidate }) => {
      let pc = peers.current[sender];
      if (!pc && type === 'offer') pc = createPeer(sender, false);
      if (!pc) return;
      try {
        if (type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          socket.emit('webrtc_signal', { target: sender, type: 'answer', answer: ans });
        } else if (type === 'answer') await pc.setRemoteDescription(new RTCSessionDescription(answer));
        else if (type === 'candidate') await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) { console.error('RTC Error:', err); }
    });

    socket.on('world:player_left', ({ socketId, userId }) => {
      const id = socketId || userId;
      if (peers.current[id]) {
        peers.current[id].close();
        delete peers.current[id];
        delete panners.current[id];
        delete gainNodes.current[id];
        delete filters.current[id];
        delete audioElements.current[id];
      }
    });

    return () => {
      socket.off('world:player_joined');
      socket.off('webrtc_signal');
      socket.off('world:player_left');
    };
  }, [socket, hasPermission]);

  useEffect(() => {
    if (!audioContext.current) return;
    const actx = audioContext.current;

    if (actx.listener && actx.listener.positionX) {
      actx.listener.positionX.setTargetAtTime(myPosition.x, actx.currentTime, 0.05);
      actx.listener.positionY.setTargetAtTime(myPosition.y, actx.currentTime, 0.05);
      actx.listener.positionZ.setTargetAtTime(myPosition.z, actx.currentTime, 0.05);
      
      if (actx.listener.forwardX) {
        actx.listener.forwardX.setTargetAtTime(0, actx.currentTime, 0.05);
        actx.listener.forwardY.setTargetAtTime(0, actx.currentTime, 0.05);
        actx.listener.forwardZ.setTargetAtTime(-1, actx.currentTime, 0.05);
      }
    }

    Object.keys(remotePositions).forEach(uId => {
      const pos = remotePositions[uId];
      const panner = panners.current[uId];
      const filter = filters.current[uId];
      if (panner && pos) {
        panner.positionX.setTargetAtTime(pos.x, actx.currentTime, 0.05);
        panner.positionY.setTargetAtTime(pos.y, actx.currentTime, 0.05);
        panner.positionZ.setTargetAtTime(pos.z, actx.currentTime, 0.05);



        const dist = Math.sqrt(Math.pow(pos.x - myPosition.x, 2) + Math.pow(pos.z - myPosition.z, 2));
        if (filter) {
           const targetFreq = dist > 15 ? 1000 : 20000;
           filter.frequency.setTargetAtTime(targetFreq, actx.currentTime, 0.5);
        }
      }
    });
  }, [myPosition, remotePositions]);

  return null;
}
