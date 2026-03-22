import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentFailure = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-page-wrapper" style={{ flexDirection: 'column' }}>
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '60px 40px' }}
            >
                <XCircle size={64} color="#ef4444" style={{ margin: '0 auto' }} />
                <h2 style={{ color: '#fff', marginTop: '30px' }}>Payment Aborted</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>The transaction was cancelled or failed. No charges were made to your eSewa wallet.</p>
                <button
                    className="auth-submit-btn"
                    style={{ marginTop: '40px', background: '#334155' }}
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
            </motion.div>
        </div>
    );
};

export default PaymentFailure;
