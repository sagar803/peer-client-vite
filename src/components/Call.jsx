import React, { useState } from 'react';
import { Player } from './Player';

const Call = ({ remoteStream, myStream, connectedUser, handleEndCall }) => {
  const [isMinimized, setIsMinimized] =  useState(false)
  return (
    <div className="w-full flex flex-col justify-center items-center">
      <div className="w-full flex md:flex-row flex-col justify-center items-center py-12">
        {remoteStream && (
          <Player
            className="h-[400px]"
            stream={remoteStream}
            name={connectedUser.name}
            muted={false}
          />
        )}
        {myStream && (
          <Player
            className="h-[400px]"
            stream={myStream}
            name="My Stream"
            muted={true}
          />
        )}
      </div>
      <button
        onClick={handleEndCall}
        className="h-12 w-36 mt-4 text-xs font-medium uppercase tracking-widest bg-red-200 text-black rounded-full shadow-md hover:bg-red-500 hover:shadow-lg hover:text-white transform hover:-translate-y-2 transition-all ease-out duration-300"
      >
        Disconnect
      </button>
    </div>
  );
};

export default Call;
