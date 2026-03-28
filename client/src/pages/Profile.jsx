import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Loader2, CheckCircle, ArrowLeft, ShieldAlert, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationDropdown from '../components/NotificationDropdown';
import { userService, vehicleService, getImageUrl } from '../services/api';
import logoImg from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({
        username: '',
        phoneNumber: '',
        address: '',
        profileImage: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const { unreadNotiCount } = useSocket();

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                profileImage: user.profileImage || ''
            });
        }
    }, [user]);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('images', file);

        try {
            const res = await vehicleService.uploadImages(formData);
            const imageUrl = res.imageUrls[0];
            const updatedUser = await userService.updateProfile({ profileImage: imageUrl });
            setProfileData(prev => ({ ...prev, profileImage: imageUrl }));
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Avatar upload failed:", err);
            setError(err.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setError('');
        try {
            const updatedUser = await userService.updateProfile(profileData);
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Profile update failed:", err);
            setError(err.response?.data?.message || "Update failed");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="prof-wrapper">
            <style>{`
                :root {
                    --prof-primary: #f59e0b;
                    --prof-dark: #020617;
                    --prof-bg: #030712;
                    --prof-card: rgba(255,255,255,0.02);
                    --prof-border: rgba(255,255,255,0.06);
                    --prof-text: #f8fafc;
                    --prof-muted: #94a3b8;
                }
                .prof-wrapper { 
                    background: var(--prof-bg); 
                    color: var(--prof-text); 
                    min-height: 100vh; 
                    font-family: 'Inter', sans-serif;
                    background-image: radial-gradient(circle at 50% 0%, rgba(245,158,11,0.05) 0%, transparent 50%),
                                      radial-gradient(circle at 100% 100%, rgba(59,130,246,0.05) 0%, transparent 50%);
                }
                .prof-nav {
                    padding: 20px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--prof-border);
                    background: rgba(2,6,23,0.5);
                    backdrop-filter: blur(10px);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .prof-logo { height: 40px; object-fit: contain; }
                .prof-back-btn { 
                    display: flex; 
                    align-items: center; 
                    gap: 8px; 
                    color: var(--prof-muted); 
                    text-decoration: none; 
                    font-size: 0.9rem;
                    transition: color 0.3s;
                }
                .prof-back-btn:hover { color: #fff; }

                .prof-container {
                    max-width: 900px;
                    margin: 60px auto;
                    padding: 0 20px;
                }

                .prof-card {
                    background: var(--prof-card);
                    border: 1px solid var(--prof-border);
                    border-radius: 32px;
                    overflow: hidden;
                    backdrop-filter: blur(20px);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.4);
                }

                .prof-hero {
                    padding: 60px 40px;
                    background: linear-gradient(180deg, rgba(245,158,11,0.05) 0%, transparent 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    border-bottom: 1px solid var(--prof-border);
                }

                .avatar-stack {
                    position: relative;
                    margin-bottom: 24px;
                }
                .prof-avatar-main {
                    width: 140px;
                    height: 140px;
                    border-radius: 40px;
                    object-fit: cover;
                    border: 4px solid var(--prof-border);
                    background: var(--prof-dark);
                }
                .prof-avatar-placeholder {
                    width: 140px;
                    height: 140px;
                    border-radius: 40px;
                    background: linear-gradient(135deg, var(--prof-primary), #fbbf24);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: 800;
                    color: #fff;
                }
                .avatar-upload-btn {
                    position: absolute;
                    bottom: -10px;
                    right: -10px;
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    background: var(--prof-primary);
                    color: #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 10px 20px rgba(245,158,11,0.4);
                    transition: transform 0.3s;
                }
                .avatar-upload-btn:hover { transform: scale(1.1) rotate(5deg); }

                .prof-title { font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; }
                .prof-tag-row { display: flex; gap: 12px; }
                .prof-badge {
                    padding: 6px 16px;
                    border-radius: 50px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .prof-badge.verified { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
                .prof-badge.pending { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
                .prof-badge.none { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

                .prof-body { padding: 50px 80px; }
                .prof-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                .field-item { display: flex; flex-direction: column; gap: 10px; }
                .field-item label { 
                    font-size: 0.75rem; 
                    font-weight: 700; 
                    color: var(--prof-muted); 
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .field-input-wrap {
                    position: relative;
                }
                .field-input-wrap input {
                    width: 100%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--prof-border);
                    border-radius: 16px;
                    padding: 15px 20px;
                    color: #fff;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.3s;
                }
                .field-input-wrap input:focus {
                    border-color: var(--prof-primary);
                    background: rgba(245,158,11,0.02);
                    box-shadow: 0 0 0 4px rgba(245,158,11,0.05);
                }
                .field-input-wrap input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    background: rgba(255,255,255,0.01);
                }

                .prof-footer {
                    margin-top: 50px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 24px;
                }

                .save-btn {
                    padding: 16px 48px;
                    border-radius: 18px;
                    background: var(--prof-primary);
                    color: #000;
                    border: none;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.3s;
                    box-shadow: 0 15px 30px rgba(245,158,11,0.2);
                }
                .save-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 20px 40px rgba(245,158,11,0.3);
                }
                .save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .kyc-verify-banner {
                    width: 100%;
                    padding: 30px;
                    background: rgba(59,130,246,0.05);
                    border: 1px solid rgba(59,130,246,0.1);
                    border-radius: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 20px;
                }
                .verify-link {
                    background: #fff;
                    color: #000;
                    padding: 10px 24px;
                    border-radius: 12px;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                }
                .verify-link:hover { transform: scale(1.05); }

                @media (max-width: 768px) {
                    .prof-grid { grid-template-columns: 1fr; }
                    .prof-body { padding: 40px 20px; }
                }

                .prof-alert {
                    position: fixed;
                    top: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 16px 32px;
                    border-radius: 100px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .prof-alert.success { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
                .prof-alert.error { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>

            <nav className="prof-nav">
                <Link to="/">
                    <img src={logoImg} alt="YatraHub" className="prof-logo" />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--prof-muted)',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px',
                                transition: '0.3s'
                            }}
                        >
                            <Bell size={22} />
                            {unreadNotiCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '0px',
                                    right: '0px',
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
                                    border: '2px solid var(--prof-bg)'
                                }}>
                                    {unreadNotiCount}
                                </span>
                            )}
                        </button>
                        <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                    </div>
                    <Link to="/dashboard" className="prof-back-btn">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </Link>
                </div>
            </nav>
            {error && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="prof-alert error">
                    {error}
                </motion.div>
            )}

            <div className="prof-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prof-card"
                >
                    <div className="prof-hero">
                        <div className="avatar-section">
                            <div className="avatar-stack">
                                {profileData.profileImage ? (
                                    <img src={getImageUrl(profileData.profileImage)} alt="Avatar" className="prof-avatar-main" />
                                ) : (
                                    <div className="prof-avatar-placeholder">{profileData.username?.charAt(0).toUpperCase()}</div>
                                )}
                                <label className="avatar-upload-btn">
                                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                                    <input type="file" onChange={handleAvatarChange} hidden accept="image/*" />
                                </label>
                            </div>
                        </div>
                        <h1 className="prof-title">{profileData.username || 'User Profile'}</h1>
                        <div className="prof-tag-row">
                            {user?.kycStatus === 'verified' && (
                                <span className="prof-badge verified">
                                    <CheckCircle size={12} style={{ marginRight: '6px' }} /> IDENTITY VERIFIED
                                </span>
                            )}
                            {user?.kycStatus === 'pending' && (
                                <span className="prof-badge pending">
                                    <Loader2 className="animate-spin" size={12} style={{ marginRight: '6px' }} /> VERIFICATION PENDING
                                </span>
                            )}
                            {user?.kycStatus === 'rejected' && (
                                <span className="prof-badge none">
                                    <ShieldAlert size={12} style={{ marginRight: '6px' }} /> VERIFICATION REJECTED
                                </span>
                            )}
                            {(user?.kycStatus === 'none' || !user?.kycStatus) && (
                                <span className="prof-badge none">
                                    NOT IDENTITY VERIFIED
                                </span>
                            )}
                        </div>
                    </div>

                    <form className="prof-body" onSubmit={handleSubmit}>
                        <div className="prof-grid">
                            <div className="field-item">
                                <label><User size={14} /> DISPLAY NAME</label>
                                <div className="field-input-wrap">
                                    <input
                                        type="text"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>
                            <div className="field-item">
                                <label><Mail size={14} /> EMAIL ADDRESS</label>
                                <div className="field-input-wrap">
                                    <input type="email" value={user?.email} disabled />
                                </div>
                            </div>
                            <div className="field-item">
                                <label><Phone size={14} /> PHONE NUMBER</label>
                                <div className="field-input-wrap">
                                    <input
                                        type="tel"
                                        value={profileData.phoneNumber}
                                        onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                        placeholder="+977-98XXXXXXXX"
                                    />
                                </div>
                            </div>
                            <div className="field-item">
                                <label><MapPin size={14} /> RESIDENTIAL ADDRESS</label>
                                <div className="field-input-wrap">
                                    <input
                                        type="text"
                                        value={profileData.address}
                                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                        placeholder="City, District, Nepal"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="prof-footer">
                            <button type="submit" className="save-btn" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="animate-spin" /> : (success ? <CheckCircle /> : 'Update Account Profile')}
                            </button>

                            {user?.kycStatus === 'none' && (
                                <div className="kyc-verify-banner">
                                    <div>
                                        <h4 style={{ margin: 0 }}>Identity Verification Shield</h4>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'var(--prof-muted)' }}>Verify your KYC to unlock full platform features.</p>
                                    </div>
                                    <Link to="/kyc" className="verify-link">Verify Now</Link>
                                </div>
                            )}
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;
