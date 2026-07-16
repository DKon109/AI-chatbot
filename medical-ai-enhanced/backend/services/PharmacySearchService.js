const axios = require('axios');

class PharmacySearchService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  /**
   * Search for pharmacies near a location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Object>} Search results with travel time
   */
  async searchPharmacies(latitude, longitude, radius = 5000) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API is not configured');
      }

      console.log(`Searching pharmacies near ${latitude}, ${longitude}`);

      // Search for pharmacies
      const pharmacies = await this.searchNearbyPharmacies(latitude, longitude, radius);
      
      // Get detailed information for each pharmacy
      const detailedPharmacies = await Promise.all(
        pharmacies.map(pharmacy => this.getPharmacyDetails(pharmacy, latitude, longitude))
      );

      // Sort by travel time and distance
      const sortedPharmacies = this.sortPharmaciesByTravelTime(detailedPharmacies);

      return {
        success: true,
        data: {
          pharmacies: sortedPharmacies,
          searchLocation: { latitude, longitude },
          searchRadius: radius,
          totalFound: sortedPharmacies.length
        }
      };

    } catch (error) {
      console.error('Error searching pharmacies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for nearby pharmacies using Google Places API
   */
  async searchNearbyPharmacies(latitude, longitude, radius) {
    const url = `${this.baseUrl}/nearbysearch/json`;
    const params = {
      location: `${latitude},${longitude}`,
      radius: radius,
      type: 'pharmacy',
      keyword: 'pharmacy chemist drugstore',
      key: this.googleMapsApiKey
    };

    try {
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.results || [];
    } catch (error) {
      console.error('Error calling Google Places API:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a pharmacy including travel time
   */
  async getPharmacyDetails(pharmacy, userLat, userLng) {
    try {
      // Get place details
      const placeDetails = await this.getPlaceDetails(pharmacy.place_id);
      
      // Calculate distance
      const distance = this.calculateDistance(
        userLat,
        userLng,
        pharmacy.geometry.location.lat,
        pharmacy.geometry.location.lng
      );

      // Get travel time and distance
      const travelInfo = await this.getTravelTimeAndDistance(
        userLat,
        userLng,
        pharmacy.geometry.location.lat,
        pharmacy.geometry.location.lng
      );

      return {
        place_id: pharmacy.place_id,
        name: pharmacy.name,
        vicinity: pharmacy.vicinity,
        rating: pharmacy.rating || 0,
        user_ratings_total: pharmacy.user_ratings_total || 0,
        price_level: pharmacy.price_level || 0,
        geometry: pharmacy.geometry,
        types: pharmacy.types || [],
        website: placeDetails.website || null,
        formatted_phone_number: placeDetails.formatted_phone_number || null,
        opening_hours: placeDetails.opening_hours || null,
        editorial_summary: placeDetails.editorial_summary || null,
        distance: distance,
        travel_time: travelInfo.duration,
        travel_distance: travelInfo.distance,
        travel_time_value: travelInfo.durationValue, // in seconds
        travel_distance_value: travelInfo.distanceValue // in meters
      };

    } catch (error) {
      console.error(`Error getting details for pharmacy ${pharmacy.name}:`, error);
      
      // Return basic information if detailed fetch fails
      const distance = this.calculateDistance(
        userLat,
        userLng,
        pharmacy.geometry.location.lat,
        pharmacy.geometry.location.lng
      );

      return {
        place_id: pharmacy.place_id,
        name: pharmacy.name,
        vicinity: pharmacy.vicinity,
        rating: pharmacy.rating || 0,
        user_ratings_total: pharmacy.user_ratings_total || 0,
        geometry: pharmacy.geometry,
        types: pharmacy.types || [],
        distance: distance,
        travel_time: 'Unknown',
        travel_distance: 'Unknown',
        travel_time_value: 0,
        travel_distance_value: 0
      };
    }
  }

  /**
   * Get travel time and distance using Google Distance Matrix API
   */
  async getTravelTimeAndDistance(originLat, originLng, destinationLat, destinationLng) {
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    const params = {
      origins: `${originLat},${originLng}`,
      destinations: `${destinationLat},${destinationLng}`,
      mode: 'driving',
      units: 'metric',
      key: this.googleMapsApiKey
    };

    try {
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Distance Matrix API error: ${response.data.status}`);
      }

      const element = response.data.rows[0]?.elements[0];
      if (!element || element.status !== 'OK') {
        throw new Error('Unable to calculate travel time');
      }

      return {
        distance: element.distance?.text || 'Unknown',
        duration: element.duration?.text || 'Unknown',
        distanceValue: element.distance?.value || 0, // in meters
        durationValue: element.duration?.value || 0 // in seconds
      };

    } catch (error) {
      console.error('Error getting travel time:', error);
      return {
        distance: 'Unknown',
        duration: 'Unknown',
        distanceValue: 0,
        durationValue: 0
      };
    }
  }

  /**
   * Get detailed place information from Google Places API
   */
  async getPlaceDetails(placeId) {
    const url = `${this.baseUrl}/details/json`;
    const params = {
      place_id: placeId,
      fields: 'website,formatted_phone_number,opening_hours,editorial_summary,types',
      key: this.googleMapsApiKey
    };

    try {
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Places Details API error: ${response.data.status}`);
      }

      return response.data.result || {};
    } catch (error) {
      console.error('Error calling Google Places Details API:', error);
      return {};
    }
  }

  /**
   * Sort pharmacies by travel time
   */
  sortPharmaciesByTravelTime(pharmacies) {
    return pharmacies.sort((a, b) => {
      // First by travel time (if available)
      if (a.travel_time_value && b.travel_time_value) {
        return a.travel_time_value - b.travel_time_value;
      }
      
      // Then by rating
      if (a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      
      // Finally by distance
      return a.distance - b.distance;
    });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Get directions to a pharmacy
   */
  async getDirectionsToPharmacy(pharmacyPlaceId, userLat, userLng) {
    const url = `${this.baseUrl}/details/json`;
    const params = {
      place_id: pharmacyPlaceId,
      fields: 'geometry',
      key: this.googleMapsApiKey
    };

    try {
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      const pharmacy = response.data.result;
      const pharmacyLat = pharmacy.geometry.location.lat;
      const pharmacyLng = pharmacy.geometry.location.lng;

      // Get travel time and distance
      const travelInfo = await this.getTravelTimeAndDistance(userLat, userLng, pharmacyLat, pharmacyLng);

      // Generate Google Maps directions URL
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pharmacyLat},${pharmacyLng}&origin=${userLat},${userLng}`;

      return {
        success: true,
        directions_url: directionsUrl,
        pharmacy_location: { lat: pharmacyLat, lng: pharmacyLng },
        distance: this.calculateDistance(userLat, userLng, pharmacyLat, pharmacyLng),
        travel_time: travelInfo.duration,
        travel_distance: travelInfo.distance
      };

    } catch (error) {
      console.error('Error getting directions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PharmacySearchService();
