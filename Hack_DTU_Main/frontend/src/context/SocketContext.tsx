import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // We need user ID to join the private room
    // I will try to read from localStorage if AuthContext is not easily accessible here without circular deps
    // Or just fetch it. For now, let's assume we connect on mount and join when we have ID.

    useEffect(() => {
        // Initialize Socket
        // @ts-ignore
        const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

        socketInstance.on('connect', () => {
            console.log('Socket Connected:', socketInstance.id);
            setIsConnected(true);

            // Try to join room if user is logged in
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                socketInstance.emit('join_room', user._id || user.id);
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket Disconnected');
            setIsConnected(false);
        });

        // Global Listeners for Notifications
        socketInstance.on('new_application', (data: any) => {
            console.log("New Application:", data);
            toast.info(`New Application for ${data.jobTitle}`, {
                description: `${data.applicantName} just applied!`
            });
        });

        socketInstance.on('application_status_updated', (data: any) => {
            console.log("Status Update:", data);
            toast.success(`Application Status Update`, {
                description: `Your application for ${data.jobTitle} is now ${data.status}`
            });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Listen for storage changes (login/logout) to rejoin room?
    // Doing it simple for now: On login, the page refreshes or we can expose a join method.
    // Ideally, AuthProvider should trigger this. 
    // But reading from localStorage on connect covers the Refresh case.

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
