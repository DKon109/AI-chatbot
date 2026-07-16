const BaseAgent = require('./BaseAgent');

/**
 * Pharmacy & Prescription Agent - Securely transmits prescriptions to pharmacies and tracks dispensing status
 */
class PharmacyPrescriptionAgent extends BaseAgent {
  constructor() {
    super(
      'PharmacyPrescriptionAgent',
      'Securely transmits prescriptions to pharmacies and tracks dispensing status'
    );
    
    // Mock pharmacy database
    this.pharmacies = [
      {
        id: 'pharm_001',
        name: 'City Pharmacy',
        address: '123 Main St, City Center',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        phone: '(555) 123-4567',
        hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM',
        services: ['prescription', 'consultation', 'delivery'],
        insuranceAccepted: ['blue_cross', 'aetna', 'medicare'],
        deliveryAvailable: true,
        deliveryRadius: 10, // miles
        stockLevel: 0.85
      },
      {
        id: 'pharm_002',
        name: 'Metro Drug Store',
        address: '456 Oak Ave, Downtown',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        phone: '(555) 234-5678',
        hours: '24/7',
        services: ['prescription', 'consultation', 'emergency'],
        insuranceAccepted: ['blue_cross', 'cigna', 'medicare', 'medicaid'],
        deliveryAvailable: true,
        deliveryRadius: 15,
        stockLevel: 0.95
      },
      {
        id: 'pharm_003',
        name: 'Community Pharmacy',
        address: '789 Pine St, Suburbs',
        coordinates: { lat: 40.6892, lng: -74.0445 },
        phone: '(555) 345-6789',
        hours: 'Mon-Fri: 9AM-7PM, Sat: 9AM-5PM',
        services: ['prescription', 'consultation'],
        insuranceAccepted: ['blue_cross', 'aetna', 'medicaid'],
        deliveryAvailable: false,
        deliveryRadius: 0,
        stockLevel: 0.70
      }
    ];

    // Mock prescription database
    this.prescriptions = new Map();
    this.prescriptionStatuses = {
      PENDING: 'pending',
      SENT: 'sent',
      RECEIVED: 'received',
      FILLED: 'filled',
      READY: 'ready',
      PICKED_UP: 'picked_up',
      CANCELLED: 'cancelled'
    };
  }

  /**
   * Process prescription request
   */
  async process(request) {
    const { 
      userId, 
      prescription, 
      preferredPharmacy, 
      deliveryPreference = false,
      urgency = 'normal'
    } = request;

    this.log('info', 'Processing prescription request', { 
      userId, 
      medication: prescription.medication,
      urgency 
    });

    try {
      // Validate prescription
      const validation = this.validatePrescription(prescription);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          agent: this.name,
          timestamp: new Date().toISOString()
        };
      }

      // Find suitable pharmacies
      const suitablePharmacies = this.findSuitablePharmacies(
        prescription, 
        preferredPharmacy, 
        deliveryPreference
      );

      if (suitablePharmacies.length === 0) {
        return {
          success: false,
          error: 'No suitable pharmacies found for this prescription',
          agent: this.name,
          timestamp: new Date().toISOString()
        };
      }

      // Create prescription record
      const prescriptionId = this.createPrescriptionRecord(
        userId, 
        prescription, 
        suitablePharmacies[0]
      );

      // Send prescription to pharmacy
      const transmissionResult = await this.transmitPrescription(
        prescriptionId, 
        suitablePharmacies[0], 
        prescription
      );

      // Set up tracking
      await this.setupPrescriptionTracking(prescriptionId);

      this.log('info', 'Prescription processed successfully', {
        prescriptionId,
        pharmacy: suitablePharmacies[0].name,
        status: transmissionResult.status
      });

