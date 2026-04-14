import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, Calendar, LayoutDashboard, Clock, ShieldCheck,
    ChevronRight, LogOut, Wallet, MapPin, TrendingUp,
    MessageSquare, Bell, PlusCircle, Search, Filter,
    CheckCircle2, AlertCircle, ArrowUpRight, Hourglass,
    XCircle, Info, Loader2, ArrowLeft, X, Printer, QrCode, Download, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingService, getImageUrl, walletService } from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import RiderApp from './RiderApp';
import NotificationDropdown from '../components/NotificationDropdown';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [bookings, setBookings] = useState([]);
    const [ownerRequests, setOwnerRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showTicket, setShowTicket] = useState(false);
    const [walletHistory, setWalletHistory] = useState({ balance: 0, transactions: [] });
    const [bookingFilter, setBookingFilter] = useState('all');
    const [showNotifications, setShowNotifications] = useState(false);
    const { unreadCount, setUnreadCount, socket, unreadNotiCount } = useSocket();

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const seekerBookings = await bookingService.getMyBookings();
                setBookings(seekerBookings || []);

                if (user?.role === 'owner') {
                    const requests = await bookingService.getOwnerBookings();
                    setOwnerRequests(requests || []);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
            fetchWallet();
        } else if (!loading) {
            // If check is done and no user, maybe redirect
            // navigate('/login');
        }
    }, [user]);

    const fetchWallet = async () => {
        try {
            const data = await walletService.getHistory();
            setWalletHistory(data);
        } catch (error) {
            console.error("Error fetching wallet:", error);
        }
    };


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleUpdateStatus = async (bookingId, status) => {
        try {
            await bookingService.updateStatus(bookingId, status);
            setOwnerRequests(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
            if (status === 'completed') {
                fetchWallet();
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const stats = {
        totalSpent: bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0),
        activeRides: bookings.filter(b => b.status === 'confirmed').length,
        pendingApprovals: ownerRequests.filter(r => r.status === 'pending').length,
        earnings: ownerRequests.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Hourglass size={14} color="var(--primary)" />;
            case 'confirmed': return <CheckCircle2 size={14} color="#10b981" />;
            case 'cancelled': return <XCircle size={14} color="#ef4444" />;
            default: return <Info size={14} />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Awaiting Approval';
            case 'confirmed': return 'Booking Confirmed';
            case 'cancelled': return 'Booking Rejected';
            default: return status;
        }
    };

    if (loading) return (
        <div style={{ background: '#020617', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
            <p style={{ marginTop: 20, opacity: 0.6 }}>Synchronizing Terminal...</p>
            <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (user?.role === 'rider') {
        return <RiderApp />;
    }

    return (
        <div className="dashboard-wrapper">
            <style>{`
                .dashboard-wrapper { display: flex; min-height: 100vh; background: #020617; color: #fff; font-family: 'Inter', sans-serif; }
                .dashboard-sidebar { width: 280px; background: rgba(15,23,42,0.9); border-right: 1px solid rgba(255,255,255,0.05); padding: 30px; display: flex; flex-direction: column; position: fixed; height: 100vh; z-index: 100; backdrop-filter: blur(20px); }
                .sidebar-logo { height: 60px; object-fit: contain; margin-bottom: 40px; }
                .sidebar-nav { display: flex; flex-direction: column; gap: 8px; }
                .nav-link { display: flex; align-items: center; gap: 15px; padding: 14px 20px; border-radius: 12px; color: #94a3b8; border: none; background: transparent; cursor: pointer; transition: all 0.3s; text-decoration: none; font-size: 0.95rem; text-align: left; }
                .nav-link:hover { background: rgba(255,255,255,0.03); color: #fff; }
                .nav-link.active { background: rgba(6,182,212,0.1); color: var(--primary); font-weight: 600; }
                .dashboard-main-content { flex: 1; margin-left: 280px; padding: 40px; width: calc(100% - 280px); }
                .dashboard-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .welcome-msg h1 { font-size: 2rem; margin-bottom: 5px; font-weight: 800; }
                .welcome-msg p { color: #94a3b8; font-size: 0.9rem; }
                .user-badge { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
                .dashboard-grid-elite { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .stat-card-elite { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 30px; border-radius: 24px; display: flex; align-items: center; gap: 20px; transition: transform 0.3s; }
                .stat-card-elite:hover { transform: translateY(-5px); border-color: var(--primary-glow); }
                .stat-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(6,182,212,0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; }
                .stat-info h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 2px; }
                .stat-info p { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
                .table-glass-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 30px; }
                .table-header-elite { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .elite-table { width: 100%; border-collapse: collapse; }
                .elite-table th { text-align: left; padding: 15px; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .elite-table td { padding: 20px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem; }
                .status-pill-elite { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }
                .status-pill-elite.pending { background: rgba(6,182,212,0.1); color: var(--primary); }
                .status-pill-elite.confirmed { background: rgba(16,185,129,0.1); color: #10b981; }
                .mini-vehicle-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .journeys-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
                .journey-card-elite { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 25px; overflow: hidden; position: relative; }
                .j-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .j-status-badge { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .j-id { font-size: 0.7rem; color: #64748b; font-family: monospace; }
                .j-vehicle-info { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
                .j-vehicle-info h4 { font-size: 1.1rem; margin-bottom: 2px; }
                .j-vehicle-info p { font-size: 0.8rem; color: #94a3b8; }
                .j-details-strip { display: flex; gap: 20px; margin-bottom: 20px; padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
                .d-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #94a3b8; }
                .j-price-box { margin-bottom: 20px; }
                .j-price-box span { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
                .j-price-box h3 { font-size: 1.4rem; color: var(--primary); font-weight: 800; margin-top: 4px; }
                .btn-journey-action { width: 100%; padding: 12px; border-radius: 12px; border: none; background: rgba(6,182,212,0.1); color: var(--primary); font-weight: 700; cursor: pointer; transition: all 0.3s; }
                .btn-journey-action:hover { background: var(--primary); color: #fff; }
                .waiting-msg { display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 0.8rem; justify-content: center; }
                .btn-accept { background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
                .btn-reject { background: #ef4444; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
                .u-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
                .user-short-info { display: flex; align-items: center; gap: 10px; }
                .status-chip { font-size: 0.75rem; padding: 4px 10px; border-radius: 50px; font-weight: 700; text-transform: uppercase; }
                .status-chip.confirmed { background: rgba(16,185,129,0.1); color: #10b981; }
                .status-chip.cancelled { background: rgba(239,68,68,0.1); color: #ef4444; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                /* TICKET STYLES */
                .ticket-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .ticket-modal { width: 100%; max-width: 450px; position: relative; }
                .close-ticket { position: absolute; top: -50px; right: 0; background: none; border: none; color: #fff; cursor: pointer; opacity: 0.5; transition: 0.3s; }
                .close-ticket:hover { opacity: 1; transform: rotate(90deg); }
                .ticket-paper { background: #fff; color: #000; border-radius: 24px; overflow: hidden; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
                .ticket-header { padding: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
                .ticket-id-section { text-align: right; }
                .ticket-id-section span { font-size: 0.6rem; font-weight: 800; color: #94a3b8; display: block; margin-bottom: 2px; }
                .ticket-id-section h4 { font-family: monospace; font-size: 1.1rem; color: #1e293b; }
                .ticket-divider-line { height: 1px; background: #f1f5f9; margin: 0 30px; }
                .ticket-grid { display: grid; grid-template-columns: 1fr 1fr; padding: 25px 30px; gap: 20px; }
                .ticket-col label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; margin-bottom: 5px; letter-spacing: 0.5px; }
                .ticket-col p { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
                .ticket-vehicle-banner { background: #f8fafc; margin: 0 30px; padding: 20px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; }
                .ticket-v-icon { width: 44px; height: 44px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #f59e0b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .ticket-v-info h4 { font-size: 1rem; color: #1e293b; }
                .ticket-v-info p { font-size: 0.75rem; color: #64748b; }
                .ticket-v-status { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 800; color: #10b981; }
                .ticket-footer { padding: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                .ticket-stamp { transform: rotate(-15deg); border: 2px dashed rgba(16,185,129,0.3); padding: 10px; border-radius: 12px; }
                .stamp-inner { display: flex; flex-direction: column; align-items: center; gap: 2px; }
                .stamp-inner span { font-size: 0.55rem; font-weight: 900; color: rgba(16,185,129,0.4); }
                .ticket-perforation { height: 1px; border-top: 2px dashed #cbd5e1; margin: 0 20px; position: relative; }
                .ticket-perforation::before, .ticket-perforation::after { content: ''; position: absolute; width: 20px; height: 20px; background: #020617; border-radius: 50%; top: -10px; }
                .ticket-perforation::before { left: -30px; }
                .ticket-perforation::after { right: -30px; }
                .ticket-stub { padding: 25px 30px; background: #f1f5f9; }
                .ticket-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 25px; }
                .ticket-act-btn { padding: 14px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600; font-size: 0.9rem; transition: 0.3s; }
                .ticket-act-btn:hover { background: rgba(255,255,255,0.1); }
                .ticket-act-btn.gold { background: var(--primary, #06b6d4); color: #000; border: none; }

                /* WALLET STYLES */
                .wallet-stats-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 30px; }
                .balance-card-premium { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 40px; border-radius: 32px; position: relative; overflow: hidden; color: #000; box-shadow: 0 20px 40px rgba(6, 182, 212, 0.2); }
                .balance-card-premium::after { content: ''; position: absolute; width: 300px; height: 300px; background: rgba(255,255,255,0.1); border-radius: 50%; top: -100px; right: -100px; }
                .balance-label { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; opacity: 0.7; letter-spacing: 1px; }
                .balance-value { font-size: 3.5rem; font-weight: 900; margin: 10px 0 20px 0; font-family: 'Space Grotesk', sans-serif; }
                .btn-topup-main { background: #000; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 10px; z-index: 10; position: relative; }
                .btn-topup-main:hover { transform: scale(1.05); }
                .escrow-badge-capsule { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 800; color: #fff; background: rgba(0,0,0,0.25); padding: 8px 16px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(5px); z-index: 10; position: relative; }
                
                .mini-stat-wallet { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 25px; border-radius: 24px; display: flex; flex-direction: column; justify-content: center; }
                .mini-stat-wallet h3 { font-size: 1.5rem; font-weight: 800; color: var(--primary); }
                .mini-stat-wallet p { font-size: 0.8rem; color: #94a3b8; }

                .transaction-row-elite { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
                .transaction-row-elite:hover { background: rgba(255,255,255,0.02); }
                .t-icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .t-icon-box.credit { background: rgba(16,185,129,0.1); color: #10b981; }
                .t-icon-box.debit { background: rgba(239,68,68,0.1); color: #ef4444; }
                .t-details h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 4px; }
                .t-details p { font-size: 0.75rem; color: #64748b; }
                .t-amount { text-align: right; }
                .t-amount h4 { font-size: 1.1rem; font-weight: 800; }
                .t-amount p { font-size: 0.7rem; color: #94a3b8; }

                /* MODAL */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .premium-modal-card { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 400px; padding: 40px; border-radius: 32px; }
                .topup-input-wrap { margin: 30px 0; }
                .topup-field { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 15px; border-radius: 12px; font-size: 1.2rem; font-weight: 700; text-align: center; }
                .btn-confirm-topup { width: 100%; padding: 16px; border-radius: 12px; border: none; background: var(--primary); color: #000; font-weight: 800; cursor: pointer; }
            `}</style>

            {/* 1. Sidebar */}
            <div className="dashboard-sidebar">
                <Link to="/">
                    <img src={logoImg} alt="YatraHub" className="sidebar-logo" />
                </Link>
                <div className="sidebar-nav">
                    <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <LayoutDashboard size={20} /> <span>Overview</span>
                    </button>
                    <button className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                        <Calendar size={20} /> <span>My Journeys</span>
                    </button>
                    {user?.role === 'owner' && (
                        <button className={`nav-link ${activeTab === 'fleet' ? 'active' : ''}`} onClick={() => setActiveTab('fleet')}>
                            <Car size={20} /> <span>Booking Requests</span>
                        </button>
                    )}
                    {user?.role === 'seeker' && (
                        <button className="nav-link" onClick={() => navigate('/live-ride')} style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}>
                            <MapPin size={20} /> <span>Live Ride Tracker</span>
                        </button>
                    )}
                    <button className={`nav-link ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>
                        <Wallet size={20} /> <span>Billing History</span>
                    </button>
                    <Link to="/messages" className="nav-link" style={{ position: 'relative' }}>
                        <MessageSquare size={20} /> <span>Live Chat</span>
                        {unreadCount > 0 && (
                            <span style={{ 
                                position: 'absolute', 
                                right: '20px', 
                                background: '#ef4444', 
                                color: '#fff', 
                                borderRadius: '50%', 
                                width: '18px', 
                                height: '18px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '0.65rem' 
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                </div>


                <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <button className="nav-link logout" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#fb7185' }}>
                        <LogOut size={20} /> <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* 2. Main Content */}
            <div className="dashboard-main-content">
                <div className="dashboard-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link to="/" className="back-arrow-link" style={{ marginRight: 20, color: 'var(--adm-muted)', transition: 'color 0.3s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--adm-muted)'}>
                            <ArrowLeft size={28} />
                        </Link>
                        <div className="welcome-msg">
                            <h1>{activeTab === 'overview' ? 'Elite Terminal' : activeTab === 'bookings' ? 'My Journeys' : 'Partner Control'}</h1>
                            <p>Welcome back, {user?.username}.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="noti-bell-wrap" style={{ position: 'relative', cursor: 'pointer' }} 
                            onClick={() => setShowNotifications(!showNotifications)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <Bell size={24} color="#fff" />
                            {unreadNotiCount > 0 && (
                                <span style={{ 
                                    position: 'absolute', 
                                    top: '-8px', 
                                    right: '-8px', 
                                    background: '#ef4444', 
                                    color: '#fff', 
                                    borderRadius: '50%', 
                                    width: '18px', 
                                    height: '18px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                                    border: '2px solid #020617',
                                    zIndex: 10
                                }}>
                                    {unreadNotiCount}
                                </span>
                            )}
                            <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                        </div>
                        <div className="user-pill">
                            <div className="user-badge" style={{ padding: 0, overflow: 'hidden' }}>
                                {user?.profileImage ? (
                                    <img src={getImageUrl(user.profileImage)} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    user?.username?.charAt(0).toUpperCase()
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <>
                        <div className="dashboard-grid-elite">
                            <div className="stat-card-elite">
                                <div className="stat-icon"><TrendingUp /></div>
                                <div className="stat-info">
                                    <h2>Rs. {user?.role === 'owner' ? stats.earnings : stats.totalSpent}</h2>
                                    <p>{user?.role === 'owner' ? 'Hub Earnings' : 'Travel Spent'}</p>
                                </div>
                            </div>
                            <div className="stat-card-elite">
                                <div className="stat-icon"><Car /></div>
                                <div className="stat-info">
                                    <h2>{stats.activeRides}</h2>
                                    <p>Confirmed Rides</p>
                                </div>
                            </div>
                            <div className="stat-card-elite">
                                <div className="stat-icon"><Clock /></div>
                                <div className="stat-info">
                                    <h2>{bookings.filter(b => b.status === 'pending').length}</h2>
                                    <p>Pending Requests</p>
                                </div>
                            </div>
                        </div>

                        <div className="table-glass-card" style={{ marginTop: '30px' }}>
                            <div className="table-header-elite">
                                <h3>Quick Journey Status</h3>
                                <button className="nav-link" style={{ padding: '5px 15px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setActiveTab('bookings')}>View All</button>
                            </div>
                            <table className="elite-table">
                                <thead>
                                    <tr>
                                        <th>Vehicle</th>
                                        <th>Schedule</th>
                                        <th>Status Tracking</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.length > 0 ? bookings.slice(0, 5).map(booking => (
                                        <tr key={booking.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div className="mini-vehicle-icon"><Car size={16} /></div>
                                                    <span style={{ fontWeight: '700' }}>{booking.vehicle?.name || 'Loading...'}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(booking.startDate).toLocaleDateString()}</td>
                                            <td>
                                                <div className={`status-pill-elite ${booking.status}`}>
                                                    {getStatusIcon(booking.status)}
                                                    <span style={{ marginLeft: 8 }}>{getStatusText(booking.status)}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: '800', color: 'var(--primary)' }}>Rs. {booking.totalAmount}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No recent activity metadata found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'bookings' && (
                    <div className="my-journeys-container">
                        <div className="journeys-header" style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
                            <button
                                className={`adm-pill ${bookingFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setBookingFilter('all')}
                            >
                                All
                            </button>
                            <button
                                className={`adm-pill ${bookingFilter === 'confirmed' ? 'active' : ''}`}
                                onClick={() => setBookingFilter('confirmed')}
                            >
                                Confirmed
                            </button>
                            <button
                                className={`adm-pill ${bookingFilter === 'pending' ? 'active' : ''}`}
                                onClick={() => setBookingFilter('pending')}
                            >
                                Pending
                            </button>
                        </div>

                        <div className="journeys-grid">
                            {bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter).length > 0 ?
                                bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter).map(booking => (
                                    <motion.div
                                        className="journey-card-elite"
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="j-card-header">
                                            <div className="j-status-badge" style={{ color: booking.status === 'confirmed' ? '#10b981' : booking.status === 'pending' ? 'var(--primary)' : '#ef4444' }}>
                                                {getStatusIcon(booking.status)}
                                                <span style={{ marginLeft: 8 }}>{getStatusText(booking.status)}</span>
                                            </div>
                                            <span className="j-id">ID: {(booking.id || '').substring(0, 8).toUpperCase()}</span>
                                        </div>

                                        <div className="j-card-body">
                                            <div className="j-vehicle-info">
                                                <Car size={24} color="var(--primary)" />
                                                <div>
                                                    <h4>{booking.vehicle?.name}</h4>
                                                    <p>{booking.vehicle?.brand}</p>
                                                </div>
                                            </div>

                                            <div className="j-details-strip">
                                                <div className="d-item">
                                                    <Calendar size={14} />
                                                    <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="j-price-box">
                                                <span>Total Fare</span>
                                                <h3>Rs. {booking.totalAmount}</h3>
                                            </div>

                                            <div className="j-action-footer">
                                                {booking.status === 'pending' ? (
                                                    <div className="waiting-msg">
                                                        <Loader2 className="animate-spin" size={14} />
                                                        <span>Awaiting owner confirmation...</span>
                                                    </div>
                                                ) : booking.status === 'confirmed' ? (
                                                    <div style={{ display: 'flex', gap: 10 }}>
                                                        <button className="btn-journey-action" style={{ flex: 1 }} onClick={() => { setSelectedTicket(booking); setShowTicket(true); }}>View Ticket</button>
                                                        <Link to={`/messages?userId=${booking.vehicle?.ownerId}`} className="btn-journey-action" style={{ width: 'auto', padding: '12px 15px' }}>
                                                            <MessageSquare size={16} />
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <button className="btn-journey-action" style={{ opacity: 0.5 }}>Session Closed</button>
                                                )}

                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
                                        <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: 20 }} />
                                        <p style={{ color: '#94a3b8' }}>No active journeys found.</p>
                                        <button className="adm-pill active" style={{ marginTop: 20 }} onClick={() => navigate('/')}>Book Your First Ride</button>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                {activeTab === 'fleet' && user?.role === 'owner' && (
                    <div className="owner-requests-container">
                        <div className="table-glass-card">
                            <div className="table-header-elite">
                                <h3>Manage Booking Requests</h3>
                            </div>
                            <table className="elite-table">
                                <thead>
                                    <tr>
                                        <th>Seeker</th>
                                        <th>Vehicle</th>
                                        <th>Dates</th>
                                        <th>Payout</th>
                                        <th>Decision</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ownerRequests.length > 0 ? ownerRequests.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <div className="user-short-info">
                                                    <div className="u-avatar">{req.seeker?.username?.charAt(0)}</div>
                                                    <span>{req.seeker?.username}</span>
                                                </div>
                                            </td>
                                            <td>{req.vehicle?.name}</td>
                                            <td>{new Date(req.startDate).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: '700', color: 'var(--primary)' }}>Rs. {req.totalAmount}</td>
                                            <td>
                                                {req.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button className="btn-accept" onClick={() => handleUpdateStatus(req.id, 'confirmed')}>Accept</button>
                                                        <button className="btn-reject" onClick={() => handleUpdateStatus(req.id, 'cancelled')}>Reject</button>
                                                        <Link to={`/messages?userId=${req.seeker?.id}`} className="btn-journey-action" style={{ width: 'auto', padding: '8px 12px', background: 'rgba(255,255,255,0.05)' }}>
                                                            <MessageSquare size={16} />
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span className={`status-chip ${req.status}`}>{req.status}</span>
                                                        <Link to={`/messages?userId=${req.seeker?.id}`} className="nav-link" style={{ padding: 5 }}>
                                                            <MessageSquare size={16} color="var(--primary)" />
                                                        </Link>
                                                    </div>
                                                )}

                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No pending guest requests.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'wallet' && (
                    <div className="wallet-container">
                        <div className="table-glass-card">
                            <div className="table-header-elite">
                                <h3>Billing & Escrow History</h3>
                                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                    <div className="escrow-badge-capsule" style={{ background: 'rgba(6,182,212,0.1)', borderColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                        <ShieldCheck size={16} />
                                        <span>eSewa Secure Escrow</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="adm-pill active">All</button>
                                        <button className="adm-pill">Earnings</button>
                                        <button className="adm-pill">Spent</button>
                                    </div>
                                </div>
                            </div>

                            <div className="transaction-list">
                                {walletHistory.transactions?.length > 0 ? walletHistory.transactions.map(t => (
                                    <div className="transaction-row-elite" key={t.id}>
                                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                            <div className={`t-icon-box ${t.type === 'credit' ? 'credit' : 'debit'}`}>
                                                {t.category === 'topup' ? <ArrowUpRight /> : t.category === 'earning' ? <TrendingUp /> : <Download style={{ transform: 'rotate(180deg)' }} />}
                                            </div>
                                            <div className="t-details">
                                                <h4>{t.description || (t.category === 'topup' ? 'Wallet Top-up' : 'Booking Payment')}</h4>
                                                <p>{new Date(t.createdAt).toLocaleString()} • {t.status}</p>
                                            </div>
                                        </div>
                                        <div className="t-amount">
                                            <h4 style={{ color: t.type === 'credit' ? '#10b981' : '#fff' }}>
                                                {t.type === 'credit' ? '+' : '-'} Rs. {t.amount}
                                            </h4>
                                            <p>{t.type === 'credit' ? 'Credited to Wallet' : 'Debited from Wallet'}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                                        <Wallet size={48} style={{ marginBottom: 15 }} />
                                        <p>No transaction history found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showTicket && selectedTicket && (
                    <div className="ticket-overlay" onClick={() => setShowTicket(false)}>
                        <motion.div
                            className="ticket-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="close-ticket" onClick={() => setShowTicket(false)}><X size={20} /></button>

                            <div className="ticket-paper">
                                <div className="ticket-header">
                                    <img src={logoImg} alt="YatraHub" style={{ height: 40 }} />
                                    <div className="ticket-id-section">
                                        <span>OFFICIAL BOARDING PASS</span>
                                        <h4>#{selectedTicket.id?.substring(0, 8).toUpperCase()}</h4>
                                    </div>
                                </div>

                                <div className="ticket-divider-line"></div>

                                <div className="ticket-grid">
                                    <div className="ticket-col">
                                        <label>PASSENGER / SEEKER</label>
                                        <p>{user?.username}</p>
                                    </div>
                                    <div className="ticket-col">
                                        <label>BOOKING DATE</label>
                                        <p>{new Date(selectedTicket.startDate).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="ticket-vehicle-banner">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                        <div className="ticket-v-icon"><Car size={24} /></div>
                                        <div>
                                            <h4>{selectedTicket.vehicle?.name}</h4>
                                            <p>{selectedTicket.vehicle?.brand} • {selectedTicket.vehicle?.category || 'Standard'}</p>
                                        </div>
                                    </div>
                                    <div className="ticket-v-status">
                                        <CheckCircle2 size={16} /> CONFIRMED
                                    </div>
                                </div>

                                <div className="ticket-grid">
                                    <div className="ticket-col">
                                        <label>PICKUP LOCATION</label>
                                        <p>{selectedTicket.vehicle?.location || 'Kathmandu, Nepal'}</p>
                                    </div>
                                    <div className="ticket-col" style={{ textAlign: 'right' }}>
                                        <label>TOTAL FARE PAID</label>
                                        <p style={{ color: 'var(--primary)', fontWeight: 800 }}>Rs. {selectedTicket.totalAmount}</p>
                                    </div>
                                </div>

                                <div className="ticket-footer">
                                    <div className="ticket-qr-section">
                                        <QrCode size={80} style={{ opacity: 0.8 }} />
                                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 5 }}>SCAN FOR VERIFICATION</div>
                                    </div>
                                    <div className="ticket-stamp">
                                        <div className="stamp-inner">
                                            <ShieldCheck size={40} color="rgba(16,185,129,0.4)" />
                                            <span>YATRAHUB VERIFIED</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ticket-perforation"></div>

                                <div className="ticket-stub">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <label style={{ fontSize: '0.6rem', color: '#94a3b8' }}>GATE PASS</label>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedTicket.vehicle?.name}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: 600 }}>SRCE: YHB-{selectedTicket.id?.substring(0, 4)}</p>
                                            <p style={{ fontSize: '0.6rem', opacity: 0.5 }}>{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ticket-actions">
                                <button className="ticket-act-btn" onClick={() => setShowTicket(false)}><ArrowLeft size={18} /> Back</button>
                                <button className="ticket-act-btn" onClick={() => window.print()}><Printer size={18} /> Print Ticket</button>
                                <button className="ticket-act-btn gold"><Download size={18} /> Save as PDF</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Dashboard;
