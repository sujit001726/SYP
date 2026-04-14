import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Calendar, MapPin, DollarSign, ShieldAlert,
    CheckCircle2, Loader2, ArrowRight, Zap,
    ShieldCheck, Cpu, Globe, Compass, Timer,
    User, Fuel, Gauge
} from 'lucide-react';
import { bookingService, paymentService, getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';

const BookingModal = ({ isOpen, onClose, vehicle, user: authUser, initialMode = 'reserve' }) => {
    const navigate = useNavigate();
    const [view, setView] = useState(initialMode);
    const vehicleImage = Array.isArray(vehicle?.images) ? vehicle.images[0] : vehicle?.images;
    const vehicleImageUrl = getImageUrl(vehicleImage) || '/src/assets/Car.png';
    const displayCategory = vehicle?.category || vehicle?.type || 'Vehicle';
    const [bookingData, setBookingData] = useState({
        startDate: '',
        endDate: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('esewa_qr');
    const [showQRView, setShowQRView] = useState(false);
    const [currentBookingId, setCurrentBookingId] = useState(null);
    const [manualToken, setManualToken] = useState('');
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [existingBookings, setExistingBookings] = useState([]);
    const [isOccupied, setIsOccupied] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setView(initialMode);
            setError('');
            setSuccess(false);
            setBookingData({ startDate: '', endDate: '' });
            setShowQRView(false);
            setShowTokenInput(false);
            setManualToken('');
            setPaymentMethod('esewa_epay');
            setIsOccupied(false);
            if (vehicle?.id) {
                bookingService.getVehicleBookings(vehicle.id)
                    .then(data => setExistingBookings(data))
                    .catch(err => console.error("Failed to fetch bookings:", err));
            }
        }
    }, [isOpen, initialMode, vehicle?.id]);

    React.useEffect(() => {
        if (bookingData.startDate && bookingData.endDate) {
            setError(''); // Clear server errors when dates are changed
            const start = new Date(bookingData.startDate);
            const end = new Date(bookingData.endDate);
            
            const overlap = existingBookings.some(b => {
                const bStart = new Date(b.startDate);
                const bEnd = new Date(b.endDate);
                // Standard overlap check: (StartA <= EndB) and (EndA >= StartB)
                return (start <= bEnd && end >= bStart);
            });
            setIsOccupied(overlap);
        } else {
            setIsOccupied(false);
        }
    }, [bookingData, existingBookings]);

    if (!isOpen || !vehicle) return null;

    const calculateTotal = () => {
        if (!bookingData.startDate || !bookingData.endDate) return 0;
        const start = new Date(bookingData.startDate);
        const end = new Date(bookingData.endDate);
        const diffTime = end.getTime() - start.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return days > 0 ? days * vehicle.pricePerDay : 0;
    };

    const postToEsewa = (paymentData) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentData.esewa_url || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

        Object.keys(paymentData).forEach(key => {
            if (key !== 'esewa_url') {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = paymentData[key];
                form.appendChild(input);
            }
        });

        document.body.appendChild(form);
        form.submit();
    };

    const handleBooking = async () => {
        if (!authUser) {
            navigate('/login');
            return;
        }

        if (!bookingData.startDate || !bookingData.endDate) {
            setError('Please select travel dates.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const payload = {
                vehicleId: vehicle.id,
                startDate: bookingData.startDate,
                endDate: bookingData.endDate,
                totalAmount: calculateTotal()
            };
            const response = await bookingService.create(payload);
            const bookingId = response.id;
            setCurrentBookingId(bookingId);

            if (paymentMethod === 'esewa_epay') {
                const paymentData = await paymentService.initiateEsewa(bookingId);
                postToEsewa(paymentData);
            } else {
                setShowQRView(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Booking process failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const qrImage = getImageUrl('uploads/1772013939843-qr.jpeg');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="bk-overlay" onClick={(e) => e.target.className === 'bk-overlay' && onClose()}>
                    <motion.div
                        className="bk-card"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    >
                        <style>{`
                            .bk-overlay {
                                position: fixed;
                                inset: 0;
                                background: rgba(2, 6, 23, 0.92);
                                backdrop-filter: blur(16px);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                z-index: 9999;
                                padding: 20px;
                            }
                            .bk-card {
                                background: #070b14;
                                width: 100%;
                                max-width: 950px;
                                height: 600px;
                                border-radius: 40px;
                                border: 1px solid rgba(255, 255, 255, 0.05);
                                display: flex;
                                overflow: hidden;
                                position: relative;
                                box-shadow: 0 50px 100px -20px rgba(0,0,0,0.7);
                            }
                            .bk-left {
                                flex: 1.1;
                                padding: 48px;
                                display: flex;
                                flex-direction: column;
                                position: relative;
                                z-index: 1;
                                overflow-y: auto;
                            }
                            .bk-left::-webkit-scrollbar { width: 4px; }
                            .bk-left::-webkit-scrollbar-track { background: transparent; }
                            .bk-left::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                            .bk-left::-webkit-scrollbar-thumb:hover { background: var(--primary); }
                            .bk-right {
                                flex: 1;
                                position: relative;
                                background: #000;
                            }
                            .bk-right img {
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                                opacity: 0.7;
                            }
                            .bk-close {
                                position: absolute;
                                top: 30px;
                                right: 30px;
                                width: 44px;
                                height: 44px;
                                border-radius: 14px;
                                background: rgba(255,255,255,0.03);
                                border: 1px solid rgba(255,255,255,0.08);
                                color: #fff;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                z-index: 50;
                                transition: all 0.4s;
                            }
                            .bk-close:hover { background: #ef4444; border-color: #ef4444; transform: rotate(90deg); }

                            .bk-header h2 { font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
                            .bk-header p { font-size: 0.95rem; color: #64748b; margin-bottom: 35px; }

                            .bk-label { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
                            .bk-date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
                            .bk-field input {
                                width: 100%;
                                background: rgba(255,255,255,0.02);
                                border: 1px solid rgba(255,255,255,0.08);
                                padding: 16px 20px;
                                border-radius: 18px;
                                color: #fff;
                                font-size: 0.95rem;
                                outline: none;
                            }
                            .bk-field input:focus { border-color: var(--primary); }

                            .bk-qr-badge {
                                background: rgba(16,185,129,0.05);
                                border: 1px solid rgba(16,185,129,0.1);
                                padding: 16px;
                                border-radius: 20px;
                                display: flex;
                                align-items: center;
                                gap: 16px;
                            }
                            .bk-qr-icon { width: 40px; height: 40px; background: #10b981; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #000; }
                            .bk-qr-text h4 { color: #fff; font-size: 0.9rem; margin: 0; }
                            .bk-qr-text p { color: #64748b; font-size: 0.75rem; margin: 0; }

                            .bk-summary { margin-top: auto; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); }
                            .bk-price-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                            .bk-price-val { font-size: 1.8rem; color: #fff; font-weight: 900; }

                            .bk-confirm-btn {
                                width: 100%;
                                padding: 20px;
                                border-radius: 20px;
                                background: var(--primary);
                                color: #000;
                                font-weight: 800;
                                border: none;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 12px;
                                transition: 0.3s;
                            }
                            .bk-confirm-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px var(--primary-glow); }
                            .bk-confirm-btn:disabled { 
                                opacity: 0.5; 
                                cursor: not-allowed; 
                                filter: grayscale(1);
                                box-shadow: none;
                            }

                            .bk-right-overlay {
                                position: absolute;
                                bottom: 0; left: 0; right: 0;
                                background: linear-gradient(to top, #000 0%, transparent);
                                padding: 48px;
                            }
                            .bk-veh-name { font-size: 2.2rem; font-weight: 900; color: #fff; margin-bottom: 12px; }

                            .bk-modal-view { position: absolute; inset: 0; background: #070b14; z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 48px; }
                            .bk-qr-container { padding: 20px; background: #fff; border-radius: 24px; margin-bottom: 30px; }
                            .bk-qr-container img { width: 220px; display: block; }
                            .bk-token-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 18px; border-radius: 18px; color: #fff; text-align: center; margin-bottom: 20px; width: 100%; max-width: 300px; }

                            /* Details View Styles */
                            .bk-details-wrap { display: flex; flex-direction: column; height: 100%; gap: 20px; text-align: left; }
                            .bk-owner-card { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; margin-bottom: 10px; }
                            .bk-owner-av { width: 45px; height: 45px; border-radius: 50%; background: var(--primary); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 800; overflow: hidden; }
                            .bk-owner-av img { width: 100%; height: 100%; object-fit: cover; }
                            .bk-owner-info h5 { color: #fff; margin: 0; font-size: 0.9rem; }
                            .bk-owner-info p { color: #64748b; margin: 0; font-size: 0.75rem; }
                            
                            .bk-description { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-bottom: 10px; }
                            .bk-specs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
                            .bk-spec-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 14px; display: flex; align-items: center; gap: 10px; color: #fff; font-size: 0.85rem; }
                            .bk-spec-box span { color: #64748b; font-size: 0.7rem; display: block; text-transform: uppercase; font-weight: 700; }
                        `}</style>

                        {/* QR Payment View */}
                        <AnimatePresence>
                            {showQRView && !success && (
                                <motion.div
                                    className="bk-modal-view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="bk-qr-container">
                                        <img src={qrImage} alt="eSewa QR" />
                                    </div>
                                    <h2 style={{ color: '#fff', marginBottom: '8px' }}>Scan to Pay</h2>
                                    <p style={{ color: '#64748b', marginBottom: '30px' }}>Rs. {calculateTotal()}</p>

                                    {!showTokenInput ? (
                                        <button className="bk-confirm-btn" style={{ maxWidth: '280px', background: '#10b981', color: '#fff' }} onClick={() => setShowTokenInput(true)}>
                                            I have paid <CheckCircle2 size={20} />
                                        </button>
                                    ) : (
                                        <>
                                            <input
                                                className="bk-token-input"
                                                placeholder="Enter Transaction Token"
                                                value={manualToken}
                                                onChange={(e) => setManualToken(e.target.value)}
                                            />
                                            <button
                                                className="bk-confirm-btn"
                                                style={{ maxWidth: '280px' }}
                                                onClick={async () => {
                                                    try {
                                                        await paymentService.verifyManualPayment(currentBookingId, manualToken);
                                                        setSuccess(true);
                                                        setTimeout(() => { onClose(); navigate('/dashboard'); }, 2500);
                                                    } catch (err) {
                                                        setError('Verification failed.');
                                                        setShowTokenInput(false);
                                                    }
                                                }}
                                            >
                                                Verify Payment
                                            </button>
                                        </>
                                    )}
                                    <button style={{ marginTop: '20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }} onClick={() => setShowQRView(false)}>← Back</button>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    className="bk-modal-view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <CheckCircle2 size={60} color="#10b981" style={{ marginBottom: '20px' }} />
                                    <h2 style={{ color: '#fff', fontSize: '2.5rem' }}>Booking Successful!</h2>
                                    <p style={{ color: '#64748b' }}>Your ride for {vehicle.name} is confirmed.</p>
                                    <button className="bk-confirm-btn" style={{ marginTop: '30px', maxWidth: '200px' }} onClick={() => { onClose(); navigate('/dashboard'); }}>Done</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button className="bk-close" onClick={onClose}><X size={20} /></button>

                        <div className="bk-left">
                            {view === 'reserve' ? (
                                <>
                                    <div className="bk-header">
                                        <h2>Secure Hub Slot</h2>
                                        <p>Simple, premium, and instant reservation.</p>
                                    </div>

                                    <div className="bk-label"><Calendar size={14} /> Travel Window</div>
                                    <div className="bk-date-grid">
                                        <div className="bk-field">
                                            <label style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '8px', display: 'block' }}>START DATE</label>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={bookingData.startDate}
                                                onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="bk-field">
                                            <label style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '8px', display: 'block' }}>END DATE</label>
                                            <input
                                                type="date"
                                                min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                                                value={bookingData.endDate}
                                                onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="bk-label"><ShieldCheck size={14} /> Payment Gateway</div>
                                    <div 
                                        className={`bk-qr-badge ${paymentMethod === 'esewa_epay' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('esewa_epay')}
                                        style={{ cursor: 'pointer', marginBottom: '12px', border: paymentMethod === 'esewa_epay' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)', background: paymentMethod === 'esewa_epay' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)' }}
                                    >
                                        <div className="bk-qr-icon" style={{ background: '#5bb343' }}><Zap size={20} /></div>
                                        <div className="bk-qr-text">
                                            <h4>eSewa ePay (Demo)</h4>
                                            <p>Redirect to secure eSewa Portal</p>
                                        </div>
                                        {paymentMethod === 'esewa_epay' && <CheckCircle2 size={18} color="#10b981" style={{ marginLeft: 'auto' }} />}
                                    </div>

                                    <div 
                                        className={`bk-qr-badge ${paymentMethod === 'esewa_qr' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('esewa_qr')}
                                        style={{ cursor: 'pointer', border: paymentMethod === 'esewa_qr' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)', background: paymentMethod === 'esewa_qr' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)' }}
                                    >
                                        <div className="bk-qr-icon" style={{ background: '#10b981' }}><User size={20} /></div>
                                        <div className="bk-qr-text">
                                            <h4>Manual QR Pay</h4>
                                            <p>Scan YatraHub Merchant QR</p>
                                        </div>
                                        {paymentMethod === 'esewa_qr' && <CheckCircle2 size={18} color="#10b981" style={{ marginLeft: 'auto' }} />}
                                    </div>

                                    {isOccupied && (
                                        <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '20px', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            Vehicle is not available for booking during these dates.
                                        </div>
                                    )}

                                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '20px', fontWeight: 700 }}>{error}</div>}

                                    <div className="bk-summary" style={{ marginTop: 'auto' }}>
                                        <div className="bk-price-row">
                                            <span style={{ color: '#64748b', fontWeight: 700 }}>TOTAL FARE</span>
                                            <span className="bk-price-val">Rs. {calculateTotal()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <button className="bk-confirm-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', width: 'auto', padding: '15px 25px' }} onClick={() => setView('details')}>Details</button>
                                            <button
                                                className="bk-confirm-btn"
                                                onClick={handleBooking}
                                                style={{ flex: 1 }}
                                                disabled={submitting || calculateTotal() === 0 || isOccupied}
                                            >
                                                {submitting ? <Loader2 className="animate-spin" /> : <>Lock Reservation <ArrowRight size={20} /></>}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bk-details-wrap">
                                    <div className="bk-header">
                                        <div className="bk-label" style={{ color: '#fff' }}>Vehicle Overview</div>
                                        <h2>{vehicle.name}</h2>
                                        <p>{vehicle.brand} • {displayCategory}</p>
                                    </div>

                                    <div className="bk-owner-card">
                                        <div className="bk-owner-av">
                                            {vehicle.owner?.profileImage ? (
                                                <img src={getImageUrl(vehicle.owner.profileImage)} alt={vehicle.owner.username} />
                                            ) : (
                                                vehicle.owner?.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="bk-owner-info">
                                            <h5>{vehicle.owner?.username}</h5>
                                            <p>Verified Hub Owner</p>
                                        </div>
                                        <div style={{ marginLeft: 'auto', color: '#10b981', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <ShieldCheck size={14} /> VERIFIED
                                        </div>
                                    </div>

                                    <div className="bk-description">
                                        {vehicle.description || `Experience the ultimate journey with our ${vehicle.name}. Well-maintained and equipped for premium comfort and high performance on Nepal's diverse terrains.`}
                                    </div>

                                    <div className="bk-specs-grid">
                                        <div className="bk-spec-box">
                                            <User size={18} color="var(--primary)" />
                                            <div><span>Capacity</span> 5 Person</div>
                                        </div>
                                        <div className="bk-spec-box">
                                            <Fuel size={18} color="var(--primary)" />
                                            <div><span>Fuel Type</span> {vehicle.fuelType || 'Petrol/Diesel'}</div>
                                        </div>
                                        <div className="bk-spec-box">
                                            <Gauge size={18} color="var(--primary)" />
                                            <div><span>Transmission</span> Manual/Auto</div>
                                        </div>
                                        <div className="bk-spec-box">
                                            <MapPin size={18} color="var(--primary)" />
                                            <div><span>Location</span> {vehicle.location || 'Kathmandu'}</div>
                                        </div>
                                    </div>

                                    <div className="bk-summary" style={{ marginTop: 'auto' }}>
                                        <div className="bk-price-row">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800 }}>STARTING FROM</span>
                                                <span className="bk-price-val" style={{ fontSize: '1.4rem' }}>Rs. {vehicle.pricePerDay}<span style={{ fontSize: '0.8rem', opacity: 0.5 }}>/day</span></span>
                                            </div>
                                            <button className="bk-confirm-btn" onClick={() => setView('reserve')} style={{ width: 'auto', padding: '15px 40px' }}>Book This Now <ArrowRight size={20} /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bk-right">
                            <img src={vehicleImageUrl} alt={vehicle.name} />
                            <div className="bk-right-overlay">
                                <h3 className="bk-veh-name">{vehicle.name}</h3>
                                <div style={{ display: 'flex', gap: '20px', color: '#64748b' }}>
                                    <span><User size={14} /> 5 Seats</span>
                                    <span><Fuel size={14} /> Hybrid</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BookingModal;
