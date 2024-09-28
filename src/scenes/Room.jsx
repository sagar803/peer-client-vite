import React, { useCallback, useEffect, useRef, useState } from 'react'
import useSocket from '../providers/Socket'
import usePeer from '../providers/Peer';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Room.module.css'
import { OnlineUserList } from '../components/OnlineUserList';
import { Player } from '../components/Player';
import { User } from 'react-feather';
// import audio from '../asset/ringtone.mp3'

export const Room = () => {
  
  const navigate = useNavigate();
  const { socket, onlineUsers, user } = useSocket();
  useEffect(() => {
    if(!user) navigate('/');
  }, [])

  const { peer, createOffer , createAnswer, closeConnection} = usePeer();
  const [remoteStream, setRemoteStream] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectedUser, setConnectedUser] = useState({});
  const [calling, setCalling] = useState(false);

  const setupMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setMyStream(stream)
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  useEffect(() => {
    setupMediaStream();
    peer.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream)
    }; 
  }, []);
  
  const handleCallUser = useCallback(async (user) => {

    const remoteSocketId = user.socketId;
    setCalling(user.socketId);
/*
    const sendChannel = peer.createDataChannel('channel');
    peer.channel = sendChannel;
    sendChannel.onopen = () => alert('Connected');
    sendChannel.onclose = () => alert('Disconnected');
*/
    await createOffer();
    /*
      A pause of 1 second is taken because the icecandidates are changing again and again, and to let it settle 1 second pause is taken
      peer.onicecandidate = (e) => setOffer(JSON.stringify(peer.localDescription));
      
      peer.onicecandidate = (event) => {
        if(peer.setRemoteDescription){
          if(event.candidate) {
            socket.emit('ice-candidate', { to : remoteSocketId , candidate: event.candidate})
          }
        }
      }
    */
    await new Promise(resolve => setTimeout(resolve, 1000));
      /*
      In the context of the await keyword, it does pause the execution of the function in which it is used. 
      However, it doesn't block the entire JavaScript runtime or prevent other parts of your application from running. 
      The rest of your application, outside the scope of the handleCallUser function, can continue executing while this function is waiting.
      */
    socket.emit('call_user', { to: remoteSocketId, offer: peer.localDescription });
  }, [socket]);

  const handleIncomingCall = useCallback(async ({ from, offer, userData }) => {
    // const aud = new Audio(audio)
    // await aud.play();
    console.log('incomming call');
    toast(`Incomming Call from ${userData.name}`, { autoClose: 4000 });
    
    const userResponse = window.confirm("Accept Incomming Video Call");
    if(userResponse){
      setConnectedUser({socketId: from , userData});
      setConnected(true);
      /*
      peer.ondatachannel = (e) => {
        const receiveChannel = e.channel;
        receiveChannel.onopen = () => alert('Connected');
        receiveChannel.onclose = () => alert('Disconnected');
        peer.channel = receiveChannel;
      };
      */
      const ans = await createAnswer(offer);
      socket.emit('call_accepted', { to: from, ans , user});
    }
    else {
      socket.emit('no_response', { to: from, user});
      // aud.pause()
      console.log("rejected")
    }
  }, [socket]);

  const handleCallAccepted = async ({ from, ans }) => {
    await peer.setRemoteDescription(ans);
    console.log('Call got accepted');
    setConnected(true)
    setConnectedUser({socketId: from , user});
  }

  const handleEndCall = () => {
    socket.emit('end_call', {to: connectedUser.socketId});
    setConnected(false);
    setConnectedUser({});
    peer.getSenders()?.forEach(sender => peer.removeTrack(sender))
    closeConnection();
    navigate('/')
    navigate(0);
  }

  const handelDisconnection = () => {
    setConnected(false);
    setConnectedUser({});
    peer.getSenders()?.forEach(sender => peer.removeTrack(sender))
    closeConnection();
    navigate('/')
    navigate(0);
  }
  const handleNoResponse = () => {
    setCalling(false);
  }
    /*
    const handleIceCandidate = ({from , candidate}) => {
      console.log(candidate)
      if(peer.remoteDescription){
        if(candidate){
          peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    }
    */
  useEffect(() => {
      socket.on('incomming_call', handleIncomingCall);
      socket.on('call_accepted', handleCallAccepted);
      socket.on('call_disconnected', handelDisconnection);
      socket.on('no_response', handleNoResponse);
      //        socket.on('ice-candidate', handleIceCandidate);

      return () => {
        socket.off('incomming_call', handleIncomingCall);
        socket.off('call_accepted', handleCallAccepted);        
        socket.off('call_disconnected', handelDisconnection); 
        socket.off('no_response', handleNoResponse);
        //          socket.off('ice-candidate', handleIceCandidate);
      }
    }, [socket, handleIncomingCall,  handleCallAccepted])
  
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
                    {remoteStream && <Player stream={remoteStream} email={connectedUser?.user?.name} muted={false} />}
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
