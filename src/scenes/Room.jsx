import React, { useCallback, useEffect, useRef, useState } from 'react'
import useSocket from '../providers/Socket'
// import usePeer from '../providers/Peer';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { OnlineUserList } from '../components/OnlineUserList';
import { Player } from '../components/Player';
import { User } from 'react-feather';
import { CounterClockwiseClockIcon } from '@radix-ui/react-icons';
// import audio from '../asset/ringtone.mp3'

class WebRTCConnection {
  constructor() {
    this.peer = this.initializePeerConnection();
  }

  initializePeerConnection() {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    // Listen for ICE candidates
    // peer.onicecandidate = (event) => {
    //   if (event.candidate) {
    //     console.log("New ICE candidate:", event.candidate);
    //     // Send the ICE candidate to the remote peer
    //   }
    // };

    // Listen for remote tracks added to the connection
    peer.ontrack = (event) => {
      console.log("Received remote stream:", event.streams[0]);
      if (this.onRemoteStream) {
        // Call the callback function to handle the remote stream
        this.onRemoteStream(event.streams[0]);
      }
    };

    return peer;
  }

  async createOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer) {
    await this.peer.setRemoteDescription(offer);
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  addLocalStream(localStream) {
    localStream.getTracks().forEach((track) => {
      this.peer.addTrack(track, localStream);
    });
  }

  setRemoteDescription(description) {
    this.peer.setRemoteDescription(description);
  }

  closeConnection() {
    this.peer.close();
  }

  onRemoteStream(callback) {
    this.onRemoteStream = callback;
  }
}

export const Room = () => {

  const navigate = useNavigate();
  const { socket, onlineUsers, user } = useSocket();
  useEffect(() => {
    if(!user) navigate('/');
  }, [])

  // useEffect(() => {
  //   if(!(localStorage.getItem('name') && socket)) navigate('/');
  // }, [])

  const webRTCConnectionRef = useRef(null);

  const [remoteStream, setRemoteStream] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectedUser, setConnectedUser] = useState({});
  const [calling, setCalling] = useState(false);

  const initializeConnection = (async () => {
    webRTCConnectionRef.current = new WebRTCConnection();
    console.log(webRTCConnectionRef.current)
    webRTCConnectionRef.current.onRemoteStream((stream) => {
      console.log("Handling received remote stream");
      setRemoteStream(stream);
    });

    const setupMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setMyStream(stream)
        webRTCConnectionRef.current.addLocalStream(stream);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    await setupMediaStream();
  })

  const handleCallUser = useCallback(async (user) => {
    endConnection()
    await initializeConnection();

    if (!webRTCConnectionRef.current) {
      console.error("WebRTC connection is not initialized yet.");
      return;
    }
    setCalling(user.id);
    await webRTCConnectionRef.current.createOffer();
    await new Promise(resolve => setTimeout(resolve, 1000));
    socket.emit('call_user', { to: user.id, offer: webRTCConnectionRef.current.peer.localDescription });
  }, [socket, initializeConnection]);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    await initializeConnection();
    // const aud = new Audio(audio)
    // await aud.play();
    console.log('incomming call');
    toast(`Incomming Call`, { autoClose: 4000 });
    
    const userResponse = window.confirm("Accept Incomming Video Call");
    if(userResponse){
      const user = onlineUsers.find(user => user.id === from);
      setConnectedUser(user);
      setConnected(true);
      const ans = await webRTCConnectionRef.current.createAnswer(offer);
      socket.emit('call_accepted', { to: from, ans});
    }
    else {
      socket.emit('no_response', { to: from});
      // aud.pause()
      console.log("rejected")
    }
  }, [socket, initializeConnection]);

  const handleCallAccepted = async ({ from, ans }) => {
    await webRTCConnectionRef.current.peer.setRemoteDescription(ans);
    console.log('Call got accepted');
    setConnected(true)
    const user = onlineUsers.find(user => user.id === from);
    setConnectedUser(user);
  }

  const handleEndCall = () => {
    socket.emit('end_call', {to: connectedUser.id});
    endConnection();
  }

