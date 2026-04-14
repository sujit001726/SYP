import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, User, MoreVertical, Phone, Video, Info, Check, CheckCheck, Inbox, ArrowLeft, Paperclip, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { messageService, getImageUrl, authService, userService } from '../services/api';
import { useSocket } from '../context/SocketContext';

const Messages = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showChatList, setShowChatList] = useState(true);

    const currentUser = authService.getCurrentUser();
    const location = useLocation();
    const navigate = useNavigate();
    const { socket, onlineUsers, setUnreadCount } = useSocket();
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchChats();
        setUnreadCount(0);
        const queryParams = new URLSearchParams(location.search);

        const userId = queryParams.get('userId');
        if (userId) {
            handleInitialUser(userId);
        }
    }, [location.search]);

    const handleInitialUser = async (userId) => {
        try {
            const data = await messageService.getChatList();
            setChats(data);
            
            const existingChat = data.find(c => c.user.id === userId);
            if (existingChat) {
                setSelectedChat(existingChat);
            } else {
                const userData = await userService.getUserById(userId);
                if (userData) {
                    const newChat = { user: userData, lastMessage: null };
                    setSelectedChat(newChat);
                    setChats(prev => [newChat, ...prev]);
                }
            }
        } catch (error) {
            console.error('Error handling initial user:', error);
        }
    };

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.user.id);
            if (window.innerWidth < 768) setShowChatList(false);
        }
    }, [selectedChat]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        socket.on('message-received', (message) => {
            if (selectedChat && message.senderId === selectedChat.user.id) {
                setMessages(prev => [...prev, message]);
                messageService.markAsRead(message.senderId);
            }
            fetchChats();
        });

        socket.on('user-typing', (data) => {
            if (selectedChat && data.senderId === selectedChat.user.id) {
                setOtherUserTyping(true);
            }
        });

        socket.on('user-stop-typing', (data) => {
            if (selectedChat && data.senderId === selectedChat.user.id) {
                setOtherUserTyping(false);
            }
        });

        socket.on('message-sent-sync', (message) => {
            if (selectedChat && message.receiverId === selectedChat.user.id) {
                setMessages(prev => [...prev, message]);
            }
            fetchChats();
        });

        return () => {
            socket.off('message-received');
            socket.off('message-sent-sync');
            socket.off('user-typing');
            socket.off('user-stop-typing');
        };

    }, [socket, selectedChat]);

    const fetchChats = async () => {
        try {
            const data = await messageService.getChatList();
            setChats(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching chats:', error);
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedChat) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('receiverId', selectedChat.user.id);
            formData.append('messageType', file.type.startsWith('image/') ? 'image' : 'file');

            const data = await messageService.sendFile(formData);
            setMessages(prev => [...prev, data]);
            
            if (socket) {
                socket.emit('new-message', data);
            }
            
            fetchChats();
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const data = await messageService.getMessages(userId);
            setMessages(data);
            await messageService.markAsRead(userId);
            fetchChats();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        try {
            const messageData = {
                receiverId: selectedChat.user.id,
                content: newMessage,
                messageType: 'text'
            };

            const data = await messageService.sendMessage(messageData);
            setMessages(prev => [...prev, data]);
            setNewMessage('');
            
            if (socket) {
                socket.emit('new-message', data);
                socket.emit('stop-typing', { 
                    receiverId: selectedChat.user.id, 
                    senderId: currentUser.id 
                });
            }
            
            fetchChats();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (!socket || !selectedChat) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing', { 
                receiverId: selectedChat.user.id, 
                senderId: currentUser.id 
            });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('stop-typing', { 
                receiverId: selectedChat.user.id, 
                senderId: currentUser.id 
            });
        }, 2000);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredChats = chats.filter(chat => 
        chat.user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="chat-page-container">
            <style>{`
                .chat-page-container {
                    display: flex;
                    height: 100vh;
                    background: #020617;
                    color: #fff;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                }
                .chat-sidebar {
                    width: 380px;
                    background: rgba(15, 23, 42, 0.4);
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                }
                @media (max-width: 768px) {
                    .chat-sidebar {
                        width: 100%;
                        display: ${showChatList ? 'flex' : 'none'};
                    }
                }
                .sidebar-header {
                    padding: 30px;
                }
                .sidebar-header h1 {
                    font-size: 1.8rem;
                    font-weight: 800;
                    background: linear-gradient(to right, #06b6d4, #22d3ee);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .search-container {
                    margin-top: 20px;
                    position: relative;
                }
                .search-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                }
                .search-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 15px 12px 45px;
                    color: #fff;
                    outline: none;
                    transition: border-color 0.3s;
                }
                .search-input:focus {
                    border-color: var(--primary);
                }
                .chat-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 20px 20px;
                }
                .chat-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin-bottom: 8px;
                    border: 1px solid transparent;
                }
                .chat-item:hover {
                    background: rgba(255, 255, 255, 0.03);
                }
                .chat-item.active {
                    background: rgba(6, 182, 212, 0.1);
                    border-color: rgba(6, 182, 212, 0.2);
                }
                .user-avatar-wrap {
                    position: relative;
                }
                .user-avatar {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    background: #1e293b;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .online-indicator {
                    position: absolute;
                    bottom: -3px;
                    right: -3px;
                    width: 14px;
                    height: 14px;
                    background: #10b981;
                    border: 3px solid #020617;
                    border-radius: 50%;
                }
                .chat-info {
                    flex: 1;
                    min-width: 0;
                }
                .chat-info-top {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .chat-info-top h4 {
                    font-size: 0.95rem;
                    font-weight: 700;
                    margin: 0;
                }
                .chat-time {
                    font-size: 0.7rem;
                    color: #64748b;
                }
                .chat-last-msg {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .chat-last-msg.unread {
                    color: var(--primary);
                    font-weight: 600;
                }
                .unread-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--primary);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--primary);
                }

                .main-chat {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: rgba(15, 23, 42, 0.2);
                }
                @media (max-width: 768px) {
                    .main-chat {
                        display: ${!showChatList ? 'flex' : 'none'};
                    }
                }
                .chat-header {
                    height: 80px;
                    padding: 0 30px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(15, 23, 42, 0.4);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    z-index: 10;
                }
                .header-user {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .header-back-btn {
                    margin-right: 10px;
                    color: #64748b;
                    cursor: pointer;
                }
                .header-user-info h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin: 0;
                }
                .header-user-info p {
                    font-size: 0.7rem;
                    color: var(--primary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 700;
                    margin-top: 2px;
                }
                .header-actions {
                    display: flex;
                    gap: 10px;
                }
                .action-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .action-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                }

                .messages-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .message-group {
                    display: flex;
                    flex-direction: column;
                }
                .time-divider {
                    text-align: center;
                    margin: 20px 0;
                    position: relative;
                }
                .time-divider span {
                    background: rgba(15, 23, 42, 0.6);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 700;
                }
                .message-row {
                    display: flex;
                    width: 100%;
                }
                .message-row.me {
                    justify-content: flex-end;
                }
                .bubble {
                    max-width: 70%;
                    padding: 12px 18px;
                    border-radius: 18px;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    position: relative;
                }
                .message-row.other .bubble {
                    background: rgba(30, 41, 59, 0.8);
                    color: #e2e8f0;
                    border-top-left-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .message-row.me .bubble {
                    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
                    color: #fff;
                    border-top-right-radius: 4px;
                    box-shadow: 0 10px 20px rgba(6, 182, 212, 0.15);
                }
                .msg-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 6px;
                    font-size: 0.7rem;
                    color: #64748b;
                }
                .message-row.me .msg-meta {
                    justify-content: flex-end;
                }
                
                .typing-indicator {
                    display: flex;
                    gap: 4px;
                    padding: 12px 18px;
                    background: rgba(30, 41, 59, 0.4);
                    border-radius: 18px;
                    border-top-left-radius: 4px;
                    width: fit-content;
                }
                .dot {
                    width: 6px;
                    height: 6px;
                    background: var(--primary);
                    border-radius: 50%;
                    animation: bounce 1s infinite alternate;
                }
                .dot:nth-child(2) { animation-delay: 0.2s; }
                .dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes bounce { to { opacity: 0.3; transform: translateY(-4px); } }

                .input-area {
                    padding: 25px 30px;
                    background: rgba(15, 23, 42, 0.4);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                }
                .input-form {
                    display: flex;
                    gap: 15px;
                }
                .msg-input-wrap {
                    flex: 1;
                    position: relative;
                }
                .msg-input {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 14px 20px;
                    color: #fff;
                    outline: none;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }
                .msg-input:focus {
                    border-color: var(--primary);
                }
                .send-btn {
                    width: 52px;
                    height: 52px;
                    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
                    border: none;
                    border-radius: 16px;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.3s;
                    box-shadow: 0 10px 20px rgba(6, 182, 212, 0.2);
                }
                .send-btn:hover {
                    transform: scale(1.05);
                }
                .attachment-btn {
                    width: 52px;
                    height: 52px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .attachment-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                .msg-image {
                    max-width: 100%;
                    border-radius: 12px;
                    margin-bottom: 5px;
                    cursor: pointer;
                    transition: transform 0.3s;
                }
                .msg-image:hover {
                    transform: scale(1.02);
                }
                .file-attachment {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px 15px;
                    border-radius: 12px;
                    color: #fff;
                    text-decoration: none;
                }
                .file-icon-box {
                    width: 36px;
                    height: 36px;
                    background: var(--primary);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                }
                .empty-chat {

                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    color: #64748b;
                }
                .empty-icon-box {
                    width: 100px;
                    height: 100px;
                    background: rgba(6, 182, 212, 0.05);
                    border: 1px solid rgba(6, 182, 212, 0.1);
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                }
            `}</style>

            {/* Sidebar */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <ArrowLeft className="header-back-btn" size={24} onClick={() => navigate('/dashboard')} />
                        <h1>Messages</h1>
                    </div>
                    <div className="search-container">
                        <Search className="search-icon" size={18} />
                        <input 
                            className="search-input"
                            type="text" 
                            placeholder="Search chats..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="chat-list">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="dot" style={{ display: 'inline-block' }}></div>
                        </div>
                    ) : filteredChats.length > 0 ? (
                        filteredChats.map((chat) => (
                            <div 
                                key={chat.user.id} 
                                className={`chat-item ${selectedChat?.user.id === chat.user.id ? 'active' : ''}`}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <div className="user-avatar-wrap">
                                    <div className="user-avatar">
                                        {chat.user.profileImage ? (
                                            <img src={getImageUrl(chat.user.profileImage)} alt="" />
                                        ) : (
                                            <User size={24} color="#64748b" />
                                        )}
                                    </div>
                                    {onlineUsers.includes(chat.user.id) && <div className="online-indicator"></div>}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-info-top">
                                        <h4>{chat.user.username}</h4>
                                        <span className="chat-time">{chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : ''}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p className={`chat-last-msg ${chat.lastMessage?.isRead === false && chat.lastMessage.senderId !== currentUser.id ? 'unread' : ''}`}>
                                            {chat.lastMessage?.content || 'New conversation'}
                                        </p>
                                        {chat.lastMessage?.isRead === false && chat.lastMessage.senderId !== currentUser.id && (
                                            <div className="unread-dot"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                            <Inbox size={40} style={{ marginBottom: '15px' }} />
                            <p>No conversations yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="main-chat">
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <div className="header-user">
                                <ArrowLeft className="md:hidden" style={{ display: window.innerWidth < 768 ? 'block' : 'none', color: '#64748b', marginRight: '10px' }} onClick={() => setShowChatList(true)} />
                                <div className="user-avatar-wrap">
                                    <div className="user-avatar" style={{ width: '44px', height: '44px' }}>
                                        {selectedChat.user.profileImage ? (
                                            <img src={getImageUrl(selectedChat.user.profileImage)} alt="" />
                                        ) : (
                                            <User size={20} color="#64748b" />
                                        )}
                                    </div>
                                    {onlineUsers.includes(selectedChat.user.id) && <div className="online-indicator"></div>}
                                </div>
                                <div className="header-user-info">
                                    <h3>{selectedChat.user.username}</h3>
                                    <p>{selectedChat.user.role}</p>
                                </div>
                            </div>
                            <div className="header-actions">
                                <div className="action-btn"><Phone size={20} /></div>
                                <div className="action-btn"><Video size={20} /></div>
                                <div className="action-btn"><Info size={20} /></div>
                            </div>
                        </div>

                        <div className="messages-area">
                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === currentUser.id;
                                const showTimestamp = index === 0 || 
                                    new Date(msg.createdAt) - new Date(messages[index-1].createdAt) > 300000;

                                return (
                                    <div key={msg.id} className="message-group">
                                        {showTimestamp && (
                                            <div className="time-divider">
                                                <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`message-row ${isMe ? 'me' : 'other'}`}
                                        >
                                            <div className="bubble-wrap">
                                                <div className="bubble">
                                                    {msg.messageType === 'image' ? (
                                                        <img 
                                                            src={getImageUrl(msg.content)} 
                                                            alt="attachment" 
                                                            className="msg-image"
                                                            onClick={() => window.open(getImageUrl(msg.content), '_blank')}
                                                        />
                                                    ) : msg.messageType === 'file' ? (
                                                        <a href={getImageUrl(msg.content)} target="_blank" rel="noopener noreferrer" className="file-attachment">
                                                            <div className="file-icon-box">
                                                                <FileIcon size={18} />
                                                            </div>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <p style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {msg.content.split('-').slice(1).join('-') || 'Attachment'}
                                                                </p>
                                                                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Click to download</p>
                                                            </div>
                                                        </a>
                                                    ) : (
                                                        msg.content
                                                    )}
                                                </div>

                                                <div className="msg-meta">
                                                    <span>{formatTime(msg.createdAt)}</span>
                                                    {isMe && (msg.isRead ? <CheckCheck size={14} color="var(--primary)" /> : <Check size={14} />)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            })}
                            
                            {otherUserTyping && (
                                <div className="message-row other">
                                    <div className="typing-indicator">
                                        <div className="dot"></div>
                                        <div className="dot"></div>
                                        <div className="dot"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="input-area">
                            <form className="input-form" onSubmit={handleSendMessage}>
                                <div className="attachment-wrap">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        onChange={handleFileSelect}
                                    />
                                    <button 
                                        type="button" 
                                        className="attachment-btn"
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={uploading}
                                    >
                                        <Paperclip size={20} className={uploading ? 'animate-pulse' : ''} />
                                    </button>
                                </div>
                                <div className="msg-input-wrap">
                                    <input 
                                        className="msg-input"
                                        type="text" 
                                        placeholder={uploading ? "Uploading..." : "Type your message..."}
                                        value={newMessage}
                                        onChange={handleTyping}
                                        disabled={uploading}
                                    />
                                </div>

                                <button className="send-btn" type="submit">
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="empty-chat">
                        <div className="empty-icon-box">
                            <Send size={40} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '800' }}>Your Inbox</h2>
                            <p style={{ maxWidth: '300px', margin: '15px 0' }}>Select a user from the sidebar to begin a secure, real-time conversation.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
