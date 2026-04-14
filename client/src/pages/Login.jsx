import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowLeft, Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import logoImg from '../assets/logo.png';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, googleLogin } = useAuth();
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
        setIsSubmitting(true);
        setError('');

        try {
            const user = await login(formData);
            if (user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error("Login error:", err);
            const msg = err.response?.data?.message || err.message || 'Invalid email or password. Please try again.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
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
                    <img src={logoImg} alt="YatraHub" style={{ height: '55px', marginBottom: '10px', filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.4))' }} />
                    <h2>Elite Access</h2>
                    <p>Welcome back to Nepal's premium mobility network.</p>
                </div>

                <div className="auth-social-group">
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 20px 0', width: '100%' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login error.')}
                        />
                    </div>
                    <div className="auth-divider">
                        <span>or with email</span>
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

                    <button
                        type="submit"
                        className="btn-auth-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} /> : 'Sign In to Hub'}
                    </button>
                </form>

                <div className="auth-footer-premium">
                    New to the network? <Link to="/signup">Apply for Membership</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
