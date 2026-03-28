import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Menu, ShieldCheck, Navigation, Phone, MessageSquare, X, Check, Loader2, MapPin, Search, Car, User, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingService, getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Custom Map Marker Icons
const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3203/3203061.png',
    iconSize: [46, 46],
    iconAnchor: [23, 23]
});

const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3203/3203071.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
});

// Auto-center map to the driver's location
const CenterView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

const RiderApp = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Driver States
    const [isOnline, setIsOnline] = useState(false);
    const [appState, setAppState] = useState('offline'); // offline, online_searching, incoming_request, accepted_en_route, passenger_onboard
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Map States
    const [driverLocation, setDriverLocation] = useState([27.7172, 85.3240]);
    const [passengerLocation, setPassengerLocation] = useState([27.7200, 85.3200]);

    const [activeRequest, setActiveRequest] = useState(null);
    const [toast, setToast] = useState(null); // { type: 'success'|'info', message }

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                // For "rider/owner", we fetch owner bookings
                const requests = await bookingService.getOwnerBookings();
                setBookings(requests || []);

                // If there's an active booking that needs action
                const pending = (requests || []).find(b => b.status === 'pending');
                const confirmed = (requests || []).find(b => b.status === 'confirmed');

                if (confirmed) {
                    setIsOnline(true);
                    setAppState('accepted_en_route');
                    setActiveRequest(confirmed);
                } else if (pending && isOnline) {
                    setAppState('incoming_request');
                    setActiveRequest(pending);
                }
            } catch (err) {
                console.error("Failed to fetch bookings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();

        // Simulate Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setDriverLocation([position.coords.latitude, position.coords.longitude]);
                setPassengerLocation([position.coords.latitude + 0.006, position.coords.longitude - 0.004]);
            });
        }
    }, [isOnline]); // Re-check when going online

    // Simulated incoming request after 5 seconds of going online (if none exists)
    useEffect(() => {
        let timer;
        if (appState === 'online_searching' && !activeRequest) {
            timer = setTimeout(() => {
                // Mock an incoming request
                setActiveRequest({
                    id: 'REQ-' + Math.floor(Math.random() * 10000),
                    seeker: { username: 'Customer' },
                    totalAmount: 450,
                    pickup: 'Thamel, Kathmandu',
                    dropoff: 'Tribhuvan International Airport',
                    distance: '5.2 km',
                    eta: '12 min'
                });
                setAppState('incoming_request');
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [appState, activeRequest]);

    const handleGoOnline = () => {
        setIsOnline(true);
        setAppState('online_searching');
    };

    const handleGoOffline = () => {
        setIsOnline(false);
        setAppState('offline');
        setActiveRequest(null);
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleAcceptRequest = async () => {
        if (activeRequest?._id) {
            try {
                await bookingService.updateStatus(activeRequest._id, 'confirmed');
            } catch (err) {
                console.error(err);
            }
        }
        showToast('🎉 Ride Accepted! Navigating to pickup...');
        setAppState('accepted_en_route');
    };

    const handleDeclineRequest = () => {
        setAppState('online_searching');
        setActiveRequest(null);
    };

    const handlePickupPassenger = () => {
        setAppState('passenger_onboard');
    };

    const handleCompleteTrip = async () => {
        if (activeRequest?._id) {
            try {
                await bookingService.updateStatus(activeRequest._id, 'completed');
            } catch (err) {
                console.error(err);
            }
        }
        setAppState('online_searching');
        setActiveRequest(null);
        showToast('✅ Trip Completed! Earnings added to wallet.');
    };

    if (loading) return <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#fff" size={40} /></div>;

    return (
        <div className="driver-app-wrapper">
            <style>{`
                .driver-app-wrapper { position: fixed; inset: 0; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .map-fullscreen { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1; }
                
                .uber-top-bar { position: absolute; top: 0; left: 0; right: 0; padding: 20px 20px 0 20px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 1000; pointer-events: none; }
                .circle-btn-glass { width: 50px; height: 50px; border-radius: 50%; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #000; pointer-events: auto; transition: transform 0.2s; border: none; }
                .circle-btn-glass:active { transform: scale(0.95); }
                
                .earnings-pill { background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); color: #fff; padding: 12px 24px; border-radius: 50px; font-weight: 800; font-size: 1.1rem; pointer-events: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); }
                .earnings-pill span { color: #10b981; margin-right: 5px; }

                .status-toggle { pointer-events: auto; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 50px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); margin-top: 15px; }
                .status-btn { padding: 10px 20px; border-radius: 40px; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: none; transition: 0.3s; color: #fff; background: transparent; }
                .status-btn.active.online { background: #276ef1; color: #fff; }
                .status-btn.active.offline { background: #ef4444; color: #fff; }

                /* Offline State Bottom Box */
                .offline-sheet { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border-radius: 24px 24px 0 0; padding: 30px 20px; z-index: 1000; text-align: center; pointer-events: auto; box-shadow: 0 -10px 30px rgba(0,0,0,0.2); }
                .offline-sheet h2 { margin: 0 0 10px 0; font-size: 1.6rem; font-weight: 800; }
                .offline-sheet p { margin: 0 0 30px 0; color: #5a5a5a; }
                .go-btn { background: #276ef1; color: #fff; width: 100px; height: 100px; border-radius: 50%; border: none; font-size: 1.8rem; font-weight: 900; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(39, 110, 241, 0.4); cursor: pointer; border: 4px solid rgba(39, 110, 241, 0.3); transition: 0.2s; }
                .go-btn:active { transform: scale(0.95); }

                /* Searching State */
                .search-plate { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); background: #fff; padding: 15px 30px; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 1000; display: flex; align-items: center; gap: 15px; pointer-events: auto; font-weight: 700; font-size: 1.1rem; }
                .pulse-ring { width: 20px; height: 20px; background: #276ef1; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
                @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }

                /* Incoming Request Modal */
                .request-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 2000; display: flex; align-items: flex-end; padding: 15px; backdrop-filter: blur(10px); }
                .request-card { background: #1e1e1e; width: 100%; border-radius: 24px; overflow: hidden; color: #fff; display: flex; flex-direction: column; position: relative; }
                .req-timer-bar { height: 6px; background: #276ef1; width: 100%; animation: shrink 15s linear forwards; transform-origin: left; }
                @keyframes shrink { from { width: 100%; } to { width: 0%; } }
                .req-body { padding: 30px 20px; text-align: center; }
                .req-price { font-size: 3.5rem; font-weight: 900; margin: 0; letter-spacing: -1px; }
                .req-price span { font-size: 1.5rem; vertical-align: top; margin-right: 5px; }
                .req-dist { font-size: 1.1rem; color: #a3a3a3; font-weight: 600; margin: 10px 0 25px 0; }
                .pickup-box { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 16px; display: flex; align-items: center; gap: 15px; text-align: left; margin-bottom: 25px; }
                .pickup-box h4 { margin: 0 0 3px 0; font-size: 1.1rem; }
                .pickup-box p { margin: 0; color: #a3a3a3; font-size: 0.9rem; }
                .req-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 20px 30px; }
                .btn-decline { padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.1); color: #fff; font-weight: 800; font-size: 1.1rem; border: none; cursor: pointer; }
                .btn-accept { padding: 20px; border-radius: 16px; background: #276ef1; color: #fff; font-weight: 800; font-size: 1.1rem; border: none; cursor: pointer; box-shadow: 0 10px 25px rgba(39, 110, 241, 0.4); }

                /* En Route / On Trip Bottom Sheet */
                .trip-sheet { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border-radius: 24px 24px 0 0; padding: 20px; z-index: 1000; pointer-events: auto; box-shadow: 0 -10px 30px rgba(0,0,0,0.2); }
                .navigator-banner { display: flex; justify-content: space-between; align-items: center; background: #e8f0fe; padding: 15px 20px; border-radius: 16px; margin-bottom: 20px; }
                .nav-icon { width: 44px; height: 44px; background: #276ef1; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .nav-text h3 { margin: 0 0 2px 0; font-size: 1.3rem; font-weight: 800; color: #000; }
                .nav-text p { margin: 0; color: #276ef1; font-weight: 700; font-size: 0.9rem; }
                .passenger-strip { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
                .p-info { display: flex; align-items: center; gap: 15px; }
                .p-avatar { width: 50px; height: 50px; border-radius: 50%; background: #f1f1f1; display: flex; align-items: center; justify-content: center; }
                .p-info h4 { margin: 0 0 2px 0; font-size: 1.1rem; font-weight: 700; color: #000; }
                .p-info p { margin: 0; color: #5a5a5a; font-size: 0.85rem; font-weight: 600; }
                .trip-actions { display: flex; gap: 10px; }
                .act-btn { width: 48px; height: 48px; border-radius: 50%; background: #f1f1f1; border: none; display: flex; align-items: center; justify-content: center; color: #000; cursor: pointer; }
                .slide-btn-container { background: #eeeeee; border-radius: 50px; padding: 5px; position: relative; cursor: pointer; overflow: hidden; }
                .slide-text { text-align: center; line-height: 50px; font-weight: 800; color: #5a5a5a; position: absolute; width: 100%; top: 0; pointer-events: none; }
                .slide-knob { width: 50px; height: 50px; background: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; position: relative; z-index: 2; transition: transform 0.3s; }
                .slide-btn-container:active .slide-knob { transform: translateX(calc(100vw - 110px)); background: #10b981; }

                .leaflet-control-zoom { display: none; }

                /* Toast Notification */
                .driver-toast { position: fixed; top: 90px; left: 50%; transform: translateX(-50%); z-index: 9999; background: #1a1a1a; color: #fff; padding: 16px 28px; border-radius: 50px; font-weight: 700; font-size: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 12px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.1); }
                .driver-toast.success { background: #10b981; color: #fff; }
                .driver-toast-dot { width: 10px; height: 10px; background: #fff; border-radius: 50%; }
            `}</style>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className={`driver-toast ${toast.type}`}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    >
                        <div className="driver-toast-dot"></div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="uber-top-bar">
                <button className="circle-btn-glass" onClick={() => navigate('/profile')}>
                    {user?.profileImage
                        ? <img src={getImageUrl(user.profileImage)} alt="Profile" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        : <span style={{ fontWeight: 800, fontSize: '1rem' }}>{user?.username?.charAt(0).toUpperCase()}</span>
                    }
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="earnings-pill">
                        <span>Rs.</span> 1,250.00
                    </div>
                    {appState === 'offline' || appState === 'online_searching' ? (
                        <div className="status-toggle">
                            <button className={`status-btn ${!isOnline ? 'active offline' : ''}`} onClick={handleGoOffline}>Offline</button>
                            <button className={`status-btn ${isOnline ? 'active online' : ''}`} onClick={handleGoOnline}>Online</button>
                        </div>
                    ) : null}
                </div>
                <button className="circle-btn-glass" onClick={() => {
                    logout();
                    navigate('/login');
                }}>
                    <X size={20} />
                </button>
            </div>

            <div className="map-fullscreen">
                {/* Use dark map for driver app for professional look */}
                <MapContainer center={driverLocation} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%', filter: 'contrast(1.2)' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <CenterView center={driverLocation} />

                    <Marker position={driverLocation} icon={carIcon}>
                        <Popup>You</Popup>
                    </Marker>

                    {/* Show passenger location if accepted */}
                    {(appState === 'accepted_en_route' || appState === 'incoming_request') && passengerLocation && (
                        <Marker position={passengerLocation} icon={userIcon}>
                            <Popup>Pickup</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            <AnimatePresence>
                {/* 1. OFFLINE */}
                {appState === 'offline' && (
                    <motion.div className="offline-sheet" initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 300 }}>
                        <h2>You're Offline</h2>
                        <p>Go online to start receiving ride requests.</p>
                        <button className="go-btn" onClick={handleGoOnline}>GO</button>
                    </motion.div>
                )}

                {/* 2. ONLINE FINDING */}
                {appState === 'online_searching' && (
                    <motion.div className="search-plate" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                        <div className="pulse-ring"></div>
                        Finding Trips...
                    </motion.div>
                )}

                {/* 3. INCOMING REQUEST MODAL */}
                {appState === 'incoming_request' && activeRequest && (
                    <motion.div className="request-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="request-card" initial={{ y: 100 }} animate={{ y: 0 }}>
                            <div className="req-timer-bar" />
                            <div className="req-body">
                                <p style={{ color: '#276ef1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px 0' }}>UberX Request</p>
                                <h1 className="req-price"><span>Rs.</span>{activeRequest.totalAmount || 450}</h1>
                                <div className="req-dist">includes estimated toll</div>

                                <div className="pickup-box">
                                    <MapPin color="#276ef1" size={24} />
                                    <div>
                                        <p>PICKUP ({activeRequest.distance || '2 min away'})</p>
                                        <h4>{activeRequest.pickup || 'Location pending'}</h4>
                                    </div>
                                </div>
                                <div className="pickup-box" style={{ background: 'transparent', padding: '0 15px', marginBottom: 30 }}>
                                    <div style={{ width: 10, height: 10, background: '#fff', borderRadius: '50%', margin: '0 7px' }}></div>
                                    <div>
                                        <p>DROPOFF ({activeRequest.eta || '15 min trip'})</p>
                                        <h4>{activeRequest.dropoff || 'Location pending'}</h4>
                                    </div>
                                </div>
                            </div>

                            <div className="req-actions">
                                <button className="btn-decline" onClick={handleDeclineRequest}><X size={24} style={{ display: 'block', margin: '0 auto 5px' }} /> Decline</button>
                                <button className="btn-accept" onClick={handleAcceptRequest}><Check size={24} style={{ display: 'block', margin: '0 auto 5px' }} /> Accept</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 4. EN ROUTE TO PICKUP */}
                {appState === 'accepted_en_route' && (
                    <motion.div className="trip-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}>
                        <div className="navigator-banner">
                            <div className="nav-icon"><Navigation size={24} style={{ transform: 'rotate(45deg)' }} /></div>
                            <div className="nav-text">
                                <h3>2 min</h3>
                                <p>0.8 km • Head straight</p>
                            </div>
                            <button className="act-btn" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}><ShieldCheck size={20} color="#276ef1" /></button>
                        </div>

                        <div className="passenger-strip">
                            <div className="p-info">
                                <div className="p-avatar"><User size={24} color="#a3a3a3" /></div>
                                <div>
                                    <h4>{activeRequest?.seeker?.username || 'Customer'}</h4>
                                    <p>★ 4.9 • Top Rider</p>
                                </div>
                            </div>
                            <div className="trip-actions">
                                <button className="act-btn"><Phone size={20} /></button>
                                <button className="act-btn"><MessageSquare size={20} /></button>
                            </div>
                        </div>

                        {/* Slide to Pickup Simulator Button */}
                        <div className="slide-btn-container" onClick={handlePickupPassenger}>
                            <div className="slide-text">TAP TO PICKUP</div>
                            <div className="slide-knob"><Car size={20} /></div>
                        </div>
                    </motion.div>
                )}

                {/* 5. PASSENGER ONBOARD */}
                {appState === 'passenger_onboard' && (
                    <motion.div className="trip-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}>
                        <div className="navigator-banner" style={{ background: '#10b981', color: '#fff' }}>
                            <div className="nav-icon" style={{ background: 'rgba(255,255,255,0.2)' }}><Navigation size={24} style={{ transform: 'rotate(45deg)' }} /></div>
                            <div className="nav-text">
                                <h3 style={{ color: '#fff' }}>15 min</h3>
                                <p style={{ color: 'rgba(255,255,255,0.8)' }}>Dropoff at destination</p>
                            </div>
                            <button className="act-btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}><Check size={20} /></button>
                        </div>

                        <div className="passenger-strip">
                            <div className="p-info">
                                <div className="p-avatar"><MapPin size={24} color="#10b981" /></div>
                                <div>
                                    <h4>{activeRequest?.dropoff || 'Final Destination'}</h4>
                                    <p>En route</p>
                                </div>
                            </div>
                        </div>

                        <div className="slide-btn-container" onClick={handleCompleteTrip} style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <div className="slide-text" style={{ color: '#10b981' }}>TAP TO COMPLETE TRIP</div>
                            <div className="slide-knob" style={{ background: '#10b981' }}><Check size={24} /></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RiderApp;
