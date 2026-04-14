import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Search, Car, ChevronDown, Navigation, Clock, User, Shield, Headphones, Zap, Award, ChevronLeft, ChevronRight, CheckCircle, Star, Heart, Mail, HelpCircle, Phone, TrendingUp, LogOut, LayoutDashboard, Settings, X, MoreVertical, MessageSquare, Bell } from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

import { vehicleService, getImageUrl, notificationService } from '../services/api';
import BookingModal from '../components/BookingModal';
import LiveMap from '../components/LiveMap';
import ReviewModal from '../components/ReviewModal';
import NotificationDropdown from '../components/NotificationDropdown';
import heroVideo from '../assets/Hero.mp4';
import herosecImg from '../assets/herosec.jpeg';
import bannerImg from '../assets/banner.jpg';
import logoImg from '../assets/logo.png';
import scorpioImg from '../assets/scorpio.jpg';
import toyotaImg from '../assets/toyota.jpg';
import bulletImg from '../assets/bullet.jpg';
import nsImg from '../assets/ns.jpg';
import dioImg from '../assets/dio.jpg';

const VEHICLE_ASSETS = {
    'Mahindra Scorpio S11': scorpioImg,
    'Toyota Hilux Adventure': toyotaImg,
    'Royal Enfield 350': bulletImg,
    'Bajaj Pulsar NS200': nsImg,
    'Honda Dio': dioImg
};

const DEFAULT_VEHICLES = [
    {
        id: 'default-scorpio',
        name: 'Mahindra Scorpio S11',
        type: 'SUV/off-roading',
        category: 'SUV/Off-Roading',
        brand: 'Mahindra',
        pricePerDay: 12000,
        images: [scorpioImg],
        features: ['5 Seats', '4x4', 'Verified'],
        owner: { username: 'ElitePartner' },
        location: 'Kathmandu',
        description: 'Premium off-road SUV for all Nepal terrain.'
    },
    {
        id: 'default-hilux',
        name: 'Toyota Hilux Adventure',
        type: 'Car',
        category: 'Car',
        brand: 'Toyota',
        pricePerDay: 14000,
        images: [toyotaImg],
        features: ['4 Seats', 'Comfort', 'Verified'],
        owner: { username: 'ElitePartner' },
        location: 'Pokhara',
        description: 'Luxury pickup built for long journeys and rugged roads.'
    },
    {
        id: 'default-enfield',
        name: 'Royal Enfield 350',
        type: 'Bike',
        category: 'Bike',
        brand: 'Royal Enfield',
        pricePerDay: 4000,
        images: [bulletImg],
        features: ['2 Seats', 'Classic', 'Verified'],
        owner: { username: 'ElitePartner' },
        location: 'Kathmandu',
        description: 'Classic motorcycle experience for city and mountain rides.'
    },
    {
        id: 'default-ns',
        name: 'Bajaj Pulsar NS200',
        type: 'Bike',
        category: 'Bike',
        brand: 'Bajaj',
        pricePerDay: 3200,
        images: [nsImg],
        features: ['2 Seats', 'Sporty', 'Verified'],
        owner: { username: 'ElitePartner' },
        location: 'Lalitpur',
        description: 'Sporty bike perfect for fast rides and short trips.'
    },
    {
        id: 'default-dio',
        name: 'Honda Dio',
        type: 'Scooter',
        category: 'Scooter',
        brand: 'Honda',
        pricePerDay: 2200,
        images: [dioImg],
        features: ['2 Seats', 'Easy', 'Verified'],
        owner: { username: 'ElitePartner' },
        location: 'Baneshwor',
        description: 'Comfortable city scooter for quick and efficient travel.'
    }
];

