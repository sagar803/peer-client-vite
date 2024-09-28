import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const socketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const backendURL = import.meta.env.VITE_APP_SERVER;
    const socket = useMemo(() => io(backendURL), [backendURL]);
    const [user, setUser] = useState(null); // Initialize as null
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        socket.on('login_successful', (data) => setUser(data));

        socket.on('online-users', ({ onlineUsers }) => {
            const updatedOnlineUser = onlineUsers.filter(
                ({ socketId }) => socketId !== socket.id
            );
            setOnlineUsers(updatedOnlineUser);
        });

        return () => {
            socket.off('login_successful');
            socket.off('online-users');
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
