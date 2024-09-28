import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../providers/Socket';
import { useNavigate } from 'react-router-dom';
import SparklesText from '../components/ui/sparkles-text'
import Iphone15Pro from '../components/ui/iphone-15-pro'
import { BorderBeam } from "../components/ui/border-beam";
import  ShimmerButton  from "../components/ui/shimmer-button";

export const Home = () => {
  const navigate = useNavigate();
  const { socket, setUser } = useSocket();
  const [name, setName] = useState('')
  const [error, setError] = useState({});
  const inputRef = useRef();
  const [loading, setLoading] = useState();

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleNameBlur = () => {
    const nameValidation = name.trim() !== '';
    setError((prevErrors) => ({ ...prevErrors, name: nameValidation ? '' : 'Name is required.' }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (error.name === '') {
      setLoading(true);
      socket.emit('login', { name });
    }
    // setLoading(false);
  };

  const handleRoomJoined = (data) => {
    setUser(data);
    setLoading(false);
    // localStorage.setItem('name', data.name);
    navigate("/room");
  };

  useEffect(() => {
    socket.on('self', handleRoomJoined);
    // return () => {
    //   socket.off('self', handleRoomJoined);
    // };
  }, [socket]);



  return (
      <div className="flex flex-row items-center justify-center w-full h-full gap-10">
        <div className='flex flex-col'>
          <SparklesText text="Video calls using" />
          <SparklesText sparklesCount={10} className='text-[120px]' text="WebRTC" />
        </div>
        <div className="relative h-[600px] w-[300px]">
          <Iphone15Pro className="size-full" />
          <BorderBeam className='mx-1 rounded-[50px]' duration={12} borderWidth={15} delay={9} />
          <div className='absolute inset-0 p-8 flex flex-col justify-center m-auto size-full text-sm font-medium'>
            <form className="flex flex-col m-auto w-full text-gray-600">
              <input
                ref={inputRef}
                className={`h-10 p-4 mb-2 rounded-xl bg-white transition-all border outline-none ${error.name ? 'border-red-500 placeholder:text-red-500' : ''}`}
                type="text"
                value={name}
                placeholder={error.name ? error.name : "Enter your name"}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
              />
              <ShimmerButton className="shadow-2xl" borderRadius='12px' shimmerSize = "0.05em" onClick={handleLogin}>
                <span className="text-center text-white">
                  {loading ? 'Connecting...' : "Connect"}
                </span>
              </ShimmerButton>
            </form>
          </div>
        </div>
      </div>
  );
};