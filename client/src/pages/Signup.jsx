import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Phone, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import logoImg from '../assets/logo.png';
import signupVideo from '../assets/bike1video.mp4';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        role: 'seeker'
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsSubmitting(true);
        try {
            await googleLogin(credentialResponse.credential);
            navigate('/dashboard');
        } catch (err) {
            setError('Google Login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }

        setIsSubmitting(true);
        setError('');

        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phoneNumber,
                role: formData.role
            });
            navigate('/');
        } catch (err) {
            console.error("Signup error:", err);
            const msg = err.response?.data?.message || err.message || 'Failed to create account. Please try again.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            {/* Visual Background */}
            <div className="auth-bg-visual" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden' }}>
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
                >
                    <source src={signupVideo} type="video/mp4" />
                </video>
            </div>

            <Link to="/" className="back-to-home">
                <ArrowLeft size={18} /> Back to Hub
            </Link>

            <motion.div
                className="auth-card-premium"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="auth-header-premium">
                    <img src={logoImg} alt="YatraHub" style={{ height: '30px', marginBottom: '5px', filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.4))' }} />
                    <h2>Create Membership</h2>
                    <p>Join Nepal's most exclusive mobility network.</p>
                </div>

                <div className="auth-social-group">
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 20px 0', width: '100%' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login error.')}
                        />
                    </div>
                    <div className="auth-divider">
                        <span>or join with email</span>
                    </div>
                </div>

                {error && (
                    <motion.div
                        className="auth-error-msg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="premium-input-wrap">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="username"
                                className="premium-input"
                                placeholder="Your full name"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            <User className="input-icon-premium" size={20} />
                        </div>

                        <div className="premium-input-wrap">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                className="premium-input"
                                placeholder="+977"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                required
                            />
                            <Phone className="input-icon-premium" size={20} />
                        </div>
                    </div>

                    <div className="premium-input-wrap">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="premium-input"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <Mail className="input-icon-premium" size={20} />
                    </div>

                    <div className="premium-input-wrap">
                        <label>Membership Role</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            {/* SEEKER */}
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '12px 8px', borderRadius: '14px', cursor: 'pointer', textAlign: 'center', gap: '6px',
                                border: `2px solid ${formData.role === 'seeker' ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                                background: formData.role === 'seeker' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                                transition: 'all 0.3s ease'
                            }}>
                                <input type="radio" name="role" value="seeker" checked={formData.role === 'seeker'} onChange={handleChange} style={{ display: 'none' }} />
                                <span style={{ fontSize: '1.4rem' }}>🚗</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: formData.role === 'seeker' ? '#f59e0b' : '#94a3b8', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Rent a Vehicle</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748b', lineHeight: 1.3 }}>Rent vehicles from owners</span>
                            </label>

                            {/* OWNER */}
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '12px 8px', borderRadius: '14px', cursor: 'pointer', textAlign: 'center', gap: '6px',
                                border: `2px solid ${formData.role === 'owner' ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                                background: formData.role === 'owner' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                                transition: 'all 0.3s ease'
                            }}>
                                <input type="radio" name="role" value="owner" checked={formData.role === 'owner'} onChange={handleChange} style={{ display: 'none' }} />
                                <span style={{ fontSize: '1.4rem' }}>🚙</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: formData.role === 'owner' ? '#f59e0b' : '#94a3b8', letterSpacing: '0.3px', textTransform: 'uppercase' }}>List Vehicle</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748b', lineHeight: 1.3 }}>Earn by listing yours</span>
                            </label>

                            {/* RIDER */}
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '12px 8px', borderRadius: '14px', cursor: 'pointer', textAlign: 'center', gap: '6px',
                                border: `2px solid ${formData.role === 'rider' ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                                background: formData.role === 'rider' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                                transition: 'all 0.3s ease'
                            }}>
                                <input type="radio" name="role" value="rider" checked={formData.role === 'rider'} onChange={handleChange} style={{ display: 'none' }} />
                                <span style={{ fontSize: '1.4rem' }}>🏍️</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: formData.role === 'rider' ? '#3b82f6' : '#94a3b8', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Rider</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748b', lineHeight: 1.3 }}>Accept & drive rides</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="premium-input-wrap">
                            <label>Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="premium-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{ paddingRight: '45px' }}
                            />
                            <Lock className="input-icon-premium" size={20} />
                            <button
                                type="button"
                                className="password-toggle-premium"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="premium-input-wrap">
                            <label>Confirm Password</label>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                className="premium-input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                style={{ paddingRight: '45px' }}
                            />
                            <Lock className="input-icon-premium" size={20} />
                            <button
                                type="button"
                                className="password-toggle-premium"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-auth-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} /> : 'Create Membership'}
                    </button>
                </form>

                <div className="auth-footer-premium">
                    Already a member? <Link to="/login">Sign In to Hub</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