function Home() {
    const { user, logout } = useAuth();
    const { unreadCount, socket, unreadNotiCount } = useSocket();
    const navigate = useNavigate();

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const profileRef = useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            // Close vehicle card menu if click outside
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [searchMode, setSearchMode] = useState('rent');
    const scrollRef = useRef(null);
    const [mapConfig, setMapConfig] = useState({ isOpen: false, target: null, title: '' });
    const [vehicles, setVehicles] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [activeType, setActiveType] = useState('All');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [modalMode, setModalMode] = useState('reserve');
    const [locations, setLocations] = useState({
        rent: 'Kathmandu',
        bookFrom: '',
        bookTo: ''
    });
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
    const [openMenuId, setOpenMenuId] = useState(null); // track which card menu is open
    const menuRef = useRef(null);
    const [selectedVehicleForReview, setSelectedVehicleForReview] = useState(null);

    const fetchVehicles = async (filters = {}) => {
        setLoadingVehicles(true);
        try {
            const data = await vehicleService.getAll(filters);
            if (Array.isArray(data) && data.length > 0) {
                setVehicles(data);
            } else {
                setVehicles(DEFAULT_VEHICLES);
            }
        } catch (error) {
            console.error("Failed to fetch vehicles:", error);
            setVehicles(DEFAULT_VEHICLES);
        } finally {
            setLoadingVehicles(false);
        }
    };

    React.useEffect(() => {
        fetchVehicles();
    }, [user]);

    const handleSearch = () => {
        const filters = {
            location: searchMode === 'rent' ? locations.rent : locations.bookFrom,
            type: activeType !== 'All' ? activeType : undefined
        };
        fetchVehicles(filters);
        document.querySelector('.fleet-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const openSearchOverlay = () => {
        setSearchOpen(true);
        setSearchQuery('');
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const closeSearchOverlay = () => {
        setSearchOpen(false);
        setSearchQuery('');
    };

    const isVehicleVisible = (v) => {
        // Allow seeded vehicles even if owned by ElitePartner
        // if (v.owner?.username?.toLowerCase() === 'elitepartner') return false;

        if (activeType !== 'All') {
            const type = (v.type || v.category || '').toLowerCase();
            const active = activeType.toLowerCase();
            if (active === 'car') return ['car', 'sedan'].includes(type);
            if (active === 'suv/off-roading') return ['suv', 'suv/off-roading'].includes(type);
            if (active === 'bike') return ['bike', 'motorcycle'].includes(type);
            if (active === 'scooter') return ['scooter', 'moped'].includes(type);
            if (active === 'luxury') return ['luxury', 'elite', 'premium', 'luxury vehicle'].includes(type);
            return type === active;
        }

        const img = v.images && (Array.isArray(v.images) ? v.images[0] : v.images);
        const fallbackSrc = VEHICLE_ASSETS[v.name];
        if (!img && !fallbackSrc) return false;
        if (!img) return true;
        if (typeof img !== 'string') return true;
        if (img.startsWith('http') || img.startsWith('blob:') || img.startsWith('data:')) return true;
        if (img.startsWith('/uploads/') || img.startsWith('/src/')) return true;
        return img.length > 5;
    };

    // Search results come from vehicles state (already includes static + DB)
    const searchResults = searchQuery.trim().length > 0
        ? vehicles
            .filter(v => v.owner?.username?.toLowerCase() !== 'elitepartner')
            .filter(v => v.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    const visibleFleetVehicles = vehicles.filter(isVehicleVisible);

    const openMap = (target, title) => {
        setMapConfig({ isOpen: true, target, title });
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleLocationSelect = (data) => {
        const { address } = data;
        setLocations(prev => ({
            ...prev,
            [mapConfig.target]: address
        }));
    };

    const openVehicleModal = (v, mode) => {
        setModalMode(mode);
        setSelectedVehicle(v);
    };

    return (
        <div id="home" className="main-wrapper">
            <div className="hero-container">

                {/* 1. Cinematic Background */}
                <div className="hero-bg-media" style={{ background: `url(${herosecImg}) no-repeat center center`, backgroundSize: 'cover' }}>
                    <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, rgba(2, 6, 23, 0.8) 0%, rgba(2, 6, 23, 0.2) 50%, rgba(2, 6, 23, 0.6) 100%)',
                        zIndex: '0'
                    }}></div>
                </div>

                {/* 2. Premium Refined Navbar */}
                <nav className="nav-bar">
                    <div className="nav-brand-logo">
                        <img src={logoImg} alt="YatraHub Logo" className="nav-logo-img" />
                    </div>

                    <ul className="nav-menu">
                        <li className="nav-item">
                            <a href="#home" className="nav-link-item">Home</a>
                        </li>

                        <li className="nav-item">
                            <div className="nav-link-item">Rent <ChevronDown size={14} /></div>
                            <div className="dropdown-menu">
                                <Link to="/fleet/cars" className="dropdown-item"><Car size={16} /> Car</Link>
                                <Link to="/fleet/bikes" className="dropdown-item"><Navigation size={16} style={{ transform: 'rotate(45deg)' }} /> Bike</Link>
                            </div>
                        </li>

                        <li className="nav-item">
                            <div className="nav-link-item">Book Ride <ChevronDown size={14} /></div>
                            <div className="dropdown-menu">
                                <Link to="/rides/cars" className="dropdown-item"><Car size={16} /> Car</Link>
                                <Link to="/rides/bikes" className="dropdown-item"><Navigation size={16} style={{ transform: 'rotate(45deg)' }} /> Bike</Link>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a href="#about" className="nav-link-item">About</a>
                        </li>

                        {user?.role === 'owner' && (
                            <li className="nav-item">
                                <Link to="/list-vehicle" className="nav-link-item" style={{ color: 'var(--primary)' }}>List Vehicle</Link>
                            </li>
                        )}
                    </ul>

                    <div className="nav-cta-wrapper">
                        {/* Search icon in Navbar */}
                        <button
                            className="nav-search-btn"
                            onClick={openSearchOverlay}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-light)',
                                marginRight: '10px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <Search size={20} />
                        </button>

                        {user && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    className="nav-search-btn"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'var(--text-light)',
                                        marginRight: '10px',
                                        transition: 'all 0.3s ease',
                                        position: 'relative'
                                    }}
                                >
                                    <Bell size={20} />
                                    {unreadNotiCount > 0 && (
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
                                            border: '2px solid #020617'
                                        }}>
                                            {unreadNotiCount}
                                        </span>
                                    )}
                                </button>
                                <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                            </div>
                        )}

                        {user && (
                            <Link
                                to="/messages"
                                className="nav-search-btn"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-light)',
                                    marginRight: '10px',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    textDecoration: 'none'
                                }}
                            >
                                <MessageSquare size={20} />
                                {unreadCount > 0 && (
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
                                        border: '2px solid #020617'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        )}


                        {user ? (
                            <div className="user-profile-wrapper" ref={profileRef} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                                <div className="premium-avatar-glow" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {user.profileImage ? (
                                        <img src={getImageUrl(user.profileImage)} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        user.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s ease' }} />

                                <AnimatePresence>
                                    {showProfileDropdown && (
                                        <motion.div
                                            className="profile-dropdown-elite"
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="dropdown-user-info" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
                                                <div className="mini-av-circle" style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #2dd4bf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', overflow: 'hidden', flexShrink: 0 }}>
                                                    {user.profileImage ? (
                                                        <img src={getImageUrl(user.profileImage)} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span className="u-name" style={{ fontWeight: 700, fontSize: '1rem' }}>{user.username}</span>
                                                    <span className="u-role" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role} Hub Member</span>
                                                </div>
                                            </div>

                                            <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="dropdown-link" onClick={() => setShowProfileDropdown(false)}>
                                                <LayoutDashboard size={18} />
                                                <span>My Dashboard</span>
                                            </Link>

                                            <Link to="/profile" className="dropdown-link" onClick={() => setShowProfileDropdown(false)}>
                                                <User size={18} />
                                                <span>Elite Profile</span>
                                            </Link>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                                                className="dropdown-link logout"
                                                style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'rgba(251, 113, 133, 0.05)' }}
                                            >
                                                <LogOut size={18} />
                                                <span>Sign Out Hub</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="login-link">Login</Link>
                                <Link to="/signup">
                                    <button className="btn-get-started">Get Started</button>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* 3. Left-Aligned Content */}
                <main className="hero-main-content">
                    <div className="hero-text-side">


                        <motion.h1
                            className="huge-title"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <span>Seamless Journeys,</span>
                            <span className="title-primary">Unlimited Freedom.</span>
                        </motion.h1>

                        <motion.p
                            className="hero-description"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            Discover the most efficient way to rent premium vehicles in Nepal.
                            From executive sedans to rugged SUVs, YatraHub puts you in the driver's seat.
                        </motion.p>

                        {/* 4. Integrated Booking Widget System */}
                        <motion.div
                            className="search-system-wrap"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            <div className="search-tabs">
                                <button
                                    className={`tab-btn ${searchMode === 'rent' ? 'active' : ''}`}
                                    onClick={() => setSearchMode('rent')}
                                >
                                    Rent a Vehicle
                                </button>
                                <button
                                    className={`tab-btn ${searchMode === 'book' ? 'active' : ''}`}
                                    onClick={() => setSearchMode('book')}
                                >
                                    Book a Ride
                                </button>
                            </div>

                            <div className="booking-widget">
                                <AnimatePresence mode="wait">
                                    {searchMode === 'rent' ? (
                                        <motion.div
                                            key="rent-panel"
                                            style={{ display: 'flex', flex: 1 }}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="booking-field" onClick={() => openMap('rent', 'Select Pickup City')}>
                                                <span className="field-head"><MapPin size={14} /> Location</span>
                                                <input
                                                    type="text"
                                                    className="field-control"
                                                    placeholder="Pickup City"
                                                    value={locations.rent}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="booking-field">
                                                <span className="field-head"><Calendar size={14} /> Pickup Date</span>
                                                <input type="date" className="field-control" />
                                            </div>

                                            <div className="booking-field">
                                                <span className="field-head">
                                                    <Car size={14} /> Vehicle
                                                    <ChevronDown size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                </span>
                                                <select className="field-control" style={{ colorScheme: 'dark' }} value={activeType} onChange={(e) => {
                                                    const val = e.target.value;
                                                    setActiveType(val);
                                                    fetchVehicles({ type: val !== 'All' ? val : undefined });
                                                    document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
                                                }}>
                                                    <option value="All">All Categories</option>
                                                    <option value="Car">Car</option>
                                                    <option value="SUV/off-roading">SUV/off-roading</option>
                                                    <option value="Bike">Bike</option>
                                                    <option value="Scooter">Scooter</option>
                                                    <option value="Luxury">Luxury Vehicle</option>
                                                </select>
                                            </div>

                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="book-panel"
                                            style={{ display: 'flex', flex: 1 }}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="booking-field" onClick={() => openMap('bookFrom', 'Select Pickup Location')}>
                                                <span className="field-head"><Navigation size={14} /> From</span>
                                                <input
                                                    type="text"
                                                    className="field-control"
                                                    placeholder="Pickup location"
                                                    value={locations.bookFrom}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="booking-field" onClick={() => openMap('bookTo', 'Select Destination')}>
                                                <span className="field-head"><MapPin size={14} /> To</span>
                                                <input
                                                    type="text"
                                                    className="field-control"
                                                    placeholder="Destination"
                                                    value={locations.bookTo}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="booking-field">
                                                <span className="field-head">
                                                    <Car size={14} /> Select Vehicle
                                                    <ChevronDown size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                </span>
                                                <select className="field-control" style={{ colorScheme: 'dark' }}>
                                                    <option>Car</option>
                                                    <option>SUV/off-roading</option>
                                                    <option>Bike</option>
                                                    <option>Scooter</option>
                                                    <option>Luxury Vehicle</option>
                                                </select>
                                            </div>

                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button className="search-submit-btn" onClick={openSearchOverlay}>
                                    <Search size={22} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </main>

                {/* 5. Subtle Info Footer */}
                <div className="hero-footer-stats">
                    <motion.div
                        className="stat-item"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <span className="stat-value">500+</span>
                        <span className="stat-label">Vehicles in Nepal</span>
                    </motion.div>
                    <motion.div
                        className="stat-item"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                    >
                        <span className="stat-value">4.9/5</span>
                        <span className="stat-label">User Trust</span>
                    </motion.div>
                </div>
            </div>

            {/* --- 6. Benefit Section (Owner & Seeker) --- */}
            <section className="benefit-section">
                {/* Top Features Bar */}
                <div className="benefit-features-bar">
                    <div className="feature-pill"><CheckCircle size={16} /> <span>Unlimited mileage</span></div>
                    <div className="feature-pill"><CheckCircle size={16} /> <span>Free 2nd pilot</span></div>
                    <div className="feature-pill"><CheckCircle size={16} /> <span>24/7 roadside assistance</span></div>
                    <div className="feature-pill"><CheckCircle size={16} /> <span>Pay later options</span></div>
                    <div className="feature-pill"><CheckCircle size={16} /> <span>Flexible cancellations</span></div>
                </div>

                {/* Google Review Widget */}
                <div className="review-widget-wrap">
                    <motion.div
                        className="google-trust-badge"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                    >
                        <div className="google-icon">G</div>
                        <div className="trust-info">
                            <div className="trust-score">4.9 <Star size={12} fill="currentColor" /> <Star size={12} fill="currentColor" /> <Star size={12} fill="currentColor" /> <Star size={12} fill="currentColor" /> <Star size={12} fill="currentColor" /></div>
                            <span className="review-count">25,482 Reviews</span>
                        </div>
                    </motion.div>
                </div>

                {/* Main Benefit Grid */}
                <div className="benefit-grid">
                    <motion.div
                        className="benefit-panel seeker-side"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="panel-media">
                            <img src="/src/assets/image.png" alt="Journey with Loved Ones" />
                        </div>
                        <div className="panel-content">
                            <h3>Journey with Loved Ones: Secure & Affordable</h3>
                            <p>Plan your perfect getaway across Nepal’s hills. Rent the most reliable SUVs and bikes at the <strong>lowest shared prices</strong>. Book now and stay flexible with our elite <strong>instant cancellation</strong> options!</p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="benefit-panel owner-side"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div className="panel-media">
                            <img src="/src/assets/image copy 2.png" alt="Fleet Owner" />
                            <div className="media-badge demand">IN HIGH DEMAND</div>
                        </div>
                        <div className="panel-content">
                            <h3>Turn Your Idle Fleet Into High Earnings!</h3>
                            <p>During the trek and festival seasons, vehicles in Kathmandu are in <strong>high demand</strong>. Secure your passive income now! List your fleet and earn <strong>15% more</strong> during peak months with YatraHub’s premium community reach.</p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="benefit-panel corporate-side"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="panel-media">
                            <img src="/src/assets/image copy 3.png" alt="Corporate Fleet" />
                            <div className="media-badge demand" style={{ background: '#3b82f6', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.4)' }}>CORPORATE ONLY</div>
                        </div>
                        <div className="panel-content">
                            <h3>Corporate & Event Fleet Solutions</h3>
                            <p>Need a fleet for a corporate retreat or a wedding event? YatraHub provides <strong>exclusive event rates</strong> and <strong>dedicated support</strong> for large-scale bookings across Nepal. Scale your logistics with us!</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- 6.25 Elite About Section --- */}
            <section id="about" className="premium-about-section">
                <div className="premium-about-container">
                    <motion.div
                        className="about-visual-side"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <img src="/src/assets/logo.png" alt="YatraHub Logo" className="about-logo-hero" />
                        <p className="about-tagline-text">"DRIVE YOUR DREAM TODAY"</p>
                    </motion.div>

                    <motion.div
                        className="about-info-side"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2>About YatraHub</h2>
                        <p className="main-desc">
                            Established with a passion for excellence, YatraHub has grown to become Nepal's most
                            trusted vehicle rental ecosystem. We specialize in both premium rentals and professional
                            ride management, offering exceptional value and elite service to our global travelers.
                        </p>

                        <div className="about-features-grid">
                            <div className="about-feature-item">
                                <div className="feature-icon-circle"><Shield size={22} /></div>
                                <div className="feature-details">
                                    <h4>Quality Assurance</h4>
                                    <p>All vehicles undergo rigorous 150-point elite performance inspections.</p>
                                </div>
                            </div>
                            <div className="about-feature-item">
                                <div className="feature-icon-circle"><Zap size={22} /></div>
                                <div className="feature-details">
                                    <h4>Best Prices</h4>
                                    <p>Competitive local pricing with our signature premium match guarantee.</p>
                                </div>
                            </div>
                            <div className="about-feature-item">
                                <div className="feature-icon-circle"><Award size={22} /></div>
                                <div className="feature-details">
                                    <h4>Elite Warranty</h4>
                                    <p>Comprehensive insurance and flexible maintenance options available.</p>
                                </div>
                            </div>
                            <div className="about-feature-item">
                                <div className="feature-icon-circle"><Headphones size={22} /></div>
                                <div className="feature-details">
                                    <h4>24/7 Support</h4>
                                    <p>Dedicated luxury concierge team always available for your journey.</p>
                                </div>
                            </div>
                        </div>

                        <div className="about-metrics-row" style={{ display: 'flex', gap: '30px', marginTop: '40px' }}>
                            <div className="mission-vision-wrapper" style={{ flex: 1 }}>
                                <h4><TrendingUp size={20} color="#e11d48" /> Our Mission</h4>
                                <p>To provide travelers with the highest quality vehicles in Nepal at the most competitive rates, backed by exceptional customer service.</p>
                            </div>
                            <div className="mission-vision-wrapper" style={{ flex: 1, borderLeft: '4px solid var(--primary)' }}>
                                <h4><Star size={20} color="var(--primary)" /> Our Vision</h4>
                                <p>To become the leading digital gateway for mobility in the Himalayas, ensuring every journey is as seamless as the scenery.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- 6.5 Support Banner --- */}
            <div className="support-banner-container">
                <motion.div
                    className="support-banner-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="support-visual">
                        <img src="/src/assets/cs.jpg" alt="Customer Support" className="support-img" />
                    </div>

                    <div className="support-content">
                        <p className="support-intro">Do you need help or have any questions?</p>
                        <h4 className="support-main-text">Our rental customer service team is happy to help you! Here's how you can contact us:</h4>

                        <ul className="support-contact-list">
                            <li>
                                <Mail size={16} />
                                <span>Via our <a href="#contact">contact form</a></span>
                            </li>
                            <li>
                                <Phone size={16} />
                                <span>By phone on <a href="tel:+9779827064217">+977-9827064217</a></span>
                            </li>
                        </ul>
                    </div>
                </motion.div>
            </div>

            {/* --- 7. Elite Fleet Section (Refined Carousel) --- */}
            <section id="fleet" className="fleet-section">
                <div className="fleet-title-wrap">
                    <div>
                        <span className="fleet-subtitle">Our Collection</span>
                        <h2 className="fleet-title">The YatraHub Fleet</h2>
                    </div>
                    <div className="fleet-tabs">
                        {['All', 'Car', 'SUV/Off-Roading', 'Bike', 'Scooter', 'Luxury'].map(t => (
                            <button
                                key={t}
                                className={`fleet-tab ${activeType === t ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveType(t);
                                    fetchVehicles({ type: t !== 'All' ? t : undefined });
                                    if (scrollRef.current) {
                                        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                                    }
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="fleet-carousel-container">
                    <button className="carousel-nav prev" onClick={() => {
                        if (scrollRef.current) scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                    }}>
                        <ChevronLeft size={24} />
                    </button>

                    <div
                        className="fleet-scroll-area"
                        ref={scrollRef}
                        onMouseDown={(e) => {
                            const area = scrollRef.current;
                            area.dataset.isDown = "true";
                            area.dataset.startX = e.pageX - area.offsetLeft;
                            area.dataset.scrollLeftStart = area.scrollLeft;
                            area.style.scrollBehavior = 'auto'; // Disable smooth for dragging
                        }}
                        onMouseLeave={() => {
                            if (scrollRef.current) scrollRef.current.dataset.isDown = "false";
                        }}
                        onMouseUp={() => {
                            if (scrollRef.current) {
                                scrollRef.current.dataset.isDown = "false";
                                scrollRef.current.style.scrollBehavior = 'smooth';
                            }
                        }}
                        onMouseMove={(e) => {
                            const area = scrollRef.current;
                            if (!area || area.dataset.isDown !== "true") return;
                            e.preventDefault();
                            const x = e.pageX - area.offsetLeft;
                            const walk = (x - parseFloat(area.dataset.startX)) * 2;
                            area.scrollLeft = parseFloat(area.dataset.scrollLeftStart) - walk;
                        }}
                    >
                        {visibleFleetVehicles.length === 0 ? (
                            <div style={{ color: '#94a3b8', padding: '50px 20px', textAlign: 'center', width: '100%' }}>
                                No vehicles are available right now. Try changing the category or refresh the page.
                            </div>
                        ) : visibleFleetVehicles.map((v, i) => {
                            // Normalize price display
                            const displayPrice = typeof v.pricePerDay === 'string' && v.pricePerDay.includes('.') ? v.pricePerDay :
                                (parseFloat(v.pricePerDay) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

                            return (
                                <motion.div
                                    key={v.id || i}
                                    className="vehicle-card"
                                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.3, delay: (v.id && typeof v.id === 'string' && v.id.startsWith('s')) ? i * 0.05 : 0 }}
                                    onClick={() => openVehicleModal(v, 'reserve')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="card-top" style={{ position: 'relative' }}>
                                        <span className="vehicle-badge">{v.type}</span>
                                        {/* Price shifted left to avoid 3-dot overlap */}
                                        <div className="price-tag" style={{ marginRight: '36px' }}>
                                            <span className="price-val">Rs. {displayPrice}</span>
                                            <span className="price-unit">per day</span>
                                        </div>

                                        {/* Hidden file input for Replace Image */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id={`replace-img-${v.id || i}`}
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                try {
                                                    const fd = new FormData();
                                                    fd.append('images', file);
                                                    const result = await vehicleService.uploadImages(fd);
                                                    const newImg = result?.imageUrls?.[0] || result?.[0];
                                                    if (newImg) {
                                                        // Update backend if real DB vehicle
                                                        if (v.id && !String(v.id).startsWith('s') && !String(v.id).startsWith('clone')) {
                                                            await vehicleService.updateImages(v.id, [newImg]);
                                                        }
                                                        setVehicles(prev => prev.map(x => x.id === v.id ? { ...x, images: [newImg] } : x));
                                                        alert('Image replaced successfully!');
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Failed to upload image. Check your connection.');
                                                }
                                                e.target.value = '';
                                            }}
                                        />

                                        {/* 3-dot menu button */}
                                        {(user?.role === 'admin' || (user?.id && user.id === v.ownerId)) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === (v.id || i) ? null : (v.id || i)); }}
                                                style={{
                                                    position: 'absolute', top: 0, right: 0,
                                                    background: 'rgba(255,255,255,0.1)', border: 'none',
                                                    borderRadius: '50%', width: 32, height: 32,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', color: '#fff', backdropFilter: 'blur(6px)',
                                                    transition: 'background 0.2s', zIndex: 10
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                        )}

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {openMenuId === (v.id || i) && (
                                                <motion.div
                                                    ref={menuRef}
                                                    initial={{ opacity: 0, scale: 0.85, y: -8 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.85, y: -8 }}
                                                    transition={{ duration: 0.15 }}
                                                    style={{
                                                        position: 'absolute', top: 36, right: 0,
                                                        background: '#1e293b',
                                                        borderRadius: 14, padding: '6px',
                                                        boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        zIndex: 999, minWidth: 190
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {[
                                                        {
                                                            label: 'Edit Details', color: '#fff',
                                                            action: () => { openVehicleModal(v, 'details'); setOpenMenuId(null); }
                                                        },
                                                        {
                                                            label: 'Replace Image', color: '#fff',
                                                            action: () => {
                                                                document.getElementById(`replace-img-${v.id || i}`)?.click();
                                                                setOpenMenuId(null);
                                                            }
                                                        },
                                                        {
                                                            label: 'Delete Image', color: '#f87171',
                                                            action: async () => {
                                                                if (!window.confirm('Remove the image from this listing?')) return;
                                                                try {
                                                                    if (v.id && !String(v.id).startsWith('s') && !String(v.id).startsWith('clone')) {
                                                                        await vehicleService.updateImages(v.id, []);
                                                                    }
                                                                    setVehicles(prev => prev.map(x => x.id === v.id ? { ...x, images: [] } : x));
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert('Failed to delete image.');
                                                                }
                                                                setOpenMenuId(null);
                                                            }
                                                        },
                                                        {
                                                            label: 'Duplicate Listing', color: '#fff',
                                                            action: () => {
                                                                const clone = { ...v, id: 'clone-' + Date.now(), name: v.name + ' (Copy)' };
                                                                setVehicles(prev => [clone, ...prev]);
                                                                setOpenMenuId(null);
                                                            }
                                                        },
                                                        {
                                                            label: 'Remove Listing', color: '#ef4444',
                                                            action: async () => {
                                                                if (!window.confirm(`Delete "${v.name}"? This cannot be undone.`)) return;
                                                                try {
                                                                    if (v.id && !String(v.id).startsWith('s') && !String(v.id).startsWith('clone')) {
                                                                        await vehicleService.delete(v.id);
                                                                    }
                                                                    setVehicles(prev => prev.filter(x => x.id !== v.id));
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert('Failed to delete: ' + (err.response?.data?.message || err.message));
                                                                }
                                                                setOpenMenuId(null);
                                                            }
                                                        }
                                                    ].map((item, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={item.action}
                                                            style={{
                                                                display: 'flex', alignItems: 'center',
                                                                width: '100%', padding: '10px 16px',
                                                                background: 'none', border: 'none',
                                                                borderRadius: 10, cursor: 'pointer',
                                                                color: item.color, fontSize: '0.88rem',
                                                                fontWeight: 600, textAlign: 'left',
                                                                borderTop: idx === 4 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                                                                marginTop: idx === 4 ? 4 : 0
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="vehicle-img-wrap">
                                        <img
                                            src={
                                                (v.images && v.images.length > 0)
                                                    ? getImageUrl(Array.isArray(v.images) ? v.images[0] : v.images)
                                                    : (VEHICLE_ASSETS[v.name] || '/src/assets/logo.png')
                                            }
                                            alt={v.name}
                                            className="vehicle-img-main"
                                            draggable="false"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = VEHICLE_ASSETS[v.name] || '/src/assets/Car.png';
                                            }}
                                        />
                                    </div>
                                    <div className="vehicle-info">
                                        <h4>{v.name}</h4>
                                        {v.owner && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={10} /> Listed by {v.owner.username}
                                            </div>
                                        )}
                                        <div className="vehicle-specs">
                                            <span className="spec-item"><User size={14} /> {v.features?.[0] || 'N/A'}</span>
                                            <span className="spec-item"><Zap size={14} /> {v.features?.[1] || 'Standard'}</span>
                                            <span className="spec-item"><Shield size={14} /> {v.features?.[2] || 'Verified'}</span>
                                        </div>
                                        <div className="vehicle-rating" onClick={(e) => { e.stopPropagation(); setSelectedVehicleForReview(v); }} style={{ cursor: 'pointer', display: 'inline-flex', alignSelf: 'flex-start', width: 'fit-content', alignItems: 'center', gap: '5px', marginBottom: '15px', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, padding: '4px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: '50px', transition: '0.2s', border: '1px solid rgba(245,158,11,0.2)' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} >
                                            <Star size={14} fill="#f59e0b" /> Reviews & Ratings
                                        </div>
                                        <div className="card-actions">
                                            <button className="btn-reserve" onClick={() => openVehicleModal(v, 'reserve')}>Reserve Now</button>
                                            <button className="btn-details" onClick={() => openVehicleModal(v, 'details')}>View Details</button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <button className="carousel-nav next" onClick={() => {
                        if (scrollRef.current) scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                    }}>
                        <ChevronRight size={24} />
                    </button>
                </div>
            </section>

            {/* --- 8. The YatraHub Experience --- */}
            <section id="experience" className="experience-section">
                <motion.span
                    className="fleet-subtitle"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                >
                    Advantage
                </motion.span>
                <motion.h2
                    className="fleet-title"
                    style={{ textAlign: 'center', marginBottom: '40px' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                >
                    The YatraHub Experience
                </motion.h2>

                <div className="experience-grid">
                    {[
                        {
                            id: 1,
                            title: "SECURE & INSURED",
                            subtitle: "100% Peace of Mind",
                            icon: <Shield size={20} />,
                            bg: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200", // Nepal Mountains
                            delay: 0
                        },
                        {
                            id: 2,
                            title: "GLOBAL CONCIERGE",
                            subtitle: "24/7 Expert Support",
                            icon: <Headphones size={20} />,
                            bg: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=1200", // Team/Support
                            delay: 0.1
                        },
                        {
                            id: 3,
                            title: "INSTANT APPROVAL",
                            subtitle: "Real-time Booking",
                            icon: <Zap size={20} />,
                            bg: "/src/assets/approval.png",
                            delay: 0.2
                        },
                        {
                            id: 4,
                            title: "ELITE PRICING",
                            subtitle: "Direct Owner Rates",
                            icon: <Award size={20} />,
                            bg: "/src/assets/elite.png", // Travel Journey
                            delay: 0.3
                        }
                    ].map((item) => (
                        <motion.div
                            key={item.id}
                            className={`exp-card item-${item.id}`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: item.delay }}
                            style={{ backgroundImage: `url(${item.bg})` }}
                        >
                            <div className="exp-card-overlay"></div>
                            <div className="exp-card-content">
                                <div className="exp-info">
                                    <h3>{item.title}</h3>
                                    <span>{item.subtitle}</span>
                                </div>
                                <div className="exp-icon">
                                    {item.icon}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Live Location Map */}
            <LiveMap />

            {/* --- 9. Premium Site Footer --- */}
            <footer className="site-footer">
                <div className="footer-top">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="/src/assets/logo.png" alt="YatraHub Logo" className="footer-logo-img" />
                        </div>
                        <p>Elevating vehicle rental standards in Nepal. Seamless journeys, unlimited freedom, and elite service at your fingertips.</p>
                    </div>

                    <div className="footer-col">
                        <h5>Explore</h5>
                        <ul className="footer-links">
                            <li><a href="#fleet">Fleet</a></li>
                            <li><a href="#">Pricing</a></li>
                            <li><a href="#experience">Experience</a></li>
                            <li><a href="#">Become a Partner</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h5>Company</h5>
                        <ul className="footer-links">
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h5>Contact</h5>
                        <ul className="footer-links">
                            <li><a href="#">Support Center</a></li>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">Kathmandu, Nepal</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="footer-copy">
                        © 2024 YatraHub. All rights reserved. Built for Elite Travelers.
                    </div>
                    <div className="social-links">
                        <a href="https://www.instagram.com/riding_life0306?igsh=bDFmZTEzc21rMDZt" target="_blank" rel="noopener noreferrer" className="social-link">Instagram</a>
                        <a href="#" className="social-link">Facebook</a>
                        <a href="#" className="social-link">LinkedIn</a>
                    </div>
                </div>
            </footer>

            <LocationPicker
                isOpen={mapConfig.isOpen}
                onClose={() => setMapConfig({ ...mapConfig, isOpen: false })}
                onSelect={handleLocationSelect}
                title={mapConfig.title}
            />

            <BookingModal
                isOpen={!!selectedVehicle}
                onClose={() => setSelectedVehicle(null)}
                vehicle={selectedVehicle}
                user={user}
                initialMode={modalMode}
            />

            <ReviewModal 
                isOpen={!!selectedVehicleForReview} 
                onClose={() => setSelectedVehicleForReview(null)} 
                vehicle={selectedVehicleForReview} 
            />

            {/* === Global Search Overlay === */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeSearchOverlay}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                            zIndex: 9999, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', paddingTop: '80px',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        <motion.div
                            initial={{ y: -30, opacity: 0, scale: 0.97 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '640px', padding: '0 20px' }}
                        >
                            {/* Search Input */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                background: '#fff', borderRadius: '18px',
                                padding: '14px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                            }}>
                                <Search size={22} color="#f59e0b" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search for a vehicle..."
                                    style={{
                                        flex: 1, border: 'none', outline: 'none',
                                        fontSize: '1.1rem', fontWeight: 600,
                                        color: '#0f172a', background: 'transparent'
                                    }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                        <X size={20} />
                                    </button>
                                )}
                                <button onClick={closeSearchOverlay} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                    <X size={22} />
                                </button>
                            </div>

                            {/* Results */}
                            <AnimatePresence>
                                {searchQuery.trim().length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            marginTop: '12px', background: '#0f172a',
                                            borderRadius: '18px', overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            maxHeight: '420px', overflowY: 'auto',
                                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                                        }}
                                    >
                                        {searchResults.length === 0 ? (
                                            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                                                <Search size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
                                                <p style={{ margin: 0, fontWeight: 600 }}>No vehicles found for "{searchQuery}"</p>
                                            </div>
                                        ) : (
                                            searchResults.map((v, i) => {
                                                const img = v.images && (Array.isArray(v.images) ? v.images[0] : v.images);
                                                const imgSrc = img ? getImageUrl(img) : null;
                                                return (
                                                    <motion.div
                                                        key={v.id || i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        onClick={() => {
                                                            closeSearchOverlay();
                                                            openVehicleModal(v, 'reserve');
                                                        }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '16px',
                                                            padding: '14px 20px', cursor: 'pointer',
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        whileHover={{ background: 'rgba(245,158,11,0.08)' }}
                                                    >
                                                        {/* Thumbnail */}
                                                        <div style={{
                                                            width: 64, height: 48, borderRadius: 10,
                                                            background: '#1e293b', overflow: 'hidden', flexShrink: 0
                                                        }}>
                                                            {imgSrc && (
                                                                <img src={imgSrc} alt={v.name}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = '/src/assets/Car.png';
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                        {/* Info */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{v.name}</div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 2 }}>{v.type} • Rs. {parseFloat(v.pricePerDay || 0).toLocaleString()}/day</div>
                                                        </div>
                                                        {/* CTA */}
                                                        <div style={{
                                                            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                                                            padding: '6px 14px', borderRadius: 50,
                                                            fontSize: '0.78rem', fontWeight: 700
                                                        }}>Reserve</div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Hint text */}
                            {searchQuery.trim().length === 0 && (
                                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 20, fontSize: '0.9rem' }}>
                                    Type a name like "Scorpio", "Enfield", "Honda"...
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Home;
