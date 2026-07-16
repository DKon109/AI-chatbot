import React, { useEffect, useRef, useState } from 'react';
import { MapPin, RefreshCw, ExternalLink, Phone, Clock } from 'lucide-react';

// Constants
const SEARCH_RADIUS = 2000; // 2km in meters
const DEFAULT_LOCATION = { lat: -33.8688, lng: 151.2093 }; // Sydney CBD
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface Pharmacy {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  opening_hours?: {
    isOpen?: () => boolean;
    weekday_text?: string[];
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  formatted_phone_number?: string;
  distance: number;
  travel_time: string;
  travel_distance: string;
  travel_time_value: number;
  travel_distance_value: number;
  isOpen?: boolean; // Computed property
}

interface GoogleMapsPharmacyFinderProps {
  onLocationUpdate?: (lat: number, lng: number) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const GoogleMapsPharmacyFinder: React.FC<GoogleMapsPharmacyFinderProps> = ({ onLocationUpdate }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const service = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationPermissionDenied] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Load Google Maps API
  useEffect(() => {
    console.log('GoogleMapsPharmacyFinder: Loading Google Maps API...');
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps is not configured for this deployment.');
      return;
    }
    
    // No automatic fallback - we need real location
    
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Add error handling
      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        setError('Failed to load Google Maps. Please check your API key and internet connection.');
      };
      
      window.initMap = initializeMap;
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else {
      console.log('Google Maps already loaded, initializing...');
      initializeMap();
    }
    // initializeMap is intentionally registered once as the Google callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMap = () => {
    console.log('initializeMap called');
    console.log('mapRef.current:', mapRef.current);
    console.log('window.google:', window.google);
    
    if (!mapRef.current) {
      console.error('Map ref is not available');
      setError('Map container not found');
      return;
    }

    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      setError('Google Maps API not loaded');
      return;
    }

    try {
      console.log('Creating Google Map...');
      // Initialize map with default location
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: DEFAULT_LOCATION,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      console.log('Map created successfully');

      // Initialize Places service
      service.current = new window.google.maps.places.PlacesService(mapInstance.current);
      console.log('Places service initialized');

      // Always request user location first
      requestUserLocation();
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const requestUserLocation = () => {
    console.log('Requesting user location for pharmacy search...');
    setLocationRequested(true);
    setIsLoading(true);
    setError(null);
    setPharmacies([]); // Clear previous results
    setRetryCount(0); // Reset retry count

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Please use a modern browser.');
      setLocationPermissionDenied(true);
      setIsLoading(false);
      return;
    }

    // Try multiple location strategies in parallel
    tryMultipleLocationStrategies();
  };

  const tryMultipleLocationStrategies = () => {
    console.log('Trying multiple location strategies...');
    
    // Strategy 1: Try getCurrentPosition with different options
    const tryGetCurrentPosition = () => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ type: 'getCurrentPosition', position }),
          (error) => reject({ type: 'getCurrentPosition', error }),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
    };

    // Strategy 2: Try watchPosition
    const tryWatchPosition = () => {
      return new Promise((resolve, reject) => {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            navigator.geolocation.clearWatch(watchId);
            resolve({ type: 'watchPosition', position });
          },
          (error) => {
            navigator.geolocation.clearWatch(watchId);
            reject({ type: 'watchPosition', error });
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000
          }
        );

        // Clear watch after timeout
        setTimeout(() => {
          navigator.geolocation.clearWatch(watchId);
          reject({ type: 'watchPosition', error: new Error('Timeout') });
        }, 15000);
      });
    };

    // Strategy 3: Try IP-based location
    const tryIPLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          return {
            type: 'ipLocation',
            position: {
              coords: {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: 10000 // IP location is less accurate
              }
            }
          };
        }
        throw new Error('No location data from IP service');
      } catch (error) {
        const locationError = new Error('IP location lookup failed');
        (locationError as any).type = 'ipLocation';
        (locationError as any).cause = error;
        throw locationError;
      }
    };

    // Try all strategies in parallel
    Promise.allSettled([
      tryGetCurrentPosition(),
      tryWatchPosition(),
      tryIPLocation()
    ]).then((results) => {
      console.log('Location strategy results:', results);
      
      // Find the first successful result
      const success = results.find(result => result.status === 'fulfilled') as { status: 'fulfilled'; value: { type: string; position: { coords: { latitude: number; longitude: number; accuracy: number } } } } | undefined;
      
      if (success) {
        const { position } = success.value;
        console.log('Location obtained via:', success.value.type, position.coords);
        
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        setUserLocation({ lat: userLat, lng: userLng });
        setLocationPermissionDenied(false);
        setLocationRequested(false);
        setError(null);
        setUsingDefaultLocation(false);
        setRetryCount(0);
        setIsLoading(false);
        
        // Update map center
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat: userLat, lng: userLng });
          mapInstance.current.setZoom(15);
        }
        
        // Search for pharmacies
        searchNearbyPharmacies(userLat, userLng);
        
        // Notify parent component
        if (onLocationUpdate) {
          onLocationUpdate(userLat, userLng);
        }
        
        // Show notice if using IP location
        if (success.value.type === 'ipLocation') {
          setError('Using approximate location based on your IP address. For more accurate results, please enable location services.');
        }
      } else {
        // All strategies failed
        console.error('All location strategies failed:', results);
        setError('Unable to determine your location. Please check your location services and try again.');
        setLocationPermissionDenied(true);
        setLocationRequested(false);
        setIsLoading(false);
      }
    });
  };

  // Old getCurrentLocation function removed - using tryMultipleLocationStrategies instead

  // Old tryWatchPosition and tryIPBasedLocation functions removed - now integrated into tryMultipleLocationStrategies

  const searchNearbyPharmacies = (lat: number, lng: number) => {
    if (!service.current) return;

    setIsLoading(true);
    setError(null);

    const request = {
      location: new window.google.maps.LatLng(lat, lng),
      radius: SEARCH_RADIUS,
      type: 'pharmacy',
      keyword: 'pharmacy'
    };

    service.current.nearbySearch(request, (results: any[], status: any) => {
      setIsLoading(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        // Process results to handle the new isOpen() method
        const processedPharmacies = results.map((place: any) => {
          // Calculate if open using the new isOpen() method
          let isOpen = false;
          if (place.opening_hours && typeof place.opening_hours.isOpen === 'function') {
            try {
              isOpen = place.opening_hours.isOpen();
            } catch (error) {
              console.warn('Error calling isOpen():', error);
              isOpen = false;
            }
          }

          return {
            ...place,
            isOpen: isOpen // Add computed isOpen property
          };
        });

        setPharmacies(processedPharmacies);
        displayPharmaciesOnMap(processedPharmacies);
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        setError('No pharmacies found within 2km. Try expanding your search area.');
        setPharmacies([]);
      } else {
        setError('Error searching for pharmacies. Please try again.');
        setPharmacies([]);
      }
    });
  };

  const displayPharmaciesOnMap = (pharmacies: Pharmacy[]) => {
    if (!mapInstance.current) return;

    // Clear existing markers
    if (window.google && window.google.maps) {
      // In a real implementation, you'd store marker references and clear them
      // For now, we'll just add new markers
      pharmacies.forEach((pharmacy) => {
        const marker = new window.google.maps.Marker({
          position: pharmacy.geometry.location,
          map: mapInstance.current,
          title: pharmacy.name,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(30, 30)
          }
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">${pharmacy.name}</h3>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${pharmacy.vicinity}</p>
              <p style="margin: 0 0 5px 0; font-size: 12px;">
                ⭐ ${pharmacy.rating || 'N/A'} (${pharmacy.user_ratings_total || 0} reviews)
              </p>
              <p style="margin: 0; font-size: 12px; color: ${pharmacy.isOpen ? 'green' : 'red'};">
                ${pharmacy.isOpen ? '🟢 Open now' : '🔴 Closed'}
              </p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance.current, marker);
        });
      });
    }
  };

  const openDirections = (pharmacy: Pharmacy) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.geometry.location.lat},${pharmacy.geometry.location.lng}`;
    window.open(url, '_blank');
  };

  const callPharmacy = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '400px', 
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0'
        }} 
      />
      
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '1rem',
        padding: '0.5rem 0'
      }}>
        <div>
          <button
            onClick={requestUserLocation}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
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
            {isLoading ? 'Getting Location...' : 'Get My Location & Find Pharmacies'}
          </button>
        </div>
        
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          {userLocation ? (
            usingDefaultLocation ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📍 Using default location (Sydney CBD): {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                <span style={{ 
                  fontSize: '0.8rem', 
                  backgroundColor: '#fef3c7', 
                  color: '#92400e', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem' 
                }}>
                  Default
                </span>
              </div>
            ) : (
              `📍 Your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
            )
          ) : locationRequested ? (
            '📍 Getting your location...'
          ) : (
            '📍 Click "Find My Location" to search nearby pharmacies'
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          marginTop: '1rem',
          color: '#dc2626',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            {error}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {retryCount < 2 && (
              <button
              onClick={() => {
                setRetryCount(prev => prev + 1);
                tryMultipleLocationStrategies(); // Try all strategies again
              }}
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
                Try Again {retryCount > 0 && `(${retryCount})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Default Location Notice */}
      {usingDefaultLocation && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#92400e', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <strong>Using default location (Sydney CBD)</strong>
          </div>
          <div style={{ color: '#a16207', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            We couldn't get your exact location. For more accurate results, try:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setRetryCount(prev => prev + 1);
                tryMultipleLocationStrategies(); // Try all strategies again
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Try Again {retryCount > 0 && `(${retryCount})`}
            </button>
          </div>
        </div>
      )}


      {/* Loading State */}
      {isLoading && (
        <div style={{
          padding: '1rem',
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
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            {locationRequested ? 'Getting your location...' : 'Searching for nearby pharmacies...'}
          </div>
        </div>
      )}

      {/* Pharmacy List */}
      {pharmacies.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: '#1e293b' 
          }}>
            Nearby Pharmacies ({pharmacies.length} found)
          </h3>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {pharmacies.map((pharmacy) => (
              <div key={pharmacy.place_id} style={{
                padding: '1rem',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#1e293b' 
                  }}>
                    {pharmacy.name}
                  </h4>
                  
                  <p style={{ 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '0.9rem', 
                    color: '#64748b' 
                  }}>
                    {pharmacy.vicinity}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    fontSize: '0.8rem',
                    color: '#64748b'
                  }}>
                    {pharmacy.rating && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        ⭐ {pharmacy.rating} ({pharmacy.user_ratings_total})
                      </span>
                    )}
                    
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      color: pharmacy.isOpen ? '#16a34a' : '#dc2626'
                    }}>
                      <Clock size={12} />
                      {pharmacy.isOpen ? 'Open now' : 'Closed'}
                    </span>
                  </div>
                  
                  {/* Travel Time and Distance */}
                  {(pharmacy.travel_time || pharmacy.travel_distance) && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      fontSize: '0.8rem',
                      color: '#64748b',
                      marginBottom: '0.5rem'
                    }}>
                      {pharmacy.travel_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          <span style={{ fontWeight: '500' }}>{pharmacy.travel_time}</span>
                        </div>
                      )}
                      {pharmacy.travel_distance && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={12} />
                          <span style={{ fontWeight: '500' }}>{pharmacy.travel_distance}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => openDirections(pharmacy)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}
                  >
                    <ExternalLink size={14} />
                    Directions
                  </button>
                  
                  {pharmacy.formatted_phone_number && (
                    <button
                      onClick={() => callPharmacy(pharmacy.formatted_phone_number!)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}
                    >
                      <Phone size={14} />
                      Call
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsPharmacyFinder;
