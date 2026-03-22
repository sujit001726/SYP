import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';

const Preloader = () => {
    const [statusIndex, setStatusIndex] = useState(0);
    const statuses = [
        "SYNCHRONIZING TERMINAL",
        "LOADING FLEET MODULES",
        "ESTABLISHING SECURE LINK",
        "CALIBRATING NEURAL HUB",
        "FINALIZING ELITE PROTOCOL"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statuses.length);
        }, 600);
        return () => clearInterval(interval);
    }, []);

    // Generate random particles for the background
    const particles = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 10 + 10
    }));

    return (
        <motion.div
            className="preloader-overlay"
            initial={{ opacity: 1 }}
            exit={{
                opacity: 0,
                transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }
            }}
        >
            {/* Background Particles */}
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="preloader-particle"
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        opacity: 0.2,
                        zIndex: 1
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0.1, 0.4, 0.1]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            ))}

            <div className="scanline"></div>

            <div className="preloader-content-center">
                <div className="logo-container-elite">
                    {/* Pulsing Aura */}
                    <motion.div
                        className="logo-aura"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                            borderRadius: '50%',
                            zIndex: 0
                        }}
                    />

                    <div className="orbital-ring ring-1"></div>
                    <div className="orbital-ring ring-2"></div>
                    <div className="orbital-ring ring-3"></div>

                    <motion.img
                        src={logoImg}
                        alt="YatraHub"
                        className="preloader-logo"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            duration: 1,
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                        }}
                    />
                </div>

                <div className="status-box-elite">
                    <motion.div
                        className="brand-text-elite"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        YatraHub
                    </motion.div>

                    <div className="status-container" style={{ position: 'relative', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={statuses[statusIndex]}
                                className="status-message-cycling"
                                initial={{ y: 10, opacity: 0, filter: 'blur(5px)' }}
                                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                exit={{ y: -10, opacity: 0, filter: 'blur(5px)' }}
                                transition={{ duration: 0.3 }}
                            >
                                {statuses[statusIndex]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="loading-bar-elite">
                        <motion.div
                            className="loading-bar-fill-elite"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.5, ease: "easeInOut" }}
                        />
                    </div>
                </div>
            </div>

            {/* Corner Interface Elements */}
            <div className="corner-decor top-left"></div>
            <div className="corner-decor top-right"></div>
            <div className="corner-decor bottom-left"></div>
            <div className="corner-decor bottom-right"></div>

            <div style={{ position: 'absolute', top: '40px', left: '40px', color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem', letterSpacing: '4px', fontFamily: 'monospace' }}>
                <span style={{ color: 'var(--primary)' }}>&gt;</span> TERMINAL_BOOT_SEQUENCE
            </div>
            <div style={{ position: 'absolute', bottom: '40px', right: '40px', color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem', letterSpacing: '4px', fontFamily: 'monospace' }}>
                ENCRYPTION: AES_256_ACTIVE
            </div>
        </motion.div>
    );
};

export default Preloader;
