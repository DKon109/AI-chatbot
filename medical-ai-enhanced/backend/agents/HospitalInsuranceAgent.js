const BaseAgent = require('./BaseAgent');

/**
 * Hospital & Insurance Agent - Matches hospitals to patient's condition, location, and insurance coverage
 */
class HospitalInsuranceAgent extends BaseAgent {
  constructor() {
    super(
      'HospitalInsuranceAgent',
      'Matches hospitals to patient\'s condition, location, and insurance coverage'
    );
    
    // Mock hospital database (in production, this would be a real database)
    this.hospitals = [
      {
        id: 'hosp_001',
        name: 'City General Hospital',
        address: '123 Main St, City Center',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        specialties: ['cardiology', 'emergency', 'general'],
        insuranceAccepted: ['blue_cross', 'aetna', 'medicare'],
        rating: 4.5,
        waitTime: 30,
        capacity: 0.8
      },
      {
        id: 'hosp_002',
        name: 'Metropolitan Medical Center',
        address: '456 Oak Ave, Downtown',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        specialties: ['cardiology', 'neurology', 'emergency', 'trauma'],
        insuranceAccepted: ['blue_cross', 'cigna', 'medicare', 'medicaid'],
        rating: 4.8,
        waitTime: 45,
        capacity: 0.9
      },
      {
        id: 'hosp_003',
        name: 'Community Health Center',
        address: '789 Pine St, Suburbs',
        coordinates: { lat: 40.6892, lng: -74.0445 },
        specialties: ['general', 'pediatrics', 'family'],
        insuranceAccepted: ['blue_cross', 'aetna', 'medicaid'],
        rating: 4.2,
        waitTime: 15,
        capacity: 0.6
      }
    ];

    // Mock insurance plans
    this.insurancePlans = {
      blue_cross: { name: 'Blue Cross Blue Shield', coverage: 0.8 },
      aetna: { name: 'Aetna', coverage: 0.75 },
      cigna: { name: 'Cigna', coverage: 0.85 },
      medicare: { name: 'Medicare', coverage: 0.9 },
      medicaid: { name: 'Medicaid', coverage: 0.95 }
    };
  }

