import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, Camera, MapPin, DollarSign, FileText, Plus, X,
    Loader2, ArrowLeft, CheckCircle2, ShieldCheck,
    Info, Globe, Zap, Settings, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';
import logoImg from '../assets/logo.png';

const ListVehicle = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [mapOpen, setMapOpen] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'Car',
        serviceType: 'rent',
        pricePerDay: '',
        location: '',
        lat: null,
        lng: null,
        registrationNumber: '',
        description: '',
        features: [],
        images: []
    });

    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [featureInput, setFeatureInput] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationSelect = (data) => {
        setFormData(prev => ({
            ...prev,
            location: data.address,
            lat: data.lat,
            lng: data.lng
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setError('');

        // Generate previews immediately without FileReader overhead for sync feel
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));

        setFiles(prev => [...prev, ...selectedFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);

        console.log("Selected files:", selectedFiles);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, featureInput.trim()]
            }));
            setFeatureInput('');
        }
    };

    const removeFeature = (index) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login');
        setIsSubmitting(true);
        setError('');
        try {
            let uploadedImages = [];
            if (files.length > 0) {
                console.log("Starting image upload for", files.length, "files...");
                const uploadData = new FormData();
                files.forEach(file => uploadData.append('images', file));

                const uploadRes = await vehicleService.uploadImages(uploadData);
                console.log("Upload successful:", uploadRes);
                uploadedImages = uploadRes.imageUrls;
            }
            const vehicleData = {
                ...formData,
                ownerId: user.id,
                images: uploadedImages
            };
            await vehicleService.create(vehicleData);
            setStep(3);
        } catch (error) {
            console.error("Failed to list vehicle:", error);
            const msg = error.response?.data?.message || error.message || "Error listing vehicle. Please check all fields.";
            setError(msg);
            // Also alert for critical visibility
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="list-wrapper">
            <style>{`
                .list-wrapper { background: #020617; min-height: 100vh; color: #fff; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
                .list-nav { height: 90px; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 0 6%; display: flex; align-items: center; justify-content: space-between; background: rgba(2,6,23,0.8); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100; }
                .nav-logo { height: 50px; }
                .list-main { flex: 1; display: flex; justify-content: center; padding: 60px 4%; }
                .form-container-elite { width: 100%; max-width: 900px; }
                .back-btn-elite { display: inline-flex; align-items: center; gap: 10px; color: #94a3b8; text-decoration: none; font-size: 0.9rem; font-weight: 600; margin-bottom: 30px; transition: color 0.3s; }
                .back-btn-elite:hover { color: #f59e0b; }
                .form-card-elite { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 32px; overflow: hidden; position: relative; }
                .form-progress { display: flex; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
                .progress-step { flex: 1; padding: 25px; display: flex; align-items: center; gap: 12px; color: #64748b; font-weight: 700; font-size: 0.85rem; border-right: 1px solid rgba(255,255,255,0.05); position: relative; }
                .progress-step.active { color: #f59e0b; background: rgba(245,158,11,0.05); }
                .progress-step.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: #f59e0b; }
                .step-num { width: 24px; height: 24px; border-radius: 50%; border: 1px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }
                .form-content-elite { padding: 50px; }
                .step-header { margin-bottom: 40px; }
                .step-header h1 { font-size: 2.2rem; font-weight: 900; margin-bottom: 10px; }
                .step-header p { color: #94a3b8; line-height: 1.6; }
                .input-grid-elite { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 30px; }
                .input-group-elite { display: flex; flex-direction: column; gap: 10px; }
                .input-group-elite label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                .input-wrapper-elite { position: relative; display: flex; align-items: center; }
                .input-wrapper-elite svg { position: absolute; left: 16px; color: #f59e0b; }
                .input-wrapper-elite input, .input-wrapper-elite select, .input-wrapper-elite textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px 16px 14px 48px; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; transition: all 0.3s; }
                .input-wrapper-elite input:focus, .input-wrapper-elite select:focus { border-color: #f59e0b; background: rgba(245,158,11,0.03); box-shadow: 0 0 0 4px rgba(245,158,11,0.1); }
                .input-wrapper-elite select { color-scheme: dark; }
                .input-wrapper-elite select option { background: #0f172a; color: #fff; }
                .list-error-alert { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 15px 25px; border-radius: 12px; margin-bottom: 20px; font-weight: 700; font-size: 0.9rem; text-align: center; }
                .image-section-elite { margin-bottom: 40px; }
                .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .section-title-row h3 { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; font-weight: 800; }
                .section-title-row span { font-size: 0.75rem; color: #64748b; font-weight: 700; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 50px; }
                .gallery-grid-elite { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
                .preview-card-elite { aspect-ratio: 1; border-radius: 20px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                .preview-card-elite.main-image { grid-column: span 2; grid-row: span 2; }
                .preview-card-elite img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                .preview-card-elite:hover img { transform: scale(1.08); }
                .img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.6), transparent); opacity: 0; transition: all 0.3s ease; display: flex; flex-direction: column; justify-content: space-between; padding: 15px; }
                .preview-card-elite:hover .img-overlay { opacity: 1; }
                .remove-btn { align-self: flex-end; width: 32px; height: 32px; border-radius: 10px; background: rgba(239, 68, 68, 0.9); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; }
                .remove-btn:hover { transform: scale(1.1); background: #ef4444; }
                .featured-badge { background: #f59e0b; color: #fff; font-size: 0.65rem; font-weight: 900; padding: 5px 12px; border-radius: 50px; text-transform: uppercase; align-self: flex-start; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.4); }
                .upload-card-elite { border: 2px dashed rgba(255,255,255,0.12); border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); aspect-ratio: 1; color: #64748b; background: rgba(255,255,255,0.01); }
                .upload-card-elite:hover { border-color: #f59e0b; background: rgba(245,158,11,0.04); color: #f59e0b; transform: scale(1.02); }
                .upload-card-elite p { font-size: 0.75rem; font-weight: 600; }
                .full-width { grid-column: 1 / -1; }
                .image-drop-elite { background: rgba(255,255,255,0.02); border: 2px dashed rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s; margin-bottom: 30px; }
                .image-drop-elite:hover { border-color: #f59e0b; background: rgba(245,158,11,0.02); }
                .image-previews { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px; margin-top: 20px; }
                .remove-img-btn { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); border: none; color: #fff; border-radius: 4px; padding: 4px; cursor: pointer; }
                .feature-tags-elite { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
                .tag-elite { background: rgba(245,158,11,0.1); color: #f59e0b; padding: 6px 14px; border-radius: 50px; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
                .tag-elite svg { cursor: pointer; opacity: 0.7; }
                .tag-elite svg:hover { opacity: 1; }
                .btn-group-elite { display: flex; justify-content: space-between; align-items: center; margin-top: 50px; }
                .btn-primary-elite { background: #f59e0b; color: #fff; border: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 12px; font-size: 1rem; }
                .btn-primary-elite:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(245,158,11,0.3); background: #fff; color: #020617; }
                .btn-secondary-elite { background: transparent; color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); padding: 16px 36px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
                .btn-secondary-elite:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: #fff; }
                .success-wrap { text-align: center; padding: 40px 0; }
                .success-icon-wrap { width: 100px; height: 100px; background: rgba(16,185,129,0.1); color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>

            <nav className="list-nav">
                <Link to="/">
                    <img src={logoImg} alt="YatraHub" className="nav-logo" />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div className="user-icon" style={{ background: '#f59e0b', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{user?.username?.[0].toUpperCase()}</div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.username}</span>
                </div>
            </nav>

            <main className="list-main">
                <div className="form-container-elite">
                    <Link to="/dashboard" className="back-btn-elite">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </Link>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="list-error-alert">
                            {error}
                        </motion.div>
                    )}

                    <div className="form-card-elite">
                        <div className="form-progress">
                            <div className={`progress-step ${step === 1 ? 'active' : ''}`}>
                                <div className="step-num">1</div>
                                <span>VEHICLE DETAILS</span>
                            </div>
                            <div className={`progress-step ${step === 2 ? 'active' : ''}`}>
                                <div className="step-num">2</div>
                                <span>MEDIA & EXTRAS</span>
                            </div>
                            <div className={`progress-step ${step === 3 ? 'active' : ''}`} style={{ border: 'none' }}>
                                <div className="step-num">3</div>
                                <span>CONFIRMATION</span>
                            </div>
                        </div>

                        <div className="form-content-elite">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} key="step1">
                                        <div className="step-header">
                                            <h1>Vehicle Information</h1>
                                            <p>Register your vehicle on YatraHub's premium fleet. Provide accurate details for better rental visibility.</p>
                                        </div>

                                        <div className="input-grid-elite">
                                            <div className="input-group-elite full-width">
                                                <label>Primary Vehicle Name</label>
                                                <div className="input-wrapper-elite">
                                                    <Car size={20} />
                                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Mahindra Scorpio S11" required />
                                                </div>
                                            </div>

                                            <div className="input-group-elite">
                                                <label>Brand</label>
                                                <div className="input-wrapper-elite">
                                                    <Globe size={20} />
                                                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Mahindra" required />
                                                </div>
                                            </div>

                                            <div className="input-group-elite">
                                                <label>Model Variant</label>
                                                <div className="input-wrapper-elite">
                                                    <Zap size={20} />
                                                    <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="e.g. Scorpio Classic" required />
                                                </div>
                                            </div>

                                            <div className="input-group-elite">
                                                <label>Manufacturing Year</label>
                                                <div className="input-wrapper-elite">
                                                    <Settings size={20} />
                                                    <input type="number" name="year" value={formData.year} onChange={handleChange} required />
                                                </div>
                                            </div>

                                            <div className="input-group-elite">
                                                <label>Service Mode</label>
                                                <div className="input-wrapper-elite">
                                                    <Zap size={20} />
                                                    <select name="serviceType" value={formData.serviceType} onChange={handleChange} style={{ paddingLeft: 48 }}>
                                                        <option value="rent">Self-Drive Rental</option>
                                                        <option value="ride">Ride-Hailing (With Driver)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="input-group-elite">
                                                <label>Vehicle Category</label>
                                                <div className="input-wrapper-elite">
                                                    <ShieldCheck size={20} />
                                                    <select name="type" value={formData.type} onChange={handleChange} style={{ paddingLeft: 48 }}>
                                                        <option value="Bike">Bike</option>
                                                        <option value="Scooter">Scooter</option>
                                                        <option value="Luxury Vehicle">Luxury Vehicle</option>
                                                        <option value="Car">Car</option>
                                                        <option value="SUV/off-roading">SUV/off-roading</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="input-group-elite">
                                                <label>Rental Valuation (Rs./Day)</label>
                                                <div className="input-wrapper-elite">
                                                    <span style={{ position: 'absolute', left: 16, color: '#f59e0b', fontWeight: 800 }}>Rs.</span>
                                                    <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} placeholder="0.00" required />
                                                </div>
                                            </div>

                                            <div className="input-group-elite">
                                                <label>Registration Number</label>
                                                <div className="input-wrapper-elite">
                                                    <FileText size={20} />
                                                    <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="e.g. BA 1 PA 1234" required />
                                                </div>
                                            </div>

                                            <div className="input-group-elite full-width">
                                                <label>Pickup Location</label>
                                                <div className="input-wrapper-elite" style={{ cursor: 'pointer' }} onClick={() => setMapOpen(true)}>
                                                    <MapPin size={20} />
                                                    <input type="text" value={formData.location} readOnly placeholder="Select base location on map..." required />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="btn-group-elite" style={{ justifyContent: 'flex-end' }}>
                                            <button type="button" className="btn-primary-elite" onClick={() => setStep(2)}>
                                                Next Step <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} key="step2">
                                        <div className="step-header">
                                            <h1>Media & Assets</h1>
                                            <p>Showcase your vehicle with high-quality imagery and detailed features to attract premium seekers.</p>
                                        </div>

                                        <div className="image-section-elite">
                                            <div className="section-title-row">
                                                <h3>Vehicle Visuals</h3>
                                                <span>{previews.length} / 10 Assets</span>
                                            </div>

                                            <div className="gallery-grid-elite">
                                                {previews.map((src, i) => (
                                                    <div key={i} className={`preview-card-elite ${i === 0 ? 'main-image' : ''}`}>
                                                        <img src={src} alt="" />
                                                        <div className="img-overlay">
                                                            <button type="button" className="remove-btn" onClick={() => removeFile(i)}><X size={16} /></button>
                                                            {i === 0 && <span className="featured-badge">Cover Photo</span>}
                                                        </div>
                                                    </div>
                                                ))}

                                                {previews.length < 10 && (
                                                    <label className="upload-card-elite">
                                                        <input type="file" multiple accept="image/*" onChange={handleFileChange} hidden />
                                                        <Camera size={28} />
                                                        <p>Add {previews.length === 0 ? 'Photos' : 'More'}</p>
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <div className="input-group-elite" style={{ marginBottom: 30 }}>
                                            <label>Executive Summary / Description</label>
                                            <div className="input-wrapper-elite">
                                                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the luxury, performance, and maintenance history..." rows="4" style={{ paddingLeft: 16 }}></textarea>
                                            </div>
                                        </div>

                                        <div className="input-group-elite">
                                            <label>Premium Features</label>
                                            <div className="input-wrapper-elite">
                                                <Plus size={20} />
                                                <input
                                                    type="text"
                                                    value={featureInput}
                                                    onChange={(e) => setFeatureInput(e.target.value)}
                                                    placeholder="Add features like: Sunroof, Chauffeur, Hybrid, etc."
                                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                                />
                                                <button type="button" onClick={addFeature} style={{ position: 'absolute', right: 10, background: '#f59e0b', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>ADD</button>
                                            </div>
                                            <div className="feature-tags-elite">
                                                {formData.features.map((f, i) => (
                                                    <span key={i} className="tag-elite">
                                                        {f} <X size={14} onClick={() => removeFeature(i)} />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="btn-group-elite">
                                            <button type="button" className="btn-secondary-elite" onClick={() => setStep(1)}>Back</button>
                                            <button type="button" className="btn-primary-elite" onClick={handleSubmit} disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finalize Listing <CheckCircle2 size={20} /></>}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key="step3" className="success-wrap">
                                        <div className="success-icon-wrap">
                                            <CheckCircle2 size={50} />
                                        </div>
                                        <h1>Vehicle Registered!</h1>
                                        <p style={{ maxWidth: 500, margin: '0 auto 40px', color: '#94a3b8' }}>Your vehicle has been successfully inducted into the YatraHub premium fleet. It is now undergoing verification.</p>
                                        <Link to="/dashboard" className="btn-primary-elite" style={{ display: 'inline-flex', textDecoration: 'none', margin: '0 auto' }}>
                                            Enter Command Center <ChevronRight size={20} />
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            <LocationPicker
                isOpen={mapOpen}
                onClose={() => setMapOpen(false)}
                onSelect={handleLocationSelect}
                title="Select Deployment Base"
            />
        </div>
    );
};

export default ListVehicle;
