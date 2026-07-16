const axios = require('axios');
const HospitalSpecialtyService = require('./HospitalSpecialtyService');

class HospitalSearchService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  /**
   * Search for hospitals and clinics near a location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Search radius in meters
   * @param {Array} symptoms - Patient symptoms for specialty matching
   * @returns {Promise<Object>} Search results with specialties
   */
  async searchHospitals(latitude, longitude, radius = 5000, symptoms = []) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API is not configured');
      }

      console.log(`Searching hospitals near ${latitude}, ${longitude} for symptoms:`, symptoms);
      
      // Get relevant specialties for the symptoms
      const relevantSpecialties = HospitalSpecialtyService.mapSymptomsToSpecialties(symptoms);
      console.log('Relevant specialties for symptoms:', relevantSpecialties);

      // Search for hospitals and clinics
      const hospitals = await this.searchNearbyHospitals(latitude, longitude, radius);
      
      // Get detailed information for each hospital
      const detailedHospitals = await Promise.all(
        hospitals.map(hospital => this.getHospitalDetails(hospital, relevantSpecialties, latitude, longitude))
      );

      // Sort by relevance and distance
      const sortedHospitals = this.sortHospitalsByRelevance(detailedHospitals, relevantSpecialties);

      return {
        success: true,
        data: {
          hospitals: sortedHospitals,
          searchLocation: { latitude, longitude },
          searchRadius: radius,
          relevantSpecialties: relevantSpecialties,
          totalFound: sortedHospitals.length
        }
      };

    } catch (error) {
      console.error('Error searching hospitals:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for nearby hospitals using Google Places API
   */
  async searchNearbyHospitals(latitude, longitude, radius) {
    const url = `${this.baseUrl}/nearbysearch/json`;
    const params = {
      location: `${latitude},${longitude}`,
      radius: radius,
      type: 'hospital',
      keyword: 'hospital clinic medical center',
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
   * Get detailed information for a hospital including specialties
   */
  async getHospitalDetails(hospital, relevantSpecialties, userLat, userLng) {
    try {
      // Get place details
      const placeDetails = await this.getPlaceDetails(hospital.place_id);
      
      // Extract specialties from website if available
      let specialties = [];
      if (placeDetails.website) {
        specialties = await HospitalSpecialtyService.extractSpecialties(placeDetails.website);
      }
      
      // If no specialties found, check if it's likely a general practice clinic
      if (specialties.length === 0) {
        const hospitalName = hospital.name.toLowerCase();
        const isGeneralPractice = 
          hospitalName.includes('general') ||
          hospitalName.includes('family') ||
          hospitalName.includes('primary') ||
          hospitalName.includes('medical center') ||
          hospitalName.includes('clinic') ||
          hospitalName.includes('health center') ||
          hospitalName.includes('myhealth') ||
          hospitalName.includes('gp') ||
          hospitalName.includes('practice');
        
        if (isGeneralPractice) {
          specialties = ['general'];
        } else {
          // For hospitals without clear indicators, default to general
          specialties = ['general'];
        }
      }

      // Calculate relevance score
      const relevanceScore = HospitalSpecialtyService.calculateRelevanceScore(specialties, relevantSpecialties);
      
      // Determine if specialized
      const isSpecialized = relevanceScore > 0.3; // Threshold for specialization
      const isHighlySpecialized = relevanceScore > 0.7;

      // Calculate distance
      const distance = this.calculateDistance(
        userLat,
        userLng,
        hospital.geometry.location.lat,
        hospital.geometry.location.lng
      );

      // Get travel time and distance
      const travelInfo = await this.getTravelTimeAndDistance(
        userLat,
        userLng,
        hospital.geometry.location.lat,
        hospital.geometry.location.lng
      );

      return {
        place_id: hospital.place_id,
        name: hospital.name,
        vicinity: hospital.vicinity,
        rating: hospital.rating || 0,
        user_ratings_total: hospital.user_ratings_total || 0,
        price_level: hospital.price_level || 0,
        geometry: hospital.geometry,
        types: hospital.types || [],
        website: placeDetails.website || null,
        formatted_phone_number: placeDetails.formatted_phone_number || null,
        opening_hours: placeDetails.opening_hours || null,
        editorial_summary: placeDetails.editorial_summary || null,
        specialties: specialties,
        relevance_score: relevanceScore,
        is_specialized: isSpecialized,
        is_highly_specialized: isHighlySpecialized,
        distance: distance,
        travel_time: travelInfo.duration,
        travel_distance: travelInfo.distance,
        travel_time_value: travelInfo.durationValue, // in seconds
        travel_distance_value: travelInfo.distanceValue // in meters
      };

    } catch (error) {
      console.error(`Error getting details for hospital ${hospital.name}:`, error);
      
      // Return basic information if detailed fetch fails
      const distance = this.calculateDistance(
        userLat,
        userLng,
        hospital.geometry.location.lat,
        hospital.geometry.location.lng
      );

      return {
        place_id: hospital.place_id,
        name: hospital.name,
        vicinity: hospital.vicinity,
        rating: hospital.rating || 0,
        user_ratings_total: hospital.user_ratings_total || 0,
        geometry: hospital.geometry,
        types: hospital.types || [],
        specialties: [],
        relevance_score: 0,
        is_specialized: false,
        is_highly_specialized: false,
        distance: distance,
        travel_time: 'Unknown',
        travel_distance: 'Unknown',
        travel_time_value: 0,
        travel_distance_value: 0
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
   * Sort hospitals by relevance and travel time
   */
  sortHospitalsByRelevance(hospitals, relevantSpecialties) {
    return hospitals.sort((a, b) => {
      // First sort by specialization (specialized hospitals first)
      if (a.is_highly_specialized && !b.is_highly_specialized) return -1;
      if (!a.is_highly_specialized && b.is_highly_specialized) return 1;
      if (a.is_specialized && !b.is_specialized) return -1;
      if (!a.is_specialized && b.is_specialized) return 1;
      
      // Then by relevance score
      if (a.relevance_score !== b.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      
      // Then by travel time (if available)
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
   * Get directions to a hospital
   */
  async getDirectionsToHospital(hospitalPlaceId, userLat, userLng) {
    const url = `${this.baseUrl}/details/json`;
    const params = {
      place_id: hospitalPlaceId,
      fields: 'geometry',
      key: this.googleMapsApiKey
    };

    try {
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      const hospital = response.data.result;
      const hospitalLat = hospital.geometry.location.lat;
      const hospitalLng = hospital.geometry.location.lng;

      // Get travel time and distance
      const travelInfo = await this.getTravelTimeAndDistance(userLat, userLng, hospitalLat, hospitalLng);

      // Generate Google Maps directions URL
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLat},${hospitalLng}&origin=${userLat},${userLng}`;

      return {
        success: true,
        directions_url: directionsUrl,
        hospital_location: { lat: hospitalLat, lng: hospitalLng },
        distance: this.calculateDistance(userLat, userLng, hospitalLat, hospitalLng),
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

module.exports = new HospitalSearchService();