  /**
   * Process hospital matching request
   */
  async process(request) {
    const { 
      userId, 
      condition, 
      severity, 
      location, 
      insuranceProvider,
      preferences = {}
    } = request;

    this.log('info', 'Processing hospital matching request', { 
      userId, 
      condition, 
      severity, 
      location 
    });

    try {
      // Find matching hospitals
      const matchingHospitals = this.findMatchingHospitals(
        condition, 
        severity, 
        location, 
        insuranceProvider
      );

      // Rank hospitals based on multiple factors
      const rankedHospitals = this.rankHospitals(
        matchingHospitals, 
        location, 
        preferences
      );

      // Generate recommendations
      const recommendations = this.generateHospitalRecommendations(
        rankedHospitals, 
        condition, 
        severity
      );

      // Log the matching for analytics
      await this.logHospitalMatching(userId, condition, rankedHospitals);

      this.log('info', 'Hospital matching completed', {
        matchesFound: rankedHospitals.length,
        topMatch: rankedHospitals[0]?.name
      });

      return {
        success: true,
        hospitals: rankedHospitals,
        recommendations,
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Hospital matching failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Find hospitals that match the criteria
   */
  findMatchingHospitals(condition, severity, location, insuranceProvider) {
    return this.hospitals.filter(hospital => {
      // Check if hospital accepts the insurance
      const acceptsInsurance = !insuranceProvider || 
        hospital.insuranceAccepted.includes(insuranceProvider);

      // Check if hospital has relevant specialties
      const hasRelevantSpecialty = this.hasRelevantSpecialty(
        condition, 
        hospital.specialties
      );

      // Check capacity (don't recommend overcrowded hospitals for non-emergencies)
      const hasCapacity = severity === 'critical' || hospital.capacity < 0.9;

      return acceptsInsurance && hasRelevantSpecialty && hasCapacity;
    });
  }

  /**
   * Check if hospital has relevant specialty for the condition
   */
  hasRelevantSpecialty(condition, specialties) {
    const conditionSpecialties = this.getConditionSpecialties(condition);
    return conditionSpecialties.some(specialty => 
      specialties.includes(specialty)
    );
  }

  /**
   * Get relevant specialties for a condition
   */
  getConditionSpecialties(condition) {
    const conditionMap = {
      'heart attack': ['cardiology', 'emergency'],
      'stroke': ['neurology', 'emergency'],
      'pneumonia': ['pulmonology', 'general'],
      'diabetes': ['endocrinology', 'general'],
      'hypertension': ['cardiology', 'general'],
      'chest pain': ['cardiology', 'emergency'],
      'breathing problems': ['pulmonology', 'emergency'],
      'severe headache': ['neurology', 'emergency'],
      'abdominal pain': ['gastroenterology', 'general'],
      'fever': ['infectious disease', 'general']
    };

    return conditionMap[condition.toLowerCase()] || ['general'];
  }

  /**
   * Rank hospitals based on multiple factors
   */
  rankHospitals(hospitals, location, preferences) {
    return hospitals.map(hospital => {
      const score = this.calculateHospitalScore(hospital, location, preferences);
      return { ...hospital, score };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate hospital score based on multiple factors
   */
  calculateHospitalScore(hospital, location, preferences) {
    let score = 0;

    // Base rating (40% weight)
    score += hospital.rating * 40;

    // Distance factor (30% weight)
    const distance = this.calculateDistance(location, hospital.coordinates);
    const distanceScore = Math.max(0, 30 - (distance / 10)); // Closer is better
    score += distanceScore;

    // Wait time factor (20% weight)
    const waitTimeScore = Math.max(0, 20 - (hospital.waitTime / 5)); // Shorter wait is better
    score += waitTimeScore;

    // Capacity factor (10% weight)
    const capacityScore = (1 - hospital.capacity) * 10; // Less crowded is better
    score += capacityScore;

    // Apply user preferences
    if (preferences.priority === 'speed' && hospital.waitTime < 30) {
      score += 10;
    }
    if (preferences.priority === 'quality' && hospital.rating > 4.5) {
      score += 10;
    }

    return Math.round(score);
  }

  /**
   * Calculate distance between two coordinates (simplified)
   */
  calculateDistance(location1, location2) {
    if (!location1 || !location2) return 0;
    
    const R = 6371; // Earth's radius in km
    const dLat = (location2.lat - location1.lat) * Math.PI / 180;
    const dLng = (location2.lng - location1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(location1.lat * Math.PI / 180) * Math.cos(location2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Generate hospital recommendations
   */
  generateHospitalRecommendations(hospitals, condition, severity) {
    const recommendations = [];

    if (hospitals.length === 0) {
      recommendations.push({
        type: 'warning',
        message: 'No suitable hospitals found. Consider expanding search criteria.',
        priority: 'high'
      });
      return recommendations;
    }

    const topHospital = hospitals[0];

    if (severity === 'critical') {
      recommendations.push({
        type: 'emergency',
        message: `Go to ${topHospital.name} immediately - Emergency Department`,
        priority: 'critical',
        hospital: topHospital,
        estimatedTime: `${topHospital.waitTime} minutes`
      });
    } else if (severity === 'high') {
      recommendations.push({
        type: 'urgent',
        message: `Visit ${topHospital.name} within 24 hours`,
        priority: 'high',
        hospital: topHospital,
        estimatedTime: `${topHospital.waitTime} minutes`
      });
    } else {
      recommendations.push({
        type: 'scheduled',
        message: `Schedule appointment at ${topHospital.name}`,
        priority: 'medium',
        hospital: topHospital,
        estimatedTime: `${topHospital.waitTime} minutes`
      });
    }

    // Add alternative options
    if (hospitals.length > 1) {
      recommendations.push({
        type: 'alternative',
        message: `Alternative: ${hospitals[1].name}`,
        priority: 'low',
        hospital: hospitals[1],
        estimatedTime: `${hospitals[1].waitTime} minutes`
      });
    }

    return recommendations;
  }

  /**
   * Log hospital matching for analytics
   */
  async logHospitalMatching(userId, condition, hospitals) {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO hospital_matching_logs (id, user_id, condition, matched_hospitals, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          require('crypto').randomUUID(),
          userId,
          condition,
          JSON.stringify(hospitals.map(h => ({ id: h.id, name: h.name, score: h.score })))
        ]
      );
    } catch (error) {
      this.log('error', 'Failed to log hospital matching', error.message);
    }
  }

  /**
   * Get insurance coverage information
   */
  getInsuranceCoverage(provider) {
    return this.insurancePlans[provider] || null;
  }

  /**
   * Add new hospital to the database
   */
  addHospital(hospitalData) {
    const newHospital = {
      id: `hosp_${Date.now()}`,
      ...hospitalData,
      created_at: new Date().toISOString()
    };
    this.hospitals.push(newHospital);
    this.log('info', 'New hospital added', { id: newHospital.id, name: newHospital.name });
    return newHospital;
  }
}

module.exports = HospitalInsuranceAgent;