const endConnection = useCallback(() => {
  setConnected(false);
  setRemoteStream(null);

  if (myStream) {myStream.getTracks().forEach((track) => {
      track.stop();
      myStream.removeTrack(track);
    });
    setMyStream(null);
  }

  if (webRTCConnectionRef.current && webRTCConnectionRef.current.peer) {
    const pc = webRTCConnectionRef.current.peer;
    console.log(webRTCConnectionRef.current)

    // pc.getDataChannels().forEach(channel => channel.close());
    // pc.getSenders().forEach((sender) => pc.removeTrack(sender));
    pc.close();

    webRTCConnectionRef.current.peer = null;

    // Log the final states
    console.log('Final ICE Connection State:', pc.iceConnectionState);
    console.log('Final Connection State:', pc.connectionState);
    console.log('Final Signaling State:', pc.signalingState);

    // Force state changes if necessary
    if (pc.iceConnectionState !== 'closed') {
      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State forced to close');
      };
      pc.setConfiguration(pc.getConfiguration());
    }

    if (pc.signalingState !== 'closed') {
      pc.onsignalingstatechange = () => {
        console.log('Signaling State forced to close');
      };
      pc.setLocalDescription({type: 'rollback'}).catch(console.error);
    }
  }

  // Nullify the WebRTCConnection instance
  webRTCConnectionRef.current = null;

  // Reset connected user state
  setConnectedUser({});

  // Optional: Check and release media devices
  navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
        if (device.kind === 'videoinput' || device.kind === 'audioinput') {
          console.log(`Device ${device.label} status checked`);
        }
      });
    })
    .catch(err => console.error('Error enumerating devices:', err));

  console.log('Connection ended and all resources cleared');
}, [myStream]);

  const handleNoResponse = () => {
    setCalling(false);
  }

  useEffect(() => {
      socket.on('incomming_call', handleIncomingCall);
      socket.on('call_accepted', handleCallAccepted);
      socket.on('call_disconnected', endConnection);
      socket.on('no_response', handleNoResponse);

      return () => {
        socket.off('incomming_call', handleIncomingCall);
        socket.off('call_accepted', handleCallAccepted);        
        socket.off('call_disconnected', endConnection); 
        socket.off('no_response', handleNoResponse);
      }
    }, [socket, handleIncomingCall, handleCallAccepted, endConnection, handleNoResponse]);
  
  return (
      <div className="w-full min-h-screen">
        <nav className="w-full flex justify-between p-5 border-b border-gray-400 box-border">
          <span className="text-blue-500 text-2xl font-bold italic">Peer</span>
          <span className="flex items-center gap-2 p-2 border border-gray-400 rounded-lg text-gray-600 text-xl font-normal">
            <User />{user?.name}
          </span>
        </nav>
        <section className="w-full">
          {
            !connected ? (
              <>
                <div className="w-full min-h-[80vh] p-16 flex items-center justify-center gap-12 flex-row box-border">
                  <div className="flex-[0_0_70%] text-5xl">Seamless Connections, Anytime, Anywhere! 🚀</div>
                  <div className="flex-[0_0_30%]">
                    <OnlineUserList calling={calling} onlineUsers={onlineUsers} handleCallUser={handleCallUser} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-full flex flex-col justify-center items-center">
                  <div className="w-full flex justify-center items-center py-12">
                    {remoteStream && <Player stream={remoteStream} email={connectedUser.name} muted={false} />}
                    {myStream && <Player stream={myStream} email={"My Stream"} muted={true} />}
                  </div>
                  <button onClick={handleEndCall} className="h-12 w-36 mt-4 text-xs font-medium uppercase tracking-widest bg-red-200 text-black rounded-full shadow-md hover:bg-red-500 hover:shadow-lg hover:text-white transform hover:-translate-y-2 transition-all ease-out duration-300">
                    Disconnect
                  </button>
                </div>
              </>
            )
          }
        </section>
        <ToastContainer className="custom-toast-container" />
      </div>
  )
}
