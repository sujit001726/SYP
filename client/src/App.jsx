import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ListVehicle from './pages/ListVehicle';
import Profile from './pages/Profile';
import KYC from './pages/KYC';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import FleetListing from './pages/FleetListing';
import RideListing from './pages/RideListing';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import ScrollToTop from './components/ScrollToTop';
import Preloader from './components/Preloader';
import RiderApp from './pages/RiderApp';
import LiveRide from './pages/LiveRide';
import Messages from './pages/Messages';


function App() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleLoad = () => {
            // Give it a tiny bit more time for the premium feel
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        };

        if (document.readyState === 'complete') {
            handleLoad();
        } else {
            window.addEventListener('load', handleLoad);
            // Fallback timeout in case 'load' event doesn't fire correctly
            const fallback = setTimeout(handleLoad, 4000);
            return () => {
                window.removeEventListener('load', handleLoad);
                clearTimeout(fallback);
            };
        }
    }, []);

    return (
        <>
            <AnimatePresence>
                {loading && <Preloader key="preloader" />}
            </AnimatePresence>

            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/list-vehicle" element={<ListVehicle />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/kyc" element={<KYC />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/fleet/:category" element={<FleetListing />} />
                <Route path="/rides/:category" element={<RideListing />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-failure" element={<PaymentFailure />} />
                <Route path="/rider" element={<RiderApp />} />
                <Route path="/live-ride" element={<LiveRide />} />
                <Route path="/messages" element={<Messages />} />
            </Routes>

        </>
    );
}

export default App;
