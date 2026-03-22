import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { paymentService } from '../services/api';

const PaymentSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    useEffect(() => {
        const verify = async () => {
            const params = new URLSearchParams(location.search);
            const data = params.get('data');

            if (!data) {
                setStatus('error');
                setVerifying(false);
                return;
            }

            try {
                await paymentService.verifyEsewa(data);
                setStatus('success');
            } catch (err) {
                console.error('Verification failed:', err);
                setStatus('error');
            } finally {
                setVerifying(false);
            }
        };

        verify();
    }, [location]);

    return (
        <div className="auth-page-wrapper" style={{ flexDirection: 'column' }}>
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '60px 40px' }}
            >
                {status === 'verifying' && (
                    <>
                        <Loader2 className="animate-spin" size={64} color="var(--primary)" style={{ margin: '0 auto' }} />
                        <h2 style={{ color: '#fff', marginTop: '30px' }}>Finalizing Transaction</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Authenticating your payment with eSewa Secure Nodes...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto' }} />
                        <h2 style={{ color: '#fff', marginTop: '30px' }}>Payment Confirmed!</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Your hub reservation is now fully secured and confirmed.</p>
                        <button
                            className="auth-submit-btn"
                            style={{ marginTop: '40px' }}
                            onClick={() => navigate('/dashboard')}
                        >
                            Return to Command Center <ArrowRight size={20} />
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ color: '#ef4444', fontSize: '4rem', fontWeight: '900' }}>!</div>
                        <h2 style={{ color: '#fff', marginTop: '30px' }}>Verification Lag</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>We couldn't instantly verify the payment. Please check your dashboard in a few minutes.</p>
                        <button
                            className="auth-submit-btn"
                            style={{ marginTop: '40px', background: '#334155' }}
                            onClick={() => navigate('/dashboard')}
                        >
                            Back to Dashboard
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
