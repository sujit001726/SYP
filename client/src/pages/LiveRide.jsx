import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Menu, Search, Clock, MapPin, Navigation, Shield, User, X, Loader2, CreditCard, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingService, getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Custom Markers
const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3203/3203071.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3203/3203061.png',
    iconSize: [50, 50],
    iconAnchor: [25, 25]
});

const CenterView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 15, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
};

const LiveRide = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [bottomSheetState, setBottomSheetState] = useState('default'); // default, finding, on_trip
    const [userLocation, setUserLocation] = useState([27.7172, 85.3240]);
    const [carLocation, setCarLocation] = useState([27.7200, 85.3200]);
    const [activeBooking, setActiveBooking] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const myBookings = await bookingService.getMyBookings();
                setBookings(myBookings || []);
                const current = (myBookings || []).find(b => b.status === 'confirmed' || b.status === 'pending');
                if (current) {
                    setActiveBooking(current);
                    if (current.status === 'pending') setBottomSheetState('finding');
                    if (current.status === 'confirmed') setBottomSheetState('on_trip');
                }
            } catch (err) { } finally { setLoading(false); }
        };
        fetchBookings();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
                setCarLocation([position.coords.latitude + 0.005, position.coords.longitude - 0.005]);
            });
        }
    }, []);

    if (loading) return <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#fff" size={40} /></div>;

    return (
        <div className="live-ride-wrapper">
            <style>{`
                .live-ride-wrapper { position: fixed; inset: 0; overflow: hidden; background: #f1f1f1; font-family: -apple-system, sans-serif; }
                .map-fullscreen { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1; }
                .uber-top-bar { position: absolute; top: 0; left: 0; right: 0; padding: 20px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; pointer-events: none; }
                .circle-btn { width: 48px; height: 48px; border-radius: 50%; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #000; pointer-events: auto; }
                
                .uber-bottom-sheet { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border-radius: 24px 24px 0 0; box-shadow: 0 -10px 40px rgba(0,0,0,0.1); z-index: 1000; padding: 24px; pointer-events: auto; }
                .sheet-handle { width: 40px; height: 5px; background: #e2e2e2; border-radius: 5px; margin: 0 auto 20px auto; }
                
                .uber-greeting { font-size: 1.6rem; font-weight: 700; color: #000; margin-bottom: 20px; }
                .uber-search-box { background: #eeeeee; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 15px; margin-bottom: 20px; cursor: pointer; }
                .uber-search-box span { font-size: 1.1rem; font-weight: 600; color: #000; flex: 1; }
                .time-pill { background: #fff; padding: 8px 16px; border-radius: 50px; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                
                .uber-recent-list { display: flex; flex-direction: column; gap: 15px; }
                .uber-recent-item { display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                .uber-recent-icon { width: 40px; height: 40px; border-radius: 50%; background: #eeeeee; display: flex; align-items: center; justify-content: center; color: #000; }
                .uber-recent-text h4 { font-size: 1rem; font-weight: 600; color: #000; margin: 0; }
                .uber-recent-text p { font-size: 0.85rem; color: #5a5a5a; margin: 2px 0 0 0; }

                /* Pulse animation for finding trip */
                .uber-pulse-radar { width: 60px; height: 60px; border-radius: 50%; background: rgba(39, 110, 241, 0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
                .uber-pulse-dot { width: 20px; height: 20px; background: #276ef1; border-radius: 50%; animation: pulse 1.5s infinite; }
                @keyframes pulse { 0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(39, 110, 241, 0.5); } 70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(39, 110, 241, 0); } 100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(39, 110, 241, 0); } }
                
                .uber-driver-card { display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8f8f8; border-radius: 16px; margin-bottom: 20px; }
                .uber-action-row { display: flex; gap: 15px; }
                .uber-btn-primary { flex: 1; background: #000; color: #fff; border: none; padding: 16px; border-radius: 12px; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
                .uber-btn-secondary { width: 56px; height: 56px; border-radius: 12px; background: #eee; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #000; }
            `}</style>

            <div className="uber-top-bar">
                <button className="circle-btn" onClick={() => navigate('/dashboard')}><Menu size={24} /></button>
            </div>

            <div className="map-fullscreen">
                <MapContainer center={userLocation} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <CenterView center={bottomSheetState === 'on_trip' ? carLocation : userLocation} />
                    <Marker position={userLocation} icon={userIcon}><Popup>Your Location</Popup></Marker>
                    {(bottomSheetState === 'on_trip' || bottomSheetState === 'finding') && (
                        <Marker position={carLocation} icon={carIcon}><Popup>Your Ride</Popup></Marker>
                    )}
                </MapContainer>
            </div>

            <AnimatePresence mode="wait">
                {bottomSheetState === 'default' && (
                    <motion.div key="default" className="uber-bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}>
                        <div className="sheet-handle"></div>
                        <h2 className="uber-greeting">Good afternoon, {user?.username?.split(' ')[0] || 'Seeker'}</h2>

                        <div className="uber-search-box" onClick={() => navigate('/')}>
                            <Search size={24} color="#000" />
                            <span>Where to?</span>
                            <div className="time-pill"><Clock size={16} /> Now</div>
                        </div>

                        <div className="uber-recent-list">
                            <div className="uber-recent-item" onClick={() => navigate('/')}>
                                <div className="uber-recent-icon"><MapPin size={20} /></div>
                                <div className="uber-recent-text"><h4>Tribhuvan International Airport</h4><p>Ring Road, Kathmandu</p></div>
                            </div>
                            <div className="uber-recent-item" onClick={() => navigate('/')}>
                                <div className="uber-recent-icon"><MapPin size={20} /></div>
                                <div className="uber-recent-text"><h4>Thamel</h4><p>Kathmandu 44600</p></div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {bottomSheetState === 'finding' && (
                    <motion.div key="finding" className="uber-bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }}>
                        <div className="sheet-handle"></div>
                        <div className="uber-pulse-radar"><div className="uber-pulse-dot"></div></div>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.4rem', margin: '0 0 5px 0' }}>Connecting to a Partner...</h2>
                            <p style={{ color: '#5a5a5a', margin: 0 }}>Finding the closest available partner for you.</p>
                        </div>
                        <button className="uber-btn-primary" style={{ background: '#eeeeee', color: '#000', marginTop: '10px', width: '100%' }} onClick={() => navigate('/dashboard')}>
                            Go Back to Dashboard
                        </button>
                    </motion.div>
                )}

                {bottomSheetState === 'on_trip' && (
                    <motion.div key="on_trip" className="uber-bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }}>
                        <div className="sheet-handle"></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ textAlign: 'center' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>3 min</h2>
                                <p style={{ color: '#276ef1', fontWeight: 600, margin: 0 }}>Arriving</p>
                            </div>
                            <div style={{ background: '#000', color: '#fff', padding: '6px 16px', borderRadius: '50px', letterSpacing: 2, alignSelf: 'center', fontWeight: 'bold' }}>
                                PIN: {activeBooking?.id?.substring(0, 4).toUpperCase()}
                            </div>
                        </div>

                        <div className="uber-driver-card">
                            <div className="uber-recent-icon" style={{ background: '#276ef1', color: '#fff' }}><Car /></div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px', fontSize: '1.1rem' }}>{activeBooking?.vehicle?.name || 'Your Vehicle'}</h4>
                                <div style={{ fontSize: '0.85rem', color: '#5a5a5a', fontWeight: 600 }}>★ 4.9 • Partner</div>
                            </div>
                            <div style={{ background: '#eee', padding: '4px 10px', borderRadius: 8, fontFamily: 'monospace', fontWeight: 700 }}>BA 2 PA</div>
                        </div>

                        <div className="uber-action-row">
                            <button className="uber-btn-secondary"><Shield size={24} /></button>
                            <button className="uber-btn-primary">Contact Partner</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LiveRide;
