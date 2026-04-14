import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function ChangeMapView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { animate: true });
        }
    }, [center, map]);
    return null;
}

const LiveMap = () => {
    const [position, setPosition] = useState([27.7172, 85.3240]); // Default Kathmandu
    const [address, setAddress] = useState("Locating your position...");
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported");
            setAddress("Geolocation not supported by your browser");
            return;
        }

        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);

                // Reverse geocoding
                fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
                    .then(res => res.json())
                    .then(data => {
                        setAddress(data.display_name || "Nepal");
                    })
                    .catch(() => setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`));
            },
            (err) => {
                setError(err.message);
                setAddress("Unable to retrieve location. Please check permissions.");
                console.error("Geo error:", err);
            },
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    return (
        <section className="live-map-section">
            <div className="live-map-wrapper" style={{ position: 'relative' }}>
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '500px', width: '100%', borderRadius: '0', zIndex: 1 }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <Marker position={position}>
                        <Popup>
                            Your Live Location
                        </Popup>
                    </Marker>
                    <ChangeMapView center={position} />
                </MapContainer>

                <motion.div
                    className="location-floating-card"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="location-card-inner">
                        <div className="location-badge-icon">
                            <Navigation size={22} fill="currentColor" />
                        </div>
                        <div className="location-text-content">
                            <span className="location-label">LIVE TRACKING ACTIVE</span>
                            <p className="location-address">{address}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default LiveMap;
