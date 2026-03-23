import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { authService, messageService, notificationService } from '../services/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadNotiCount, setUnreadNotiCount] = useState(0);

    
    const { user } = useAuth();
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        const fetchUnread = async () => {
            if (user) {
                try {
                    const { count } = await messageService.getUnreadCount();
                    setUnreadCount(count);
                } catch (error) {
                    console.error('Error fetching initial unread count:', error);
                }
            }
        };
        const fetchUnreadNoti = async () => {
            if (user) {
                try {
                    const data = await notificationService.getAll();
                    const unread = data.filter(n => !n.isRead).length;
                    setUnreadNotiCount(unread);
                } catch (error) {
                    console.error('Error fetching initial unread notification count:', error);
                }
            }
        };
        fetchUnread();
        fetchUnreadNoti();
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket);

            newSocket.on('connect', () => {
                setIsConnected(true);
                newSocket.emit('setup', user);
            });

            newSocket.on('online-users', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
            });

            newSocket.on('message-received', (message) => {
                // If the user is not currently on the /messages page, increment unread count
                if (window.location.pathname !== '/messages') {
                    setUnreadCount(prev => prev + 1);
                }
            });

            newSocket.on('notification', (noti) => {
                setUnreadNotiCount(prev => prev + 1);
            });

            return () => {
                newSocket.disconnect();
            };

        }
    }, [user?.id]);

    return (
        <SocketContext.Provider value={{ 
            socket, 
            onlineUsers, 
            isConnected, 
            unreadCount, 
            setUnreadCount,
            unreadNotiCount,
            setUnreadNotiCount
        }}>
            {children}
        </SocketContext.Provider>

    );
};
