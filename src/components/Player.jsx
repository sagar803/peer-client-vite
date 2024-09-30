import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { Volume2, VolumeX } from 'react-feather';

export const Player = (props) => {
  const { stream, name, muted, className } = props;
  const [mute, setMute] = useState(muted);

  const handleMute = () => {
    if (!muted) setMute(!mute);
  };

  return (
    <div className={`${className} relative m-5 bg-whitesmoke`}>
      <p className="absolute top-2 left-0 bg-white px-3 py-1 rounded-r-md font-semibold">
        {name}
      </p>
      <i
        className="absolute top-2 right-2 z-10 flex items-center justify-center w-12 h-12 bg-white text-black cursor-pointer rounded-full"
        onClick={handleMute}
      >
        {mute ? <VolumeX strokeWidth="1px" /> : <Volume2 strokeWidth="1px" />}
      </i>
      <ReactPlayer
        className="rounded-lg"
        width="100%"
        height="100%"
        playing
        muted={mute}
        url={stream}
      />
    </div>
  );
};