      return {
        success: true,
        prescriptionId,
        pharmacy: suitablePharmacies[0],
        status: transmissionResult.status,
        estimatedReadyTime: this.calculateReadyTime(suitablePharmacies[0], urgency),
        trackingInfo: {
          prescriptionId,
          statusUrl: `/api/prescriptions/${prescriptionId}/status`
        },
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Prescription processing failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate prescription data
   */
  validatePrescription(prescription) {
    const requiredFields = ['medication', 'dosage', 'frequency', 'duration'];
    
    for (const field of requiredFields) {
      if (!prescription[field]) {
        return {
          valid: false,
          error: `Missing required field: ${field}`
        };
      }
    }

    // Check for drug interactions (simplified)
    if (prescription.medication.toLowerCase().includes('warfarin') && 
        prescription.medication.toLowerCase().includes('aspirin')) {
      return {
        valid: false,
        error: 'Potential drug interaction detected. Please consult with pharmacist.'
      };
    }

    return { valid: true };
  }

  /**
   * Find suitable pharmacies for the prescription
   */
  findSuitablePharmacies(prescription, preferredPharmacy, deliveryPreference) {
    return this.pharmacies.filter(pharmacy => {
      // Check if pharmacy has the medication in stock
      const hasStock = this.checkMedicationStock(pharmacy, prescription.medication);
      
      // Check delivery preference
      const deliveryMatch = !deliveryPreference || pharmacy.deliveryAvailable;
      
      // Check if it's the preferred pharmacy
      const isPreferred = !preferredPharmacy || pharmacy.id === preferredPharmacy;
      
      return hasStock && deliveryMatch && (isPreferred || !preferredPharmacy);
    }).sort((a, b) => {
      // Prioritize preferred pharmacy
      if (a.id === preferredPharmacy) return -1;
      if (b.id === preferredPharmacy) return 1;
      
      // Then by stock level
      return b.stockLevel - a.stockLevel;
    });
  }

  /**
   * Check if pharmacy has medication in stock
   */
  checkMedicationStock(pharmacy, medication) {
    // Mock stock check - in reality, this would query pharmacy inventory
    const commonMedications = [
      'aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'lisinopril',
      'atorvastatin', 'metoprolol', 'omeprazole', 'amlodipine', 'hydrochlorothiazide'
    ];
    
    return commonMedications.some(med => 
      medication.toLowerCase().includes(med)
    ) && pharmacy.stockLevel > 0.5;
  }

  /**
   * Create prescription record
   */
  createPrescriptionRecord(userId, prescription, pharmacy) {
    const prescriptionId = `rx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const prescriptionRecord = {
      id: prescriptionId,
      userId,
      medication: prescription.medication,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions || '',
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      status: this.prescriptionStatuses.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackingHistory: [{
        status: this.prescriptionStatuses.PENDING,
        timestamp: new Date().toISOString(),
        note: 'Prescription created'
      }]
    };

    this.prescriptions.set(prescriptionId, prescriptionRecord);
    return prescriptionId;
  }

  /**
   * Transmit prescription to pharmacy
   */
  async transmitPrescription(prescriptionId, pharmacy, prescription) {
    // Simulate transmission delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const prescriptionRecord = this.prescriptions.get(prescriptionId);
    
    // Update status
    prescriptionRecord.status = this.prescriptionStatuses.SENT;
    prescriptionRecord.updatedAt = new Date().toISOString();
    prescriptionRecord.trackingHistory.push({
      status: this.prescriptionStatuses.SENT,
      timestamp: new Date().toISOString(),
      note: `Prescription sent to ${pharmacy.name}`
    });

    this.prescriptions.set(prescriptionId, prescriptionRecord);

    // Simulate pharmacy receiving and processing
    setTimeout(() => {
      this.simulatePharmacyProcessing(prescriptionId);
    }, 5000);

    return {
      status: this.prescriptionStatuses.SENT,
      pharmacy: pharmacy.name,
      transmissionTime: new Date().toISOString()
    };
  }

  /**
   * Simulate pharmacy processing
   */
  async simulatePharmacyProcessing(prescriptionId) {
    const prescriptionRecord = this.prescriptions.get(prescriptionId);
    if (!prescriptionRecord) return;

    // Simulate receiving
    prescriptionRecord.status = this.prescriptionStatuses.RECEIVED;
    prescriptionRecord.updatedAt = new Date().toISOString();
    prescriptionRecord.trackingHistory.push({
      status: this.prescriptionStatuses.RECEIVED,
      timestamp: new Date().toISOString(),
      note: 'Prescription received by pharmacy'
    });

    // Simulate filling
    setTimeout(() => {
      prescriptionRecord.status = this.prescriptionStatuses.FILLED;
      prescriptionRecord.updatedAt = new Date().toISOString();
      prescriptionRecord.trackingHistory.push({
        status: this.prescriptionStatuses.FILLED,
        timestamp: new Date().toISOString(),
        note: 'Prescription filled'
      });

      // Simulate ready for pickup
      setTimeout(() => {
        prescriptionRecord.status = this.prescriptionStatuses.READY;
        prescriptionRecord.updatedAt = new Date().toISOString();
        prescriptionRecord.trackingHistory.push({
          status: this.prescriptionStatuses.READY,
          timestamp: new Date().toISOString(),
          note: 'Prescription ready for pickup'
        });

        this.prescriptions.set(prescriptionId, prescriptionRecord);
        this.log('info', 'Prescription ready for pickup', { prescriptionId });
      }, 10000);
    }, 15000);

    this.prescriptions.set(prescriptionId, prescriptionRecord);
  }

  /**
   * Setup prescription tracking
   */
  async setupPrescriptionTracking(prescriptionId) {
    // In a real implementation, this would set up webhooks, notifications, etc.
    this.log('info', 'Prescription tracking setup', { prescriptionId });
  }

  /**
   * Calculate estimated ready time
   */
  calculateReadyTime(pharmacy, urgency) {
    const baseTime = 30; // minutes
    const urgencyMultiplier = urgency === 'urgent' ? 0.5 : 1;
    const stockMultiplier = pharmacy.stockLevel > 0.8 ? 1 : 1.5;
    
    const estimatedMinutes = Math.round(baseTime * urgencyMultiplier * stockMultiplier);
    const readyTime = new Date(Date.now() + estimatedMinutes * 60000);
    
    return {
      estimatedMinutes,
      readyTime: readyTime.toISOString(),
      readyTimeFormatted: readyTime.toLocaleString()
    };
  }

  /**
   * Get prescription status
   */
  getPrescriptionStatus(prescriptionId) {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      return {
        success: false,
        error: 'Prescription not found'
      };
    }

    return {
      success: true,
      prescription: {
        id: prescription.id,
        medication: prescription.medication,
        status: prescription.status,
        pharmacy: prescription.pharmacyName,
        trackingHistory: prescription.trackingHistory,
        updatedAt: prescription.updatedAt
      }
    };
  }

  /**
   * Mark prescription as picked up
   */
  markAsPickedUp(prescriptionId) {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) return false;

    prescription.status = this.prescriptionStatuses.PICKED_UP;
    prescription.updatedAt = new Date().toISOString();
    prescription.trackingHistory.push({
      status: this.prescriptionStatuses.PICKED_UP,
      timestamp: new Date().toISOString(),
      note: 'Prescription picked up by patient'
    });

    this.prescriptions.set(prescriptionId, prescription);
    this.log('info', 'Prescription marked as picked up', { prescriptionId });
    return true;
  }

  /**
   * Get user's prescription history
   */
  getUserPrescriptionHistory(userId) {
    const userPrescriptions = Array.from(this.prescriptions.values())
      .filter(prescription => prescription.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return userPrescriptions;
  }
}

module.exports = PharmacyPrescriptionAgent;
