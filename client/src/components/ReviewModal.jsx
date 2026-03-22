import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, User, Loader2, MessageSquare } from 'lucide-react';
import { reviewService, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReviewModal = ({ isOpen, onClose, vehicle }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && vehicle) {
            fetchReviews();
        }
    }, [isOpen, vehicle]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const data = await reviewService.getForVehicle(vehicle.id);
            setReviews(data || []);
        } catch (err) {
            console.error("Failed to load reviews:", err);
            setError("Failed to load reviews.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError("You must be logged in to leave a review.");
            return;
        }
        if (rating < 1 || rating > 5) {
            setError("Rating must be between 1 and 5.");
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            await reviewService.addReview({
                vehicleId: vehicle.id,
                rating,
                comment
            });
            // Reset form and reload reviews
            setComment('');
            setRating(5);
            fetchReviews();
        } catch (err) {
            console.error("Failed to add review:", err);
            setError(err.response?.data?.message || "Failed to add review.");
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : 0;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="r-modal-overlay" onClick={onClose}>
                <style>{`
                    .r-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
                    .r-modal-content { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; width: 100%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; position: relative; }
                    .r-modal-header { padding: 25px 30px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(2,6,23,0.5); }
                    .r-modal-title h3 { font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 5px; }
                    .r-modal-title p { font-size: 0.85rem; color: #94a3b8; }
                    .r-close-btn { background: rgba(255,255,255,0.05); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
                    .r-close-btn:hover { background: rgba(239,68,68,0.2); color: #ef4444; transform: rotate(90deg); }
                    
                    .r-modal-body { padding: 30px; overflow-y: auto; flex: 1; }
                    
                    .r-stats-banner { background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.2); padding: 20px; border-radius: 16px; display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
                    .r-big-rating { font-size: 3rem; font-weight: 900; color: #06b6d4; line-height: 1; }
                    .r-stat-info h4 { font-size: 1.1rem; color: #fff; margin-bottom: 4px; }
                    .r-stat-info p { font-size: 0.85rem; color: #94a3b8; }
                    
                    .r-list { display: flex; flex-direction: column; gap: 20px; }
                    .r-item { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; }
                    .r-item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                    .r-user-info { display: flex; align-items: center; gap: 12px; }
                    .r-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; }
                    .r-user-info h5 { font-size: 0.95rem; color: #fff; }
                    .r-user-info span { font-size: 0.75rem; color: #64748b; }
                    .r-stars { display: flex; gap: 2px; }
                    .r-comment { font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; }
                    
                    .r-form-section { margin-top: 30px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); }
                    .r-form-section h4 { font-size: 1.1rem; color: #fff; margin-bottom: 20px; }
                    .r-rating-select { display: flex; gap: 10px; margin-bottom: 20px; }
                    .r-star-btn { background: none; border: none; cursor: pointer; transition: 0.2s; padding: 5px; }
                    .r-star-btn:hover { transform: scale(1.2); }
                    .r-textarea { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 15px; border-radius: 12px; font-family: 'Inter', sans-serif; resize: vertical; min-height: 100px; margin-bottom: 15px; outline: none; }
                    .r-textarea:focus { border-color: #06b6d4; }
                    .r-submit-btn { background: #06b6d4; color: #000; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
                    .r-submit-btn:hover:not(:disabled) { background: #0891b2; transform: translateY(-2px); }
                    .r-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                    .r-error { color: #ef4444; font-size: 0.85rem; margin-bottom: 15px; background: rgba(239,68,68,0.1); padding: 10px; border-radius: 8px; }
                `}</style>
                <motion.div 
                    className="r-modal-content"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="r-modal-header">
                        <div className="r-modal-title">
                            <h3>Reviews for {vehicle?.name}</h3>
                            <p>{vehicle?.brand}</p>
                        </div>
                        <button className="r-close-btn" onClick={onClose}><X size={18} /></button>
                    </div>

                    <div className="r-modal-body">
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', color: '#94a3b8' }}>
                                <Loader2 size={32} className="animate-spin" style={{ marginBottom: 15, color: '#06b6d4' }} />
                                <p>Loading reviews...</p>
                                <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : (
                            <>
                                <div className="r-stats-banner">
                                    <div className="r-big-rating">{reviews.length > 0 ? averageRating : '-'}</div>
                                    <div className="r-stat-info">
                                        <h4>Overall Rating</h4>
                                        <p>Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                                        <div className="r-stars" style={{ marginTop: 5 }}>
                                            {[1,2,3,4,5].map(star => (
                                                <Star key={star} size={14} fill={star <= Math.round(averageRating) ? '#f59e0b' : 'transparent'} color={star <= Math.round(averageRating) ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="r-list">
                                    {reviews.length > 0 ? (
                                        reviews.map(review => (
                                            <div className="r-item" key={review.id}>
                                                <div className="r-item-header">
                                                    <div className="r-user-info">
                                                        <div className="r-avatar">
                                                            {review.reviewer?.profileImage ? (
                                                                <img src={getImageUrl(review.reviewer.profileImage)} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                            ) : (
                                                                <User size={20} color="#94a3b8" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h5>{review.reviewer?.username || 'Anonymous'}</h5>
                                                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="r-stars">
                                                        {[1,2,3,4,5].map(star => (
                                                            <Star key={star} size={12} fill={star <= review.rating ? '#f59e0b' : 'transparent'} color={star <= review.rating ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.comment && <p className="r-comment">{review.comment}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                                            <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                                            <p>No reviews yet. Be the first to share your experience!</p>
                                        </div>
                                    )}
                                </div>

                                <div className="r-form-section">
                                    <h4>Leave a Review</h4>
                                    {user ? (
                                        <form onSubmit={handleSubmit}>
                                            {error && <div className="r-error">{error}</div>}
                                            <div style={{ marginBottom: 15, fontSize: '0.85rem', color: '#94a3b8' }}>Select Rating:</div>
                                            <div className="r-rating-select">
                                                {[1,2,3,4,5].map(star => (
                                                    <button 
                                                        type="button" 
                                                        key={star} 
                                                        className="r-star-btn"
                                                        onClick={() => setRating(star)}
                                                    >
                                                        <Star size={28} fill={star <= rating ? '#f59e0b' : 'transparent'} color={star <= rating ? '#f59e0b' : '#64748b'} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea 
                                                className="r-textarea" 
                                                placeholder="Share details of your experience (optional)..."
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            ></textarea>
                                            <button type="submit" className="r-submit-btn" disabled={submitting}>
                                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
                                                Post Review
                                            </button>
                                        </form>
                                    ) : (
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                            <p style={{ color: '#94a3b8', marginBottom: '10px' }}>You need to sign in to leave a review.</p>
                                            {/* Link or advice could go here */}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReviewModal;
