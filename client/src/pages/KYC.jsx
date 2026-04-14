import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Upload, FileText, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

const KYC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        idType: 'Citizenship',
        idNumber: ''
    });
    const [files, setFiles] = useState([]);

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const data = new FormData();
        data.append('fullName', formData.fullName);
        data.append('idType', formData.idType);
        data.append('idNumber', formData.idNumber);
        files.forEach(file => data.append('documents', file));

        try {
            const res = await userService.submitKyc(data);
            const updatedUser = { ...user, kycStatus: 'pending' };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setSuccess(true);
        } catch (err) {
            console.error("KYC submission failed:", err);
            alert("Submission failed. Ensure documents are uploaded. " + (err.response?.data?.message || ""));
        } finally {
            setSubmitting(false);
        }
    };

    if (success || user?.kycStatus === 'pending') {
        return (
            <div className="kyc-success-overlay">
                <style>{`
                    .kyc-success-overlay {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: #020617; display: flex; align-items: center; justify-content: center;
                        z-index: 1000; font-family: 'Inter', sans-serif;
                        background-image: radial-gradient(circle at 50% 50%, rgba(245,158,11,0.08) 0%, transparent 50%);
                    }
                    .success-content {
                        background: rgba(255,255,255,0.02); 
                        border: 1px solid rgba(255,255,255,0.06);
                        padding: 80px 60px; 
                        border-radius: 40px; 
                        text-align: center; 
                        max-width: 580px;
                        width: 90%;
                        backdrop-filter: blur(30px);
                        box-shadow: 0 50px 100px rgba(0,0,0,0.6);
                        position: relative;
                        overflow: hidden;
                    }
                    .success-content::before {
                        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
                        background: linear-gradient(90deg, transparent, #f59e0b, transparent);
                    }
                    .icon-glow {
                        width: 100px; height: 100px; background: rgba(16,185,129,0.1);
                        border-radius: 30px; display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 30px; color: #10b981;
                        box-shadow: 0 0 40px rgba(16,185,129,0.2);
                    }
                    .success-content h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 16px; color: #fff; letter-spacing: -1px; }
                    .success-content p { color: #94a3b8; margin-bottom: 40px; line-height: 1.8; font-size: 1.1rem; }
                    .back-dash-btn {
                        display: flex; align-items: center; justify-content: center; gap: 10px;
                        background: linear-gradient(135deg, #f59e0b, #d97706); color: #000;
                        padding: 18px 40px; border-radius: 20px; text-decoration: none;
                        font-weight: 800; font-size: 1.1rem; transition: all 0.3s;
                        box-shadow: 0 15px 30px rgba(245,158,11,0.2);
                    }
                    .back-dash-btn:hover { transform: translateY(-3px); box-shadow: 0 20px 50px rgba(245,158,11,0.4); }
                `}</style>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="success-content"
                >
                    <div className="icon-glow">
                        <CheckCircle2 size={50} />
                    </div>
                    <h1>KYC Under Review</h1>
                    <p>Your documents have been encrypted and submitted for verification. Our safety team will review your submission within 24-48 business hours.</p>
                    <Link to="/dashboard" className="back-dash-btn">
                        Return to Control Center <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="kyc-wrapper">
            <style>{`
                :root {
                    --kyc-primary: #f59e0b;
                    --kyc-bg: #030712;
                    --kyc-card: rgba(255,255,255,0.02);
                    --kyc-border: rgba(255,255,255,0.06);
                    --kyc-text: #f8fafc;
                    --kyc-muted: #94a3b8;
                }
                .kyc-wrapper {
                    background: var(--kyc-bg); color: var(--kyc-text); min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                    background-image: radial-gradient(circle at 0% 0%, rgba(245,158,11,0.05) 0%, transparent 40%);
                }
                .kyc-nav { padding: 25px 50px; border-bottom: 1px solid var(--kyc-border); display: flex; justify-content: center; }
                .kyc-logo { height: 45px; }

                .kyc-container { max-width: 700px; margin: 60px auto; padding: 0 20px; }
                .kyc-back { display: flex; align-items: center; gap: 8px; color: var(--kyc-muted); text-decoration: none; margin-bottom: 30px; font-size: 0.9rem; }
                .kyc-back:hover { color: #fff; }

                .kyc-card {
                    background: var(--kyc-card); border: 1px solid var(--kyc-border);
                    border-radius: 32px; padding: 50px; backdrop-filter: blur(20px);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                }
                .kyc-head { text-align: center; margin-bottom: 40px; }
                .kyc-head h1 { font-size: 2.2rem; font-weight: 800; margin: 15px 0 10px; }
                .kyc-head p { color: var(--kyc-muted); line-height: 1.6; font-size: 1rem; }

                .kyc-form { display: flex; flex-direction: column; gap: 24px; }
                .form-sec { display: flex; flex-direction: column; gap: 10px; }
                .form-sec label { font-size: 0.75rem; font-weight: 700; color: var(--kyc-muted); letter-spacing: 1px; }
                
                .form-input {
                    background: rgba(255,255,255,0.03); border: 1px solid var(--kyc-border);
                    border-radius: 16px; padding: 15px 20px; color: #fff; font-size: 1rem;
                    outline: none; transition: border 0.3s; width: 100%;
                }
                .form-input:focus { border-color: var(--kyc-primary); }

                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

                .dropzone {
                    border: 2px dashed var(--kyc-border); border-radius: 18px;
                    padding: 40px; text-align: center; cursor: pointer;
                    transition: all 0.3s; display: flex; flex-direction: column;
                    align-items: center; gap: 12px; background: rgba(255,255,255,0.01);
                    position: relative;
                }
                .dropzone:hover { border-color: var(--kyc-primary); background: rgba(245,158,11,0.02); }
                .dropzone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
                .dropzone span { font-size: 0.9rem; color: var(--kyc-muted); }

                .submit-btn {
                    background: var(--kyc-primary); color: #000; border: none;
                    padding: 18px; border-radius: 16px; font-weight: 800;
                    font-size: 1.1rem; cursor: pointer; transition: all 0.3s;
                    margin-top: 20px; display: flex; align-items: center; justify-content: center;
                }
                .submit-btn:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(245,158,11,0.3); }
                .submit-btn:disabled { opacity: 0.5; transform: none; cursor: not-allowed; }

                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>

            <nav className="kyc-nav">
                <img src={logoImg} alt="Logo" className="kyc-logo" />
            </nav>

            <div className="kyc-container">
                <Link to="/profile" className="kyc-back"><ArrowLeft size={16} /> Back to Profile</Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="kyc-card"
                >
                    <div className="kyc-head">
                        <ShieldCheck size={50} color="var(--kyc-primary)" />
                        <h1>Identity Verification</h1>
                        <p>Verify your account to ensure a safe experience for all YatraHub members.</p>
                    </div>

                    <form className="kyc-form" onSubmit={handleSubmit}>
                        <div className="form-sec">
                            <label>FULL LEGAL NAME</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Enter as per your ID document"
                            />
                        </div>

                        <div className="form-sec">
                            <label>DOCUMENT TYPE</label>
                            <div className="doc-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                {[
                                    { id: 'Citizenship', icon: <ShieldCheck size={18} /> },
                                    { id: 'Driving License', icon: <FileText size={18} /> },
                                    { id: 'Passport', icon: <CheckCircle2 size={18} /> }
                                ].map(doc => (
                                    <div
                                        key={doc.id}
                                        onClick={() => setFormData({ ...formData, idType: doc.id })}
                                        className={`doc-card ${formData.idType === doc.id ? 'active' : ''}`}
                                        style={{
                                            padding: '15px',
                                            borderRadius: '16px',
                                            background: formData.idType === doc.id ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                                            border: formData.idType === doc.id ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.3s ease',
                                            color: formData.idType === doc.id ? '#f59e0b' : '#94a3b8'
                                        }}
                                    >
                                        {doc.icon}
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>{doc.id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-sec">
                            <label>DOCUMENT ID NUMBER</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={formData.idNumber}
                                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                placeholder="Number on ID"
                            />
                        </div>

                        <div className="form-sec">
                            <label>UPLOAD IDENTIFICATION DOCUMENTS</label>
                            <div className="dropzone">
                                <input type="file" multiple required onChange={handleFileChange} />
                                <Upload size={30} color="var(--kyc-primary)" />
                                <strong>{files.length > 0 ? `${files.length} Documents Selected` : 'Click to Upload Documents'}</strong>
                                <span>Front, Back, and a Selfie with ID</span>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={submitting}>
                            {submitting ? <Loader2 className="animate-spin" /> : 'Start Verification Process'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default KYC;
