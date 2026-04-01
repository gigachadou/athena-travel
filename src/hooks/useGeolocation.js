import { useState, useEffect } from 'react';

export const useGeolocation = () => {
    const [location, setLocation] = useState({
        loading: true,
        latitude: null,
        longitude: null,
        error: null,
        city: 'Termiz',
        region: 'Surxondaryo'
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
            return;
        }

        const onSuccess = async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Reverse geocoding using OpenStreetMap Nominatim (Free, no key required for low traffic)
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
                const data = await response.json();
                
                setLocation({
                    loading: false,
                    latitude,
                    longitude,
                    error: null,
                    city: data.address?.city || data.address?.town || data.address?.village || 'Aniqlanmadi',
                    region: data.address?.state || data.address?.county || 'O\'zbekiston'
                });
            } catch (err) {
                setLocation({
                    loading: false,
                    latitude,
                    longitude,
                    error: 'Geocoding error',
                    city: 'Termiz',
                    region: 'Surxondaryo'
                });
            }
        };

        const onError = (error) => {
            setLocation(prev => ({
                ...prev,
                loading: false,
                error: error.message,
                city: 'Termiz',
                region: 'Surxondaryo'
            }));
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }, []);

    return location;
};
