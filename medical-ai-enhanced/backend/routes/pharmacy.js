const express = require('express');
const router = express.Router();
const { authenticateToken, requirePatient } = require('../middleware/auth');
const PharmacySearchService = require('../services/PharmacySearchService');

/**
 * @route GET /api/pharmacy/nearby
 * @desc Find nearby pharmacies based on user location
 * @access Private (Patient only)
 */
router.get('/nearby', authenticateToken, async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query; // radius in meters
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // In a real implementation, this would call Google Places API or similar
    // For now, we'll return mock data based on location
    const mockPharmacies = [
      {
        id: 'pharmacy_1',
        name: 'CVS Pharmacy',
        address: '123 Main Street, City, State 12345',
        phone: '(555) 123-4567',
        distance: 0.3, // miles
        coordinates: {
          latitude: parseFloat(latitude) + 0.001,
          longitude: parseFloat(longitude) + 0.001
        },
        hours: {
          monday: '8:00 AM - 10:00 PM',
          tuesday: '8:00 AM - 10:00 PM',
          wednesday: '8:00 AM - 10:00 PM',
          thursday: '8:00 AM - 10:00 PM',
          friday: '8:00 AM - 10:00 PM',
          saturday: '9:00 AM - 9:00 PM',
          sunday: '10:00 AM - 8:00 PM'
        },
        isOpen: true,
        waitTime: '15-20 minutes',
        services: ['Prescription Filling', 'Immunizations', 'Health Screenings'],
        insuranceAccepted: ['Blue Cross', 'Aetna', 'Cigna', 'Medicare']
      },
      {
        id: 'pharmacy_2',
        name: 'Walgreens',
        address: '456 Oak Avenue, City, State 12345',
        phone: '(555) 234-5678',
        distance: 0.7,
        coordinates: {
          latitude: parseFloat(latitude) + 0.002,
          longitude: parseFloat(longitude) - 0.001
        },
        hours: {
          monday: '24 Hours',
          tuesday: '24 Hours',
          wednesday: '24 Hours',
          thursday: '24 Hours',
          friday: '24 Hours',
          saturday: '24 Hours',
          sunday: '24 Hours'
        },
        isOpen: true,
        waitTime: '10-15 minutes',
        services: ['Prescription Filling', 'Immunizations', 'Photo Services'],
        insuranceAccepted: ['Blue Cross', 'Aetna', 'UnitedHealth', 'Medicaid']
      },
      {
        id: 'pharmacy_3',
        name: 'Rite Aid',
        address: '789 Pine Street, City, State 12345',
        phone: '(555) 345-6789',
        distance: 1.2,
        coordinates: {
          latitude: parseFloat(latitude) - 0.001,
          longitude: parseFloat(longitude) + 0.002
        },
        hours: {
          monday: '7:00 AM - 11:00 PM',
          tuesday: '7:00 AM - 11:00 PM',
          wednesday: '7:00 AM - 11:00 PM',
          thursday: '7:00 AM - 11:00 PM',
          friday: '7:00 AM - 11:00 PM',
          saturday: '8:00 AM - 10:00 PM',
          sunday: '9:00 AM - 9:00 PM'
        },
        isOpen: false,
        waitTime: 'N/A',
        services: ['Prescription Filling', 'Health Screenings', 'Beauty Products'],
        insuranceAccepted: ['Blue Cross', 'Cigna', 'Medicare', 'Medicaid']
      }
    ];

    // Filter pharmacies within radius (simplified calculation)
    const nearbyPharmacies = mockPharmacies.filter(pharmacy => 
      pharmacy.distance <= (radius / 1609.34) // Convert meters to miles
    );

    res.json({
      success: true,
      data: {
        pharmacies: nearbyPharmacies,
        searchLocation: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        searchRadius: radius
      },
      message: `Found ${nearbyPharmacies.length} pharmacies within ${radius/1000}km`
    });

  } catch (error) {
    console.error('Error finding nearby pharmacies:', error);
    next(error);
  }
});

/**
 * @route POST /api/pharmacy/share-prescription
 * @desc Share prescription with selected pharmacy
 * @access Private (Patient only)
 */
router.post('/share-prescription', authenticateToken, requirePatient, async (req, res, next) => {
  try {
    const { pharmacyId, prescriptionId, patientConsent } = req.body;
    const userId = req.userId;

    if (!pharmacyId || !prescriptionId || !patientConsent) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacy ID, prescription ID, and patient consent are required'
      });
    }

    // In a real implementation, this would:
    // 1. Verify the prescription belongs to the patient
    // 2. Send prescription details to the selected pharmacy
    // 3. Log the sharing event for audit purposes
    // 4. Send confirmation to both patient and pharmacy

    // Mock response
    res.json({
      success: true,
      data: {
        sharingId: `share_${Date.now()}`,
        pharmacyId,
        prescriptionId,
        sharedAt: new Date().toISOString(),
        status: 'shared',
        estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
      },
      message: 'Prescription successfully shared with pharmacy. You will be notified when ready for pickup.'
    });

  } catch (error) {
    console.error('Error sharing prescription:', error);
    next(error);
  }
});

/**
 * @route GET /api/pharmacy/directions/:pharmacyId
 * @desc Get directions to a specific pharmacy
 * @access Private (Patient only)
 */
router.get('/directions/:pharmacyId', authenticateToken, requirePatient, async (req, res, next) => {
  try {
    const { pharmacyId } = req.params;
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Current location (latitude, longitude) is required for directions'
      });
    }

    // In a real implementation, this would call Google Directions API
    // For now, return mock directions data
    const mockDirections = {
      pharmacyId,
      from: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      to: {
        latitude: parseFloat(latitude) + 0.001,
        longitude: parseFloat(longitude) + 0.001
      },
      distance: '0.3 miles',
      duration: '5 minutes',
      steps: [
        'Head north on Main Street',
        'Turn right onto Oak Avenue',
        'Destination will be on the left'
      ],
      mapUrl: `https://maps.google.com/maps?q=${latitude},${longitude}&destination=${parseFloat(latitude) + 0.001},${parseFloat(longitude) + 0.001}`
    };

    res.json({
      success: true,
      data: mockDirections,
      message: 'Directions generated successfully'
    });

  } catch (error) {
    console.error('Error getting directions:', error);
    next(error);
  }
});

module.exports = router;
