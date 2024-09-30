import React from 'react';
import { PhoneCall } from 'react-feather';
import { Button } from '../components/ui/button';

import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';


export const OnlineUserList = ({ calling, onlineUsers, handleCallUser }) => {
  return (
    <Card className="w-56 p-4 m-4 rounded-lg shadow-lg border">
      <p className="text-lg font-semibold mb-2"> Online Users </p>
      <ScrollArea className="h-72 w-full rounded-md">
        {onlineUsers && onlineUsers.length > 0 ? (
          <div className="space-y-4">
            {onlineUsers.map((user) => (
              <Button
                disabled={calling && calling?.id !== user?.id}
                key={user.id}
                size="sm"
                variant={'outline'}
                className={`flex justify-between items-center h-10 w-full hover:bg-blue-400 duration-1000
                  ${calling?.id === user?.id ? 'animate-pulse bg-blue-500' : 'bg-blue-300'}`}
                onClick={() => handleCallUser(user)}
              >
                <span className="text-sm">{user.name}</span>
                <PhoneCall className="w-4 h-4" />
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No one is online</p>
        )}
      
      </ScrollArea>
    </Card>
  );
};
