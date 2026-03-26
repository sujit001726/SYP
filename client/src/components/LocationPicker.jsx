import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Search, Loader2, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// Custom Search Control for Leaflet
function SearchControl({ setPosition, onSelect }) {
    const map = useMap();

    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar',
            showMarker: true,
            showPopup: false,
            autoClose: true,
            retainZoomLevel: false,
            animateZoom: true,
            keepResult: true,
            searchLabel: 'Search for a place in Nepal...',
        });

        map.addControl(searchControl);

        map.on('geosearch/showlocation', (result) => {
            const { x, y, label } = result.location;
            setPosition([y, x]);
            onSelect({ lat: y, lng: x, address: label });
        });

        return () => map.removeControl(searchControl);
    }, [map, setPosition, onSelect]);

    return null;
}

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onSelect }) {
    const map = useMap();

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            map.flyTo(e.latlng, map.getZoom());

            // Basic reverse geocoding
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
                .then(res => res.json())
                .then(data => {
                    onSelect({
                        lat,
                        lng,
                        address: data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
                    });
                })
                .catch(() => {
                    onSelect({ lat, lng, address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}` });
                });
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
}

const LocationPicker = ({ isOpen, onClose, onSelect, title = "Select Location" }) => {
    const [position, setPosition] = useState([27.7172, 85.3240]); // Default to Kathmandu
    const [isLocating, setIsLocating] = useState(false);

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos = [latitude, longitude];
                setPosition(newPos);

                // Get address for the live location
                fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
                    .then(res => res.json())
                    .then(data => {
                        onSelect({
                            lat: latitude,
                            lng: longitude,
                            address: data.display_name || `My Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                        });
                    })
                    .catch(() => {
                        onSelect({ lat: latitude, lng: longitude, address: `My Location` });
                    });

                setIsLocating(false);
            },
            (err) => {
                console.error("Geolocation error:", err);
                alert("Unable to retrieve your location. Check permissions.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    // Auto-locate on first open if position is default
    useEffect(() => {
        if (isOpen && position[0] === 27.7172 && position[1] === 85.3240) {
            handleLocateMe();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="map-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="map-modal-card"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <div className="map-modal-header">
                        <h3><MapPin size={18} /> {title}</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="close-map-btn" onClick={onClose}><X size={20} /></button>
                        </div>
                    </div>

                    <div className="map-container-wrapper" style={{ position: 'relative' }}>
                        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} id="main-map-container">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <LocationMarker position={position} setPosition={setPosition} onSelect={onSelect} />
                            <SearchControl setPosition={setPosition} onSelect={onSelect} />

                            {/* Component to update map view when position changes externally */}
                            <MapUpdater position={position} />
                        </MapContainer>

                        {/* Floating Locate Button */}
                        <button
                            className={`locate-me-btn ${isLocating ? 'locating' : ''}`}
                            onClick={handleLocateMe}
                            title="Use my live location"
                        >
                            {isLocating ? <Loader2 className="animate-spin" /> : <Target size={24} />}
                        </button>
                    </div>

                    <div className="map-modal-footer">
                        <p className="map-hint">Click on the map or use search to pick a location</p>
                        <button className="confirm-loc-btn" onClick={onClose}>Confirm Location</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Helper component to fly the map to new positions
function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15);
        }
    }, [position, map]);
    return null;
}

export default LocationPicker;
