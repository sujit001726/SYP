import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Users, Car, Calendar, ShieldCheck, Check, X, Eye,
    Loader2, LayoutDashboard, Settings, BarChart3,
    LogOut, Search, Filter, DollarSign, Wallet,
    AlertTriangle, CheckCircle2, Activity, Globe,
    Cpu, Zap, Shield, Box, ChevronLeft, ChevronRight,
    TrendingUp, TrendingDown, Bell, MoreHorizontal,
    ArrowUpRight, Clock, MapPin, Star, ArrowLeft, Camera
} from 'lucide-react';
import { adminService, userService, getImageUrl, notificationService } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import scorpioImg from '../assets/scorpio.jpg';
import toyotaImg from '../assets/toyota.jpg';
import bulletImg from '../assets/bullet.jpg';
import nsImg from '../assets/ns.jpg';
import dioImg from '../assets/dio.jpg';

const VEHICLE_ASSETS = {
    'Mahindra Scorpio S11': scorpioImg,
    'Toyota Hilux': toyotaImg,
    'Toyota Hilux Adventure': toyotaImg,
    'Royal Enfield 350': bulletImg,
    'Bajaj Pulsar NS200': nsImg,
    'Honda Dio': dioImg
};

/* ── HELPERS ─────────────────────────────────────────────── */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const grid = [];
    for (let i = firstDay - 1; i >= 0; i--) grid.push({ day: prevDays - i, current: false });
    for (let i = 1; i <= daysInMonth; i++) grid.push({ day: i, current: true });
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) grid.push({ day: i, current: false });
    return grid;
}

/* ── STATIC DATA ─────────────────────────────────────────── */
const DEMO_RENTALS_PER_DAY = {
    1: 3, 3: 5, 5: 2, 7: 8, 8: 1, 10: 6, 12: 4, 14: 7,
    15: 3, 17: 9, 19: 2, 20: 5, 21: 11, 22: 4, 24: 6, 26: 3, 28: 8
};

const DEMO_TOP_VEHICLES = [
    { name: 'Mahindra Scorpio S11', id: 'VH-2441310', bookings: 128, img: scorpioImg },
    { name: 'Toyota Hilux', id: 'VH-1241318', bookings: 401, img: toyotaImg },
    { name: 'Royal Enfield 350', id: 'VH-8441573', bookings: 89, img: bulletImg },
];

const DEMO_TOP_CUSTOMERS = [
    { name: 'Ram Sharma', bookings: 25, avatar: 'R' },
    { name: 'Sita Thapa', bookings: 15, avatar: 'S' },
    { name: 'Hari Basnet', bookings: 23, avatar: 'H' },
];

/* ── COMPONENTS ─────────────────────────────────────────── */

