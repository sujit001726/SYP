import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, Bike, Navigation, Filter, Search,
    ArrowLeft, Star, MapPin, ShieldCheck,
    Zap, Cpu, Globe, ArrowRight, Loader2,
    Compass, Timer, MessageSquare, Bell

} from 'lucide-react';
import { vehicleService, getImageUrl, authService, notificationService } from '../services/api';
import NotificationDropdown from '../components/NotificationDropdown';
import BookingModal from '../components/BookingModal';
import { useSocket } from '../context/SocketContext';
import logoImg from '../assets/logo.png';


const RideListing = () => {
    const { category } = useParams(); // 'cars' or 'bikes'
    const user = authService.getCurrentUser();
    const [vehicles, setVehicles] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [modalMode, setModalMode] = useState('reserve');
    const [showNotifications, setShowNotifications] = useState(false);
    const { unreadCount, unreadNotiCount, socket } = useSocket();

    const displayCategory = category === 'cars' ? 'Elite Car Rides' : 'Fast Bike Rides';
    const CategoryIcon = category === 'cars' ? Car : Bike;

    useEffect(() => {
        const fetchRides = async () => {
            setLoading(true);
            try {
                // Determine vehicle type for API filter
                const type = category === 'cars' ? 'Car' : 'Bike';
                const data = await vehicleService.getAll({
                    category: type,
                    serviceType: 'ride'
                });
                setVehicles(data || []);
            } catch (err) {
                console.error("Failed to fetch rides:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRides();
    }, [category]);

    const openVehicleModal = (v, mode) => {
        setModalMode(mode);
        setSelectedVehicle(v);
    };

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.brand.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="ride-page-wrapper">
            <style>{`
                .ride-page-wrapper { background: #020617; color: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; }
                .ride-nav { padding: 25px 50px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(2,6,23,0.8); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100; }
                .ride-logo { height: 45px; }
                .back-btn { display: flex; align-items: center; gap: 10px; color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: 0.3s; }
                .back-btn:hover { color: #f59e0b; }
                
                .ride-hero { padding: 80px 50px; background: radial-gradient(circle at 50% 0%, rgba(245,158,11,0.05) 0%, transparent 70%); text-align: center; }
                .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(245,158,11,0.1); color: #f59e0b; padding: 8px 20px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 25px; border: 1px solid rgba(245,158,11,0.2); }
                .hero-title { font-size: 3.5rem; font-weight: 900; margin-bottom: 20px; letter-spacing: -1px; display: flex; align-items: center; justify-content: center; gap: 15px; }
                
                .ride-controls { display: flex; justify-content: center; gap: 20px; margin-top: 40px; padding: 0 50px; max-width: 1200px; margin-left: auto; margin-right: auto; }
                .ride-search-box { flex: 1; max-width: 500px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 0 20px; display: flex; align-items: center; gap: 15px; }
                .ride-search-box input { background: transparent; border: none; color: #fff; padding: 15px 0; width: 100%; outline: none; font-size: 1rem; }
                
                .ride-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px; padding: 60px 50px; max-width: 1400px; margin: 0 auto; }
                .v-card-elite { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 28px; overflow: hidden; position: relative; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .v-card-elite:hover { transform: translateY(-10px); background: rgba(255,255,255,0.04); border-color: rgba(245,158,11,0.3); box-shadow: 0 30px 60px -12px rgba(245,158,11,0.15); }
                
                .v-img-wrap { height: 240px; position: relative; overflow: hidden; }
                .v-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
                .v-card-elite:hover .v-img-wrap img { transform: scale(1.1); }
                .v-price-tag { position: absolute; bottom: 20px; right: 20px; background: rgba(2,6,23,0.8); backdrop-filter: blur(10px); padding: 8px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                .v-price-tag span { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
                .v-price-tag h4 { font-size: 1.2rem; color: #f59e0b; font-weight: 800; }

                .v-content { padding: 30px; }
                .v-brand { font-size: 0.75rem; color: #f59e0b; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
                .v-name { font-size: 1.5rem; font-weight: 800; margin-bottom: 15px; }
                .v-meta { display: flex; gap: 20px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .m-item { display: flex; align-items: center; gap: 8px; color: #94a3b8; font-size: 0.85rem; font-weight: 500; }
                
                .v-actions { display: flex; align-items: center; justify-content: space-between; }
                .rating-chip { display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 0.9rem; }
                .btn-reserve { padding: 12px 25px; border-radius: 14px; background: #f59e0b; color: #000; text-decoration: none; font-weight: 700; font-size: 0.9rem; transition: 0.3s; display: flex; align-items: center; gap: 10px; }
                .btn-reserve:hover { transform: scale(1.05); background: #fbbf24; }

                .no-results { text-align: center; padding: 100px 0; grid-column: 1/-1; }
                .loader-wrap { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; grid-column: 1/-1; color: #94a3b8; }
            `}</style>

            <nav className="ride-nav">
                <Link to="/" className="back-btn">
                    <ArrowLeft size={18} /> Exit Rides
                </Link>
                <img src={logoImg} alt="YatraHub" className="ride-logo" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {user && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Bell size={24} />
                                {unreadNotiCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
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
                        <Link to="/messages" style={{ position: 'relative', color: '#94a3b8', textDecoration: 'none' }}>
                            <MessageSquare size={24} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
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
                    <div style={{ width: 40 }}></div>
                </div>
            </nav>


            <header className="ride-hero">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hero-badge"
                >
                    <Compass size={14} /> Instant Mobility Network
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="hero-title"
                >
                    <span className="yatrahub-brand">Yatra<span className="hub-pill">Hub</span></span> {displayCategory}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}
                >
                    Premium door-to-door mobility. Professional drivers,
                    real-time tracking, and fixed transparent pricing.
                </motion.p>

                <div className="ride-controls">
                    <div className="ride-search-box">
                        <Search size={20} color="#64748b" />
                        <input
                            type="text"
                            placeholder={`Search ride...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <motion.div
                className="ride-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {loading ? (
                    <div className="loader-wrap">
                        <Loader2 className="spin" size={40} style={{ marginBottom: 20 }} />
                        <p>Calibrating ride-hailed network...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
                    </div>
                ) : filteredVehicles.length > 0 ? (
                    filteredVehicles.map((v, i) => (
                        <motion.div
                            className="v-card-elite"
                            key={v.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                        >
                            <div className="v-img-wrap">
                                <img src={v.image ? getImageUrl(v.image) : "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80"} alt={v.name} />
                                <div className="v-price-tag">
                                    <span>Fixed Fare</span>
                                    <h4>Rs. {v.pricePerDay || v.pricePerHour}</h4>
                                </div>
                            </div>
                            <div className="v-content">
                                <p className="v-brand">{v.brand}</p>
                                <h3 className="v-name">{v.name}</h3>
                                <div className="v-meta">
                                    <div className="m-item"><Timer size={14} color="#f59e0b" /> 5-10 Min ETD</div>
                                    <div className="m-item"><ShieldCheck size={14} color="#f59e0b" /> Verified Driver</div>
                                    <div className="m-item"><MapPin size={14} color="#f59e0b" /> {v.location || 'Nearby'}</div>
                                </div>
                                <div className="v-actions">
                                    <div className="rating-chip">
                                        <Star size={16} fill="#f59e0b" color="#f59e0b" /> 4.9 <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 5 }}>(2.5k+ Rides)</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Link to={`/messages?userId=${v.ownerId}`} className="btn-reserve" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                                            <MessageSquare size={16} />
                                        </Link>
                                        <button className="btn-reserve" onClick={() => openVehicleModal(v, 'reserve')}>
                                            Book Now <ArrowRight size={16} />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="no-results">
                        <Navigation size={48} style={{ opacity: 0.2, marginBottom: 20 }} />
                        <h3>No rides active in your sector</h3>
                        <p style={{ color: '#94a3b8' }}>Our drivers are currently deployed. Please check back in a few minutes.</p>
                        <button className="f-pill active" style={{ marginTop: 20, background: '#3b82f6', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setSearchTerm('')}>Refresh Sector</button>
                    </div>
                )}
            </motion.div>

            <footer style={{ padding: '80px 50px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                <img src={logoImg} alt="YatraHub" style={{ height: 30, opacity: 0.3, marginBottom: 20 }} />
                <p>&copy; 2026 YatraHub Mobility. Secure rides through Kathmandu's finest network.</p>
            </footer>

            <BookingModal
                isOpen={!!selectedVehicle}
                onClose={() => setSelectedVehicle(null)}
                vehicle={selectedVehicle}
                user={user}
                initialMode={modalMode}
            />
        </div>
    );
};

export default RideListing;
