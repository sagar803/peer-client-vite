import React from 'react';
import { PhoneCall } from 'react-feather';

export const OnlineUserList = ({ calling, onlineUsers, handleCallUser }) => {
  return (
    <div className="flex flex-col items-center w-48 p-4 bg-blue-100 border border-gray-300 m-4 rounded-3xl">
      <h3>Online Users</h3>
      <div className="flex flex-col">
        {onlineUsers && onlineUsers.length > 0 ? (
          onlineUsers.map((user) => (
            <button 
              onClick={() => handleCallUser(user)}
              key={user.id} 
              className={`
                  px-4 py-2 flex items-center justify-center gap-2 h-12 text-xs font-medium rounded-full shadow-md 
                  bg-green-400 hover:shadow-lg active:-translate-y-2 transition-transform duration-300 ease-out 
                  my-4 ${calling === user.id ? 'animate-shake' : ''}`} 
            >
              <div>
                <PhoneCall />
              </div>
              {user.name}
            </button>
          ))
        ) : (
          <p>No one is online</p>
        )}
      </div>
    </div>
  );
};