const RentalCalendar = ({ bookings = [] }) => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [tooltipData, setTooltipData] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const days = useMemo(() => getCalendarDays(year, month), [year, month]);

    // Calculate real rentals for the current month view
    const rentalsPerDay = useMemo(() => {
        const counts = {};
        if (!bookings || !bookings.length) return counts;

        days.forEach(d => {
            if (!d.current) return;
            
            // Create a local noon time for the cell
            const cellTime = new Date(year, month, d.day, 12, 0, 0).getTime();

            // Count how many bookings overlap with this specific date
            const activeCount = bookings.filter(b => {
                // Only count active bookings
                if (!['confirmed', 'completed', 'pending'].includes(b.status)) return false;
                
                try {
                    // Extract YYYY-MM-DD to avoid timezone shifting creating off-by-one errors
                    const startStr = (b.startDate || '').split('T')[0];
                    const endStr = (b.endDate || '').split('T')[0];
                    if (!startStr || !endStr) return false;

                    const [sY, sM, sD] = startStr.split('-').map(Number);
                    const [eY, eM, eD] = endStr.split('-').map(Number);

                    const startTime = new Date(sY, sM - 1, sD, 0, 0, 0).getTime();
                    const endTime = new Date(eY, eM - 1, eD, 23, 59, 59).getTime();

                    return cellTime >= startTime && cellTime <= endTime;
                } catch (err) {
                    return false;
                }
            }).length;

            if (activeCount > 0) counts[d.day] = activeCount;
        });
        return counts;
    }, [bookings, days, year, month]);


    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const handleMouseEnter = (e, day) => {
        if (!day.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const count = rentalsPerDay[day.day] || 0;
        setTooltipData({ day: day.day, count });
        setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    };

    const isToday = (d) => d.current && d.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const getIntensity = (d) => {
        if (!d.current) return '';
        const count = rentalsPerDay[d.day] || 0;
        if (count === 0) return '';
        if (count <= 1) return 'cal-low';
        if (count <= 3) return 'cal-mid';
        if (count <= 5) return 'cal-high';
        return 'cal-max';
    };

    return (
        <div className="adm-calendar-wrap">
            <div className="adm-calendar-header">
                <h3><Calendar size={18} /> Booking Calendar</h3>
                <div className="cal-nav">
                    <button onClick={prevMonth}><ChevronLeft size={16} /></button>
                    <span>{MONTHS[month]} {year}</span>
                    <button onClick={nextMonth}><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="adm-calendar-grid">
                {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
                {days.map((d, i) => (
                    <div
                        key={i}
                        className={`cal-cell ${d.current ? 'current' : 'faded'} ${isToday(d) ? 'today' : ''} ${getIntensity(d)}`}
                        onMouseEnter={(e) => handleMouseEnter(e, d)}
                        onMouseLeave={() => setTooltipData(null)}
                    >
                        {d.day}
                        {d.current && rentalsPerDay[d.day] > 0 && (
                            <span className="cal-dot"></span>
                        )}
                    </div>
                ))}
            </div>
            <div className="cal-legend">
                <span>Less</span>
                <div className="cal-legend-box" style={{ background: 'rgba(245,158,11,0.1)' }}></div>
                <div className="cal-legend-box" style={{ background: 'rgba(245,158,11,0.3)' }}></div>
                <div className="cal-legend-box" style={{ background: 'rgba(245,158,11,0.55)' }}></div>
                <div className="cal-legend-box" style={{ background: 'rgba(245,158,11,0.85)' }}></div>
                <span>More</span>
            </div>
            {tooltipData && (
                <div className="cal-tooltip" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
                    <strong>{tooltipData.day} {MONTHS[month]}</strong>
                    <span>{tooltipData.count} active rental{tooltipData.count !== 1 ? 's' : ''}</span>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status = 'pending' }) => {
    const config = {
        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        confirmed: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        completed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        available: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        rented: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        maintenance: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
        paid: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        unpaid: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        verified: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    };
    const c = config[status.toLowerCase()] || config.pending;
    return (
        <span className="adm-status-badge" style={{ color: c.color, background: c.bg }}>
            <span className="status-dot-mini" style={{ background: c.color }}></span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const BookingDetailModal = ({ booking, isOpen, onClose }) => {
    if (!isOpen || !booking) return null;
    return (
        <div className="adm-modal-overlay" onClick={onClose}>
            <div className="adm-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <h2>Reservation Details</h2>
                    <button className="adm-close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="adm-modal-body">
                    <div className="adm-detail-grid">
                        <div className="adm-detail-sec">
                            <label>CUSTOMER INFORMATION</label>
                            <div className="adm-info-card">
                                <strong>{booking.seeker?.username}</strong>
                                <span>{booking.seeker?.email}</span>
                            </div>
                        </div>
                        <div className="adm-detail-sec">
                            <label>VEHICLE DETAILS</label>
                            <div className="adm-info-card">
                                <strong>{booking.vehicle?.name} ({booking.vehicle?.brand})</strong>
                                <span>Plate: {booking.vehicle?.regNo || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="adm-detail-sec">
                            <label>RENTAL TIMELINE</label>
                            <div className="adm-info-card">
                                <div><Calendar size={14} /> Start: {new Date(booking.startDate).toLocaleDateString()}</div>
                                <div><Calendar size={14} /> End: {new Date(booking.endDate).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="adm-detail-sec">
                            <label>BOOKING & PAYMENT</label>
                            <div className="adm-info-card">
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--adm-primary)', marginBottom: 5 }}>Rs. {Number(booking.totalAmount).toLocaleString()}</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <StatusBadge status={booking.status} />
                                    <StatusBadge status={booking.paymentStatus || 'unpaid'} />
                                </div>
                                {booking.transactionId && <span style={{ fontSize: '0.7rem', marginTop: 5, color: 'var(--adm-muted)' }}>Transaction ID: {booking.transactionId}</span>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="adm-modal-footer">
                    <button className="adm-pill active" onClick={onClose}>Close Terminal</button>
                </div>
            </div>
        </div>
    );
};

const NotificationDropdown = ({ notifications, onMarkRead, onMarkAllRead, onClose }) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div className="adm-noti-dropdown" ref={dropdownRef}>
            <div className="adm-noti-header">
                <h4>Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h4>
                <button onClick={onMarkAllRead}>Mark all as read</button>
            </div>
            <div className="adm-noti-list">
                {notifications.length === 0 ? (
                    <div className="adm-noti-empty">No notifications yet</div>
                ) : (
                    notifications.map((n, index) => (
                        <div key={n.id} className={`adm-noti-item ${n.isRead ? 'read' : 'unread'}`} onClick={() => onMarkRead(n.id)}>
                            <div className="noti-number" style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: '900', 
                                color: n.isRead ? 'var(--adm-muted)' : '#ef4444',
                                minWidth: '24px'
                            }}>
                                {notifications.length - index}.
                            </div>
                            <div className={`noti-icon ${n.type}`}><Bell size={14} /></div>
                            <div className="noti-content">
                                <div className="noti-title">{n.title}</div>
                                <div className="noti-msg">{n.message}</div>
                                <div className="noti-time">{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const UserDetailModal = ({ user, isOpen, onClose }) => {
    if (!isOpen || !user) return null;
    return (
        <div className="adm-modal-overlay" onClick={onClose}>
            <div className="adm-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <h2>Member Profile</h2>
                    <button className="adm-close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="adm-modal-body">
                    <div className="adm-detail-grid">
                        <div className="adm-detail-sec">
                            <label>ACCOUNT INFO</label>
                            <div className="adm-info-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                <div className="adm-user-mini-av" style={{ width: 60, height: 60, fontSize: '1.5rem' }}>
                                    {user.profileImage ? (
                                        <img
                                            src={getImageUrl(user.profileImage)}
                                            alt=""
                                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        />
                                    ) : null}
                                    <div style={{ display: user.profileImage ? 'none' : 'flex' }}>{user.username?.[0] || 'U'}</div>
                                </div>
                                <div>
                                    <strong>{user.username}</strong>
                                    <span>{user.email}</span>
                                </div>
                            </div>
                        </div>
                        <div className="adm-detail-sec">
                            <label>VERIFICATION</label>
                            <div className="adm-info-card">
                                <StatusBadge status={user.kycStatus || 'none'} />
                                <span style={{ fontSize: '0.7rem' }}>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="adm-detail-sec">
                            <label>CONTACT</label>
                            <div className="adm-info-card">
                                <div><Globe size={14} /> {user.phoneNumber || 'No phone'}</div>
                                <div><MapPin size={14} /> {user.address || 'No address'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="adm-modal-footer">
                    <button className="adm-pill active" onClick={onClose}>Close Profile</button>
                </div>
            </div>
        </div>
    );
};

/* ── MAIN ADMIN DASHBOARD ────────────────────────────────── */

const AdminDashboard = () => {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewingBooking, setIsViewingBooking] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isViewingUser, setIsViewingUser] = useState(false);

    // Active Data States
    const [pendingKyc, setPendingKyc] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [fleet, setFleet] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [members, setMembers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalVehicles: 0,
        totalBookings: 0,
        pendingKyc: 0
    });

    // Form States
    const [newVehicle, setNewVehicle] = useState({
        name: '', brand: '', model: '', pricePerDay: '', regNo: '', type: 'Luxury Car', description: ''
    });
    const [vehicleImages, setVehicleImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const [newMember, setNewMember] = useState({
        username: '', email: '', password: '', role: 'rider', phoneNumber: '', address: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [kycRes, usersRes, fleetRes, bookingsRes, membersRes, statsRes, notiRes] = await Promise.all([
                adminService.getPendingKyc(),
                adminService.getAllUsers(),
                adminService.getAllVehicles(),
                adminService.getAllBookings(),
                adminService.getMembers(),
                adminService.getStats(),
                notificationService.getAll()
            ]);
            setPendingKyc(kycRes || []);
            setAllUsers(usersRes || []);
            setFleet(fleetRes || []);
            setBookings(bookingsRes || []);
            setMembers(membersRes || []);
            setNotifications(notiRes || []);
            if (statsRes) setStats(statsRes);
        } catch (err) {
            console.error("Failed to fetch admin data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setVehicleImages(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const handlePublishVehicle = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            let imageUrls = [];
            if (vehicleImages.length > 0) {
                const formData = new FormData();
                vehicleImages.forEach(img => formData.append('images', img));
                const uploadRes = await adminService.uploadImages(formData);
                imageUrls = uploadRes.imageUrls;
            }
            await adminService.createVehicle({ ...newVehicle, images: imageUrls });
            setIsAddingVehicle(false);
            setNewVehicle({ name: '', brand: '', model: '', pricePerDay: '', regNo: '', type: 'Luxury Car', description: '' });
            setVehicleImages([]);
            setImagePreviews([]);
            fetchInitialData();
        } catch (err) {
            console.error("Failed to list vehicle:", err);
            alert("Failed to list vehicle. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await adminService.addMember(newMember);
            setIsAddingMember(false);
            setNewMember({ username: '', email: '', password: '', role: 'rider', phoneNumber: '', address: '' });
            fetchInitialData();
        } catch (err) {
            console.error("Failed to add member:", err);
            alert("Failed to add member. Email might already be in use.");
        } finally {
            setLoading(false);
        }
    };

    const handleBookingStatus = async (id, status) => {
        try {
            await adminService.updateBookingStatus(id, { status });
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    const handleMarkNotiRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) { console.error(err); }
    };

    const handleMarkAllNotiRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) { console.error(err); }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploadingAvatar(true);
            const formData = new FormData();
            formData.append('images', file);
            const uploadRes = await adminService.uploadImages(formData);
            const profileImageUrl = uploadRes.imageUrls[0];

            const updatedUser = await userService.updateProfile({ profileImage: profileImageUrl });
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            console.error("Avatar upload failed:", err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleLogout = () => {
        logout && logout();
        navigate('/login');
    };

    const totalRevenue = bookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const STAT_CARDS = [
        { label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, change: '+14.9%', positive: true, subtext: 'paid only', icon: <Wallet size={22} />, color: '#10b981' },
        { label: 'Total Customers', value: stats.totalUsers || 0, change: '+5.1%', positive: true, subtext: 'active users', icon: <Users size={22} />, color: '#f43f5e' },
        { label: 'Total Bookings', value: stats.totalBookings || 0, change: '+25.4%', positive: true, subtext: 'all time', icon: <TrendingUp size={22} />, color: '#10b981' },
        { label: 'Fleet Size', value: stats.totalVehicles || 0, change: '+12.4%', positive: true, subtext: 'vehicles', icon: <Car size={22} />, color: '#f59e0b' },
    ];

    const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;

    const sidebarItems = [
        { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'ridemanagement', label: 'Bookings', icon: <Calendar size={20} />, badge: pendingBookingsCount > 0 ? pendingBookingsCount : null },
        { id: 'users', label: 'Customers', icon: <Users size={20} /> },
        { id: 'fleet', label: 'Fleet', icon: <Car size={20} /> },
        { id: 'members', label: 'Members', icon: <Globe size={20} /> },
        { id: 'payments', label: 'Payments', icon: <Wallet size={20} /> },
        { id: 'verifications', label: 'KYC Requests', icon: <ShieldCheck size={20} />, badge: pendingKyc.length > 0 ? pendingKyc.length : null },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    if (loading) return (
        <div style={{ background: '#020617', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div className="adm-loader-spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: 20, opacity: 0.6 }}>Loading Dashboard...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="adm-wrapper">
            <style>{`
                :root {
                    --adm-primary: #f59e0b;
                    --adm-dark: #020617;
                    --adm-bg: #0a0b14;
                    --adm-card: rgba(255,255,255,0.03);
                    --adm-border: rgba(255,255,255,0.08);
                    --adm-text: #f8fafc;
                    --adm-muted: #94a3b8;
                }
                .adm-wrapper { background: var(--adm-bg); color: var(--adm-text); min-height: 100vh; display: flex; font-family: 'Inter', sans-serif; }
                .adm-sidebar { width: 260px; background: var(--adm-dark); border-right: 1px solid var(--adm-border); display: flex; flex-direction: column; padding: 20px; position: fixed; height: 100vh; z-index: 100; }
                .adm-logo { height: 60px; object-fit: contain; margin-bottom: 30px; }
                .adm-sidebar-label { font-size: 0.7rem; color: var(--adm-muted); letter-spacing: 1px; margin: 20px 0 10px 10px; font-weight: 700; }
                .adm-nav-btn { display: flex; align-items: center; gap: 12px; padding: 12px 15px; border-radius: 12px; color: var(--adm-muted); border: none; background: transparent; cursor: pointer; transition: all 0.3s; width: 100%; text-align: left; }
                .adm-nav-btn:hover { background: rgba(255,255,255,0.03); color: #fff; }
                .adm-nav-btn.active { background: rgba(245,158,11,0.1); color: var(--adm-primary); font-weight: 600; }
                .adm-nav-badge { margin-left: auto; background: var(--adm-primary); color: #fff; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; }
                .adm-main { flex: 1; margin-left: 260px; background: var(--adm-bg); min-height: 100vh; display: flex; flex-direction: column; width: calc(100% - 260px); }
                .adm-topbar { height: 75px; border-bottom: 1px solid var(--adm-border); padding: 0 40px; display: flex; align-items: center; justify-content: space-between; background: rgba(2,6,23,0.8); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 90; }
                .adm-search-box { background: rgba(255,255,255,0.04); border: 1px solid var(--adm-border); border-radius: 12px; padding: 0 15px; display: flex; align-items: center; gap: 10px; width: 300px; }
                .adm-search-box input { background: transparent; border: none; color: #fff; padding: 10px 0; outline: none; width: 100%; font-size: 0.9rem; }
                .adm-content { padding: 40px; flex: 1; }
                .adm-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
                .adm-stat-card { background: var(--adm-card); border: 1px solid var(--adm-border); border-radius: 20px; padding: 25px; transition: transform 0.3s; }
                .adm-stat-card:hover { transform: translateY(-5px); background: rgba(255,255,255,0.05); }
                .stat-card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
                .stat-card-label { font-size: 0.85rem; color: var(--adm-muted); margin-bottom: 5px; }
                .stat-card-value { font-size: 1.8rem; font-weight: 800; margin-bottom: 10px; }
                .stat-card-footer { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; }
                .stat-change.up { color: #10b981; }
                .stat-change.down { color: #ef4444; }
                .adm-panel { background: var(--adm-card); border: 1px solid var(--adm-border); border-radius: 20px; overflow: hidden; margin-bottom: 24px; }
                .adm-card-header { padding: 25px; border-bottom: 1px solid var(--adm-border); display: flex; justify-content: space-between; align-items: center; }
                .adm-table { width: 100%; border-collapse: collapse; text-align: left; }
                .adm-table th { padding: 15px 25px; font-size: 0.75rem; color: var(--adm-muted); text-transform: uppercase; border-bottom: 1px solid var(--adm-border); }
                .adm-table td { padding: 15px 25px; font-size: 0.9rem; border-bottom: 1px solid var(--adm-border); color: #e2e8f0; }
                .td-id { color: var(--adm-primary); font-family: monospace; font-weight: 600; }
                .adm-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }
                .status-dot-mini { width: 6px; height: 6px; border-radius: 50%; }
                .adm-action-btns { display: flex; gap: 8px; }
                .adm-act-btn { padding: 6px 12px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--adm-border); color: #fff; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 0.8rem; transition: all 0.2s; }
                .adm-act-btn:hover { background: rgba(255,255,255,0.1); }
                .adm-act-btn.green:hover { background: rgba(16,185,129,0.2); border-color: #10b981; color: #10b981; }
                .adm-act-btn.red:hover { background: rgba(239,68,68,0.2); border-color: #ef4444; color: #ef4444; }
                .adm-role-tag { padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 700; background: rgba(255,255,255,0.1); color: #fff; }
                .adm-user-cell { display: flex; align-items: center; gap: 12px; }
                .adm-user-mini-av { width: 34px; height: 34px; border-radius: 50%; background: var(--adm-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
                .adm-user-name { font-weight: 600; }
                .adm-user-email { font-size: 0.75rem; color: var(--adm-muted); }
                .adm-calendar-wrap { flex: 1; background: var(--adm-card); border: 1px solid var(--adm-border); border-radius: 20px; padding: 25px; }
                .adm-calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .adm-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
                .cal-day-label { text-align: center; font-size: 0.7rem; color: var(--adm-muted); padding-bottom: 10px; }
                .cal-cell { aspect-ratio: 1; border-radius: 8px; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; position: relative; cursor: pointer; }
                .cal-cell.current { color: #fff; }
                .cal-cell.faded { opacity: 0.2; }
                .cal-cell.today { border: 2px solid var(--adm-primary); }
                .cal-low { background: rgba(245,158,11,0.1); } .cal-mid { background: rgba(245,158,11,0.3); } .cal-high { background: rgba(245,158,11,0.55); } .cal-max { background: rgba(245,158,11,0.85); }
                .adm-mid-row { display: flex; gap: 24px; margin-bottom: 40px; }
                .adm-top-vehicles { width: 350px; background: var(--adm-card); border: 1px solid var(--adm-border); border-radius: 20px; padding: 25px; }
                .adm-vehicle-item { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
                .adm-vehicle-thumb { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; }
                .adm-pill { padding: 8px 16px; border-radius: 10px; border: 1px solid var(--adm-border); background: rgba(255,255,255,0.04); color: var(--adm-muted); cursor: pointer; font-size: 0.8rem; }
                .adm-pill.active { background: var(--adm-primary); color: #fff; border-color: var(--adm-primary); }
                
                /* Modal Styles */
                .adm-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
                .adm-detail-modal { background: var(--adm-dark); border: 1px solid var(--adm-border); border-radius: 24px; width: 100%; max-width: 650px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
                .adm-modal-header { padding: 25px; border-bottom: 1px solid var(--adm-border); display: flex; justify-content: space-between; align-items: center; }
                .adm-modal-header h2 { font-size: 1.25rem; font-weight: 700; color: #fff; }
                .adm-close-btn { background: transparent; border: none; color: var(--adm-muted); cursor: pointer; transition: color 0.2s; }
                .adm-close-btn:hover { color: #fff; }
                .adm-modal-body { padding: 30px; }
                .adm-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .adm-detail-sec { display: flex; flex-direction: column; gap: 10px; }
                .adm-detail-sec label { font-size: 0.65rem; font-weight: 700; color: var(--adm-muted); letter-spacing: 1px; }
                .adm-info-card { background: rgba(255,255,255,0.03); border: 1px solid var(--adm-border); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 5px; }
                .adm-info-card strong { color: #fff; font-size: 0.95rem; }
                .adm-info-card span { color: var(--adm-muted); font-size: 0.8rem; }
                .adm-info-card div { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #e2e8f0; }
                .adm-modal-footer { padding: 20px 30px; border-top: 1px solid var(--adm-border); display: flex; justify-content: flex-end; background: rgba(255,255,255,0.01); }
                .spin { animation: spin 1s linear infinite; }

                /* Notification Dropdown styles */
                .adm-noti-dropdown { position: absolute; top: 100%; right: 0; margin-top: 15px; width: 350px; background: #0f172a; border: 1px solid var(--adm-border); border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); z-index: 200; overflow: hidden; }
                .adm-noti-header { padding: 15px 20px; border-bottom: 1px solid var(--adm-border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); }
                .adm-noti-header h4 { font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 10px; }
                .unread-badge { background: #ef4444; color: #fff; font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }
                .adm-noti-header button { background: transparent; border: none; color: var(--adm-primary); font-size: 0.75rem; cursor: pointer; }
                .adm-noti-list { max-height: 400px; overflow-y: auto; }
                .adm-noti-item { padding: 15px 20px; border-bottom: 1px solid var(--adm-border); cursor: pointer; display: flex; gap: 12px; transition: background 0.2s; position: relative; }
                .adm-noti-item:hover { background: rgba(255,255,255,0.03); }
                .adm-noti-item.unread { background: rgba(239, 68, 68, 0.05); }
                .adm-noti-item.unread::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #ef4444; }
                .noti-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .noti-icon.info { background: rgba(59,130,246,0.1); color: #3b82f6; }
                .noti-icon.success { background: rgba(16,185,129,0.1); color: #10b981; }
                .noti-icon.warning { background: rgba(245,158,11,0.1); color: #f59e0b; }
                .noti-icon.error { background: rgba(239,68,68,0.1); color: #ef4444; }
                .noti-content { flex: 1; }
                .noti-title { font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; color: #fff; }
                .noti-msg { font-size: 0.75rem; color: var(--adm-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .noti-time { font-size: 0.65rem; color: var(--adm-muted); margin-top: 8px; }
                .adm-noti-empty { padding: 40px 20px; text-align: center; color: var(--adm-muted); font-size: 0.85rem; }
            `}</style>

            <aside className="adm-sidebar">
                <div className="adm-sidebar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src={logoImg} alt="YatraHub" className="adm-logo" />
                </div>
                <div className="adm-sidebar-label">GENERAL</div>
                <nav className="adm-sidebar-nav">
                    {sidebarItems.slice(0, 5).map(item => (
                        <button key={item.id} className={`adm-nav-btn ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                            {item.icon} <span>{item.label}</span>
                            {item.badge && <span className="adm-nav-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>
                <div className="adm-sidebar-label">ACCOUNT</div>
                <nav className="adm-sidebar-nav">
                    {sidebarItems.slice(5).map(item => (
                        <button key={item.id} className={`adm-nav-btn ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                            {item.icon} <span>{item.label}</span>
                            {item.badge && <span className="adm-nav-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>
                <div className="adm-sidebar-footer" style={{ marginTop: 'auto' }}>
                    <button className="adm-logout-btn adm-nav-btn" onClick={handleLogout} style={{ color: '#ef4444' }}>
                        <LogOut size={18} /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="adm-main">
                <header className="adm-topbar">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link to="/" style={{ marginRight: 20, color: 'var(--adm-muted)', transition: 'color 0.3s' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        <div className="adm-search-box">
                            <Search size={18} color="#94a3b8" />
                            <input type="text" placeholder="Search data..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </div>
                    <div className="adm-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ position: 'relative' }}>
                            <button className="adm-act-btn" onClick={() => setShowNotifications(!showNotifications)} onMouseDown={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                                <Bell size={20} />
                                {notifications.filter(n => !n.isRead).length > 0 && (
                                    <span style={{ 
                                        position: 'absolute', 
                                        top: '-5px', 
                                        right: '-5px', 
                                        background: '#ef4444', 
                                        color: '#fff', 
                                        fontSize: '10px', 
                                        fontWeight: 'bold', 
                                        borderRadius: '50%', 
                                        width: '18px', 
                                        height: '18px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                                        border: '2px solid var(--adm-dark)',
                                        zIndex: 10
                                    }}>
                                        {notifications.filter(n => !n.isRead).length}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <NotificationDropdown
                                    notifications={notifications}
                                    onMarkRead={handleMarkNotiRead}
                                    onMarkAllRead={handleMarkAllNotiRead}
                                    onClose={() => setShowNotifications(false)}
                                />
                            )}
                        </div>
                        <div className="adm-profile-chip" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: 50, position: 'relative' }}>
                            <div className="adm-user-mini-av" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('admin-avatar-input').click()}>
                                {uploadingAvatar ? <Loader2 size={12} className="spin" /> : (
                                    user?.profileImage ? (
                                        <>
                                            <img
                                                src={getImageUrl(user.profileImage)}
                                                alt=""
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                            />
                                            <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>{user?.username?.[0] || 'A'}</div>
                                        </>
                                    ) : user?.username?.[0] || 'A'
                                )}
                                <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--adm-primary)', borderRadius: '50%', padding: 2, display: 'flex' }}>
                                    <Camera size={10} color="#fff" />
                                </div>
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.username || 'Admin'}</span>
                            <input type="file" id="admin-avatar-input" hidden accept="image/*" onChange={handleAvatarUpload} />
                        </div>
                    </div>
                </header>

                <div className="adm-content">
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                                <div><h1 style={{ fontSize: '2rem', marginBottom: 5 }}>Command Center</h1><p style={{ color: 'var(--adm-muted)' }}>Real-time platform overview and system health</p></div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><button className="adm-pill active">This Month</button><button className="adm-pill">Custom Range</button></div>
                            </div>

                            <div className="adm-stats-row">
                                {STAT_CARDS.map((card, i) => (
                                    <div key={i} className="adm-stat-card">
                                        <div className="stat-card-icon" style={{ color: card.color, background: card.color + '15' }}>{card.icon}</div>
                                        <p className="stat-card-label">{card.label}</p>
                                        <h2 className="stat-card-value">{card.value}</h2>
                                        <div className="stat-card-footer">
                                            <span className={`stat-change ${card.positive ? 'up' : 'down'}`}>{card.positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {card.change}</span>
                                            <span style={{ color: 'var(--adm-muted)' }}>{card.subtext}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="adm-mid-row">
                                <RentalCalendar bookings={bookings} />
                                <div className="adm-card" style={{ flex: 1 }}>
                                    <div className="adm-card-header">
                                        <h3><Clock size={18} /> Pending Approvals</h3>
                                        {pendingBookingsCount > 0 && <span className="adm-nav-badge">{pendingBookingsCount} New</span>}
                                    </div>
                                    <div className="adm-request-list" style={{ padding: '0 20px 20px' }}>
                                        {bookings.filter(b => b.status === 'pending').length > 0 ? (
                                            bookings.filter(b => b.status === 'pending').map(b => (
                                                <div key={b.id} className="adm-request-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid var(--adm-border)' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.vehicle?.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{b.seeker?.username} • {new Date(b.startDate).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="adm-action-btns">
                                                        <button className="adm-act-btn green" onClick={() => handleBookingStatus(b.id, 'confirmed')}><Check size={14} /></button>
                                                        <button className="adm-act-btn red" onClick={() => handleBookingStatus(b.id, 'cancelled')}><X size={14} /></button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--adm-muted)' }}>
                                                <CheckCircle2 size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
                                                <p>All queue lines clear!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="adm-top-vehicles">
                                    <div className="adm-card-header" style={{ padding: 0, border: 0, marginBottom: 20 }}><h3>Top Performers</h3></div>
                                    {DEMO_TOP_VEHICLES.map((v, i) => (
                                        <div key={i} className="adm-vehicle-item">
                                            <img src={getImageUrl(v.img)} alt="" className="adm-vehicle-thumb" />
                                            <div style={{ flex: 1 }}><strong>{v.name}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Veh-ID: {v.id.slice(-6)}</span></div>
                                            <div style={{ textAlign: 'right' }}><strong>{v.bookings}</strong><br /><span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Bookings</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="adm-panel">
                                <div className="adm-card-header"><h3>Live Transactions</h3><button className="adm-act-btn" onClick={() => setActiveTab('ridemanagement')}>View All</button></div>
                                <table className="adm-table">
                                    <thead><tr><th>Ref ID</th><th>Customer</th><th>Vehicle</th><th>Type</th><th>Date</th><th>Status</th><th>Payment</th><th>Net</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {bookings.slice(0, 5).map(b => (
                                            <tr key={b.id}>
                                                <td className="td-id">#{b.id?.slice(0, 8) || 'N/A'}</td>
                                                <td>{b.seeker?.username || 'Guest'}</td>
                                                <td>{b.vehicle?.name || 'V-Item'}</td>
                                                <td><span className="adm-role-tag" style={{ background: b.type === 'Ride' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: b.type === 'Ride' ? '#3b82f6' : '#f59e0b' }}>{b.type || 'Rent'}</span></td>
                                                <td>{b.startDate ? new Date(b.startDate).toLocaleDateString() : 'N/A'}</td>
                                                <td><StatusBadge status={b.status} /></td>
                                                <td><StatusBadge status={b.paymentStatus || 'unpaid'} /></td>
                                                <td>Rs. {Number(b.totalAmount || 0).toLocaleString()}</td>
                                                <td>
                                                    <div className="adm-action-btns">
                                                        {(b.status === 'pending' || b.status === 'cancelled') && (
                                                            <button className="adm-act-btn green" onClick={() => handleBookingStatus(b.id, 'confirmed')}>
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                        {(b.status === 'pending' || b.status === 'confirmed') && (
                                                            <button className="adm-act-btn red" onClick={() => handleBookingStatus(b.id, 'cancelled')}>
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                        <button className="adm-act-btn" onClick={() => { setSelectedBooking(b); setIsViewingBooking(true); }}>
                                                            <Eye size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === 'ridemanagement' && (
                        <div className="adm-panel">
                            <div className="adm-card-header"><h3>Bookings Ledger</h3></div>
                            <table className="adm-table">
                                <thead><tr><th>ID</th><th>User</th><th>Vehicle</th><th>Type</th><th>Timeline</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {bookings.map(b => (
                                        <tr key={b.id}>
                                            <td className="td-id">#{b.id?.slice(0, 8) || 'N/A'}</td>
                                            <td>{b.seeker?.username || 'N/A'}</td>
                                            <td>{b.vehicle?.name || 'N/A'}</td>
                                            <td><span className="adm-role-tag" style={{ background: b.type === 'Ride' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: b.type === 'Ride' ? '#3b82f6' : '#f59e0b' }}>{b.type || 'Rent'}</span></td>
                                            <td>{b.startDate ? new Date(b.startDate).toLocaleDateString() : '-'}</td>
                                            <td><StatusBadge status={b.status} /></td>
                                            <td><StatusBadge status={b.paymentStatus || 'unpaid'} /></td>
                                            <td><div className="adm-action-btns">
                                                {(b.status === 'pending' || b.status === 'cancelled') && <button className="adm-act-btn green" onClick={() => handleBookingStatus(b.id, 'confirmed')}><Check size={14} /></button>}
                                                {(b.status === 'pending' || b.status === 'confirmed') && (
                                                    <button className="adm-act-btn red" onClick={() => handleBookingStatus(b.id, 'cancelled')}>
                                                        <X size={14} />
                                                    </button>
                                                )}
                                                <button className="adm-act-btn" onClick={() => { setSelectedBooking(b); setIsViewingBooking(true); }}><Eye size={14} /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="adm-panel">
                            <div className="adm-card-header"><h3>Customer Directory</h3></div>
                            <table className="adm-table">
                                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>KYC</th><th>Joined</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {allUsers.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="adm-user-cell">
                                                    <div className="adm-user-mini-av" style={{ overflow: 'hidden' }}>
                                                        {u.profileImage ? (
                                                            <img src={getImageUrl(u.profileImage)} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : u.username?.[0] || 'U'}
                                                    </div>
                                                    <strong>{u.username}</strong>
                                                </div>
                                            </td>
                                            <td>{u.email}</td>
                                            <td><span className="adm-role-tag">{u.role}</span></td>
                                            <td><StatusBadge status={u.kycStatus || 'none'} /></td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td><button className="adm-act-btn" onClick={() => { setSelectedUser(u); setIsViewingUser(true); }}><Eye size={14} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'verifications' && (
                        <div className="adm-panel">
                            <div className="adm-card-header">
                                <h3><ShieldCheck size={18} /> KYC Verification Requests</h3>
                                {pendingKyc.length > 0 && <span className="adm-nav-badge">{pendingKyc.length} Pending</span>}
                            </div>

                            {pendingKyc.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--adm-muted)' }}>
                                    <ShieldCheck size={48} style={{ opacity: 0.2, marginBottom: 15 }} />
                                    <h3 style={{ marginBottom: 8 }}>All Clear!</h3>
                                    <p>No pending KYC submissions at the moment.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 0 20px' }}>
                                    {pendingKyc.map(req => (
                                        <div key={req.id} style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: 20,
                                            padding: 30,
                                            display: 'flex',
                                            gap: 30,
                                            alignItems: 'flex-start',
                                            flexWrap: 'wrap'
                                        }}>
                                            {/* Avatar + Identity */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 15, minWidth: 220 }}>
                                                <div className="adm-user-mini-av" style={{ width: 52, height: 52, fontSize: '1.2rem', flexShrink: 0 }}>
                                                    {req.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>{req.username}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{req.email}</div>
                                                    <div style={{ marginTop: 6 }}><StatusBadge status={req.kycStatus || 'pending'} /></div>
                                                </div>
                                            </div>

                                            {/* KYC Details */}
                                            <div style={{ flex: 1, minWidth: 220 }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', fontWeight: 700, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>Submission Details</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Full Name</div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.kycData?.fullName || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Document Type</div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.kycData?.idType || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>ID Number</div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'monospace' }}>{req.kycData?.idNumber || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Submitted</div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                            {req.kycData?.submittedAt ? new Date(req.kycData.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Documents */}
                                            <div style={{ minWidth: 180 }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', fontWeight: 700, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>Documents ({req.kycData?.documents?.length || 0})</div>
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    {(req.kycData?.documents || []).map((docUrl, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={getImageUrl(docUrl)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                gap: 5,
                                                                background: 'rgba(245,158,11,0.08)',
                                                                border: '1px solid rgba(245,158,11,0.2)',
                                                                borderRadius: 10,
                                                                padding: '8px 14px',
                                                                textDecoration: 'none',
                                                                color: '#f59e0b',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <Eye size={16} />
                                                            Doc {idx + 1}
                                                        </a>
                                                    ))}
                                                    {(!req.kycData?.documents || req.kycData.documents.length === 0) && (
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>No documents</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 }}>
                                                <button
                                                    onClick={() => handleKycAction(req.id, 'verified')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                                        color: '#10b981', padding: '10px 20px', borderRadius: 12,
                                                        cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleKycAction(req.id, 'rejected')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                                                        color: '#ef4444', padding: '10px 20px', borderRadius: 12,
                                                        cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {(activeTab === 'fleet' || activeTab === 'members' || activeTab === 'payments' || activeTab === 'settings') && (
                        <div style={{ padding: 60, textAlign: 'center', background: 'var(--adm-card)', borderRadius: 20, border: '1px dashed var(--adm-border)' }}>
                            <Box size={48} style={{ opacity: 0.2, marginBottom: 15 }} />
                            <h3>Tab Content Loaded</h3>
                            <p style={{ color: 'var(--adm-muted)' }}>Detailed content for {activeTab} is ready. Data fetched: {fleet.length || members.length || 0} items.</p>
                            <button className="adm-pill active" style={{ marginTop: 20 }} onClick={() => setActiveTab('overview')}>Back to Dashboard</button>
                        </div>
                    )}

                </div>

                <BookingDetailModal
                    isOpen={isViewingBooking}
                    booking={selectedBooking}
                    onClose={() => setIsViewingBooking(false)}
                />
                <UserDetailModal
                    isOpen={isViewingUser}
                    user={selectedUser}
                    onClose={() => setIsViewingUser(false)}
                />
            </main >
        </div >
    );
};

export default AdminDashboard;
