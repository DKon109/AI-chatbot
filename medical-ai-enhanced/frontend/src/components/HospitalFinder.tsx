import React, { useState } from 'react';
import { MapPin, Star, Clock, Phone, Globe, Navigation, RefreshCw, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';
import ApiService from '../services/api';

interface Hospital {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  website?: string;
  formatted_phone_number?: string;
  opening_hours?: {
    isOpen?: () => boolean;
    weekday_text?: string[];
  };
  editorial_summary?: {
    overview: string;
  };
  specialties: string[];
  relevance_score: number;
  is_specialized: boolean;
  is_highly_specialized: boolean;
  distance: number;
  travel_time: string;
  travel_distance: string;
  travel_time_value: number;
  travel_distance_value: number;
  isOpen?: boolean; // Computed property
}

interface HospitalFinderProps {
  symptoms: string[];
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const HospitalFinder: React.FC<HospitalFinderProps> = ({ symptoms, onLocationUpdate }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationPermissionDenied] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5000);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });

  // Request user location with proper permission handling
  const requestUserLocation = () => {
    console.log('Requesting user location for hospital search...');
    setLocationRequested(true);
    setIsLoading(true);
    setError(null);
    setHospitals([]);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Please use a modern browser.');
      setLocationPermissionDenied(true);
      setIsLoading(false);
      return;
    }

    // Check if we have permission first
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('Geolocation permission status:', result.state);
        
        if (result.state === 'denied') {
          setError('Location access is blocked. Please enable location access in your browser settings and refresh the page.');
          setLocationPermissionDenied(true);
          setIsLoading(false);
          return;
        }
        
        // Proceed with location request
        getCurrentLocation();
      }).catch((permissionError) => {
        console.log('Permission API not supported or failed, proceeding with location request');
        // Fallback if permissions API is not supported
        getCurrentLocation();
      });
    } else {
      console.log('Permission API not available, proceeding with location request');
      // Fallback if permissions API is not supported
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    console.log('Getting current location...');
    
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      setError('Geolocation is not supported by this browser. Please use a modern browser.');
      setLocationPermissionDenied(true);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained for hospital search:', position.coords);
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        console.log('User location:', { lat: userLat, lng: userLng });
        
        setUserLocation({ lat: userLat, lng: userLng });
        setLocationPermissionDenied(false);
        setLocationRequested(false);
        setError(null); // Clear any previous errors
        
        // Search for hospitals with fresh location
        searchHospitals(userLat, userLng);
        
        // Notify parent component
        if (onLocationUpdate) {
          onLocationUpdate(userLat, userLng);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        setLocationPermissionDenied(true);
        setLocationRequested(false);
        setIsLoading(false);
        
        let errorMessage = 'Unable to get your location.';
        let suggestions = '';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied.';
            suggestions = 'Please click "Allow" when prompted, or enable location access in your browser settings and refresh the page.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            suggestions = 'This usually means: 1) Location services are disabled on your device, 2) You\'re indoors with poor GPS signal, 3) Your browser doesn\'t support geolocation. Please enable location services, try going outside, or enter your location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            suggestions = 'Please try again. Make sure you have a good internet connection and try going outside for better GPS signal.';
            break;
          default:
            errorMessage = 'Unable to get your location.';
            suggestions = 'Please try again or enter your location manually.';
        }
        
        setError(`${errorMessage} ${suggestions}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout
        maximumAge: 0 // Always get fresh location
      }
    );
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid latitude and longitude values');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }
    
    console.log('Using manual location:', { lat, lng });
    setUserLocation({ lat, lng });
    setError(null);
    setShowManualLocation(false);
    
    // Search for hospitals
    searchHospitals(lat, lng);
    
    // Notify parent component
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  };

  // Search for hospitals
  const searchHospitals = async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Searching hospitals with:', { lat, lng, searchRadius, symptoms });
      console.log('Auth token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
      const response = await ApiService.searchHospitals(lat, lng, searchRadius, symptoms);
      console.log('Hospital search response:', response);
      
      if (response.success) {
        setHospitals(response.data.hospitals);
        console.log(`Found ${response.data.hospitals.length} hospitals`);
      } else {
        console.error('Hospital search failed:', response);
        setError(response.error || 'Failed to search hospitals');
      }
    } catch (error) {
      console.error('Error searching hospitals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = (error as any)?.response?.data || errorMessage;
      console.error('Error details:', errorDetails);
      setError('Failed to search hospitals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get directions to hospital
  const getDirections = async (hospital: Hospital) => {
    if (!userLocation) return;

    try {
      const response = await ApiService.getDirectionsToHospital(
        hospital.place_id,
        userLocation.lat,
        userLocation.lng
      );

      if (response.success) {
        window.open(response.data.directions_url, '_blank');
      } else {
        setError('Failed to get directions');
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      setError('Failed to get directions');
    }
  };

  // Format distance
  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Format rating
  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  // Get specialty badge color
  const getSpecialtyBadgeColor = (isSpecialized: boolean, isHighlySpecialized: boolean) => {
    if (isHighlySpecialized) return '#10b981'; // Green
    if (isSpecialized) return '#3b82f6'; // Blue
    return '#6b7280'; // Gray
  };

  // Get specialty badge text
  const getSpecialtyBadgeText = (isSpecialized: boolean, isHighlySpecialized: boolean) => {
    if (isHighlySpecialized) return 'Highly Specialized';
    if (isSpecialized) return 'Specialized';
    return 'General Care';
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Stethoscope size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
          Find Specialized Hospitals
        </h2>
        <p style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>
          Based on your symptoms: <strong>{symptoms.join(', ')}</strong>
        </p>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
          📍 We need your current location to find nearby hospitals
        </p>
        
        {/* Search Radius */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.9rem', color: '#374151' }}>Search Radius:</label>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.9rem'
            }}
          >
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
          </select>
        </div>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: '2rem',
        gap: '1rem'
      }}>
        <button
          onClick={requestUserLocation}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: isLoading ? '#9ca3af' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Getting Location...' : 'Get My Location & Find Hospitals'}
        </button>
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        {userLocation ? (
          <div style={{ fontSize: '0.9rem', color: '#10b981' }}>
            ✅ Location found! Searching within {formatDistance(searchRadius / 1000)} of your current location
          </div>
        ) : locationRequested ? (
          <div style={{ fontSize: '0.9rem', color: '#3b82f6' }}>
            📍 Requesting your current location... Please allow access when prompted
          </div>
        ) : (
          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            📍 Click "Get My Location & Find Hospitals" to start
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#dc2626',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={requestUserLocation}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => setShowManualLocation(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Enter Location Manually
            </button>
          </div>
        </div>
      )}

      {/* Manual Location Input */}
      {showManualLocation && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1e293b' }}>
            Enter Location Manually
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="number"
              placeholder="Latitude (e.g., -33.8688)"
              value={manualLocation.lat}
              onChange={(e) => setManualLocation(prev => ({ ...prev, lat: e.target.value }))}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.9rem'
              }}
            />
            <input
              type="number"
              placeholder="Longitude (e.g., 151.2093)"
              value={manualLocation.lng}
              onChange={(e) => setManualLocation(prev => ({ ...prev, lng: e.target.value }))}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleManualLocationSubmit}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Search Hospitals
            </button>
            <button
              onClick={() => setShowManualLocation(false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.9rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #e2e8f0',
              borderTop: '2px solid #ef4444',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            {locationRequested ? 'Getting your location...' : 'Searching for hospitals...'}
          </div>
        </div>
      )}

      {/* Hospital List */}
      {hospitals.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.2rem', 
            fontWeight: '600', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Stethoscope size={20} />
            Found {hospitals.length} hospitals
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {hospitals.map((hospital, index) => (
              <div
                key={hospital.place_id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  position: 'relative'
                }}
              >
                {/* Specialization Badge */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: getSpecialtyBadgeColor(hospital.is_specialized, hospital.is_highly_specialized),
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {hospital.is_highly_specialized ? <CheckCircle size={12} /> : <Stethoscope size={12} />}
                  {getSpecialtyBadgeText(hospital.is_specialized, hospital.is_highly_specialized)}
                </div>

                {/* Hospital Name and Rating */}
                <div style={{ marginBottom: '0.75rem', paddingRight: '8rem' }}>
                  <h4 style={{ 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    color: '#1e293b' 
                  }}>
                    {hospital.name}
                  </h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={14} style={{ color: '#fbbf24' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        {formatRating(hospital.rating)}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        ({hospital.user_ratings_total} reviews)
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      • {formatDistance(hospital.distance)} away
                    </span>
                  </div>
                  
                  {/* Travel Time and Distance */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    marginBottom: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#64748b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      <span style={{ fontWeight: '500' }}>{hospital.travel_time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} />
                      <span style={{ fontWeight: '500' }}>{hospital.travel_distance}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '0.75rem',
                  fontSize: '0.9rem',
                  color: '#64748b'
                }}>
                  <MapPin size={14} />
                  {hospital.vicinity}
                </div>

                {/* Specialties */}
                {hospital.specialties.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>
                        Specialties:
                      </span>
                      {hospital.specialties.slice(0, 5).map((specialty, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          {specialty}
                        </span>
                      ))}
                      {hospital.specialties.length > 5 && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          +{hospital.specialties.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  {hospital.formatted_phone_number && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      color: '#64748b'
                    }}>
                      <Phone size={14} />
                      <a 
                        href={`tel:${hospital.formatted_phone_number}`}
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        {hospital.formatted_phone_number}
                      </a>
                    </div>
                  )}
                  
                  {hospital.website && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      color: '#64748b'
                    }}>
                      <Globe size={14} />
                      <a 
                        href={hospital.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Hours */}
                {hospital.opening_hours && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#64748b'
                  }}>
                    <Clock size={14} />
                    <span style={{ 
                      color: hospital.isOpen ? '#10b981' : '#ef4444',
                      fontWeight: '500'
                    }}>
                      {hospital.isOpen ? 'Open now' : 'Closed'}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => getDirections(hospital)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    <Navigation size={14} />
                    Get Directions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && hospitals.length === 0 && userLocation && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Stethoscope size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
            No hospitals found
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Try increasing the search radius or check your location.
          </p>
        </div>
      )}
    </div>
  );
};

export default HospitalFinder;
