import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { notificationService } from '../services/api';
import { useSocket } from '../context/SocketContext';

const NotificationDropdown = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket, setUnreadNotiCount } = useSocket();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!socket) return;

        socket.on('notification', (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            // The unreadNotiCount is already being incremented in SocketContext.jsx
        });

        return () => {
            socket.off('notification');
        };
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getAll();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        const noti = notifications.find(n => n.id === id);
        if (noti && noti.isRead) return; // Already read

        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadNotiCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleNotificationClick = async (noti) => {
        await markAsRead(noti.id);
        if (noti.link) {
            navigate(noti.link);
            onClose();
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadNotiCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} color="#10b981" />;
            case 'warning': return <AlertTriangle size={18} color="#f59e0b" />;
            case 'error': return <AlertCircle size={18} color="#ef4444" />;
            default: return <Info size={18} color="#06b6d4" />;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="notification-dropdown"
                >
                        <style>{`
                            .notification-dropdown {
                                position: absolute;
                                top: 70px;
                                right: 0;
                                width: 320px;
                                background: #0f172a;
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                border-radius: 20px;
                                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                                z-index: 1002;
                                overflow: hidden;
                                display: flex;
                                flex-direction: column;
                                max-height: 500px;
                            }
                            .noti-header {
                                padding: 20px;
                                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            }
                            .noti-header h3 {
                                font-size: 1rem;
                                font-weight: 700;
                            }
                            .mark-all-btn {
                                font-size: 0.75rem;
                                color: var(--primary);
                                background: none;
                                border: none;
                                cursor: pointer;
                                font-weight: 600;
                            }
                            .noti-list {
                                overflow-y: auto;
                            }
                            .noti-item {
                                padding: 15px 20px;
                                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                                display: flex;
                                gap: 15px;
                                cursor: pointer;
                                transition: 0.3s;
                                position: relative;
                            }
                            .noti-item:last-child {
                                border-bottom: none;
                            }
                            .noti-item:hover {
                                background: rgba(255, 255, 255, 0.02);
                            }
                            .noti-item.unread {
                                background: rgba(239, 68, 68, 0.05);
                            }
                            .noti-item.unread::before {
                                content: '';
                                position: absolute;
                                left: 0;
                                top: 0;
                                bottom: 0;
                                width: 3px;
                                background: #ef4444;
                            }
                            .noti-content h4 {
                                font-size: 0.9rem;
                                font-weight: 700;
                                margin-bottom: 4px;
                            }
                            .noti-content p {
                                font-size: 0.8rem;
                                color: #94a3b8;
                                line-height: 1.4;
                            }
                            .noti-time {
                                font-size: 0.7rem;
                                color: #64748b;
                                margin-top: 6px;
                            }
                            .empty-noti {
                                padding: 40px;
                                text-align: center;
                                color: #64748b;
                            }
                        `}</style>
                        <div className="noti-header">
                            <h3>Notifications {notifications.length > 0 && `(${notifications.length})`}</h3>
                            {notifications.length > 0 && (
                                <button className="mark-all-btn" onClick={markAllAsRead}>Mark all read</button>
                            )}
                        </div>
                        <div className="noti-list">
                            {loading ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <div className="animate-spin" style={{ display: 'inline-block' }}>
                                        <Bell size={24} color="#64748b" />
                                    </div>
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((noti, index) => (
                                    <div
                                        key={noti.id}
                                        className={`noti-item ${!noti.isRead ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(noti)}
                                    >
                                        <div className="noti-number" style={{
                                            fontSize: '0.85rem',
                                            fontWeight: '900',
                                            color: noti.isRead ? '#64748b' : '#ef4444',
                                            minWidth: '24px',
                                            textShadow: !noti.isRead ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none'
                                        }}>
                                            {notifications.length - index}.
                                        </div>
                                        <div className="noti-icon">
                                            {getTypeIcon(noti.type)}
                                        </div>
                                        <div className="noti-content">
                                            <h4>{noti.title}</h4>
                                            <p>{noti.message}</p>
                                            <div className="noti-time">{formatTime(noti.createdAt)}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-noti">
                                    <Bell size={40} style={{ marginBottom: 15, opacity: 0.2 }} />
                                    <p>No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationDropdown;
