import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const socketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const backendURL = import.meta.env.VITE_APP_SERVER;
    const socket = useMemo(() => io(backendURL), [backendURL]);
    const [user, setUser] = useState();
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        socket.on('online-users', ({ onlineUsers }) => {
            const updatedOnlineUser = onlineUsers.filter(({ id }) => id !== socket.id);
            setOnlineUsers(updatedOnlineUser);
            console.log(updatedOnlineUser)
        });
          
        // socket.on('refresh', (socketId) => {
        //     const name = localStorage.getItem('username');            
        //     if (name) setUser({name, socketId });        
        // });

        const handleUnload = () => socket.close();
        window.addEventListener("onunload", handleUnload);

        return () => {
            // socket.off('online-users');
            // window.removeEventListener("onunload", handleBeforeUnload);
        };
    }, [socket, user]);

    return (
        <socketContext.Provider value={{ socket, onlineUsers, user, setUser }}>
            {children}
        </socketContext.Provider>
    );
};

export default function useSocket() {
    return useContext(socketContext);
}
