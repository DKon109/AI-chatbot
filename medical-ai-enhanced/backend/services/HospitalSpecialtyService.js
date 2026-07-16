const axios = require('axios');
const cheerio = require('cheerio');

class HospitalSpecialtyService {
  constructor() {
    this.specialtyKeywords = [
      // Cardiology
      'cardiology', 'cardiac', 'heart', 'cardiovascular', 'cardio',
      // Dermatology
      'dermatology', 'dermatologist', 'skin', 'dermatologic',
      // Orthopedics
      'orthopedic', 'orthopedics', 'bone', 'joint', 'sports medicine', 'orthopaedic',
      // Oncology
      'oncology', 'cancer', 'oncology', 'tumor', 'cancer treatment',
      // Neurology
      'neurology', 'neurological', 'brain', 'nervous system', 'neurosurgery',
      // Gastroenterology
      'gastroenterology', 'gastro', 'digestive', 'stomach', 'intestine',
      // Pulmonology
      'pulmonology', 'lung', 'respiratory', 'pulmonary', 'chest',
      // Endocrinology
      'endocrinology', 'diabetes', 'thyroid', 'hormone', 'endocrine',
      // Urology
      'urology', 'urological', 'kidney', 'bladder', 'urinary',
      // Gynecology
      'gynecology', 'gynecological', 'women health', 'obstetrics', 'ob-gyn',
      // Pediatrics
      'pediatrics', 'pediatric', 'children', 'child health',
      // Psychiatry
      'psychiatry', 'psychiatric', 'mental health', 'psychology',
      // Emergency Medicine
      'emergency', 'trauma', 'urgent care', 'critical care',
      // General Medicine
      'internal medicine', 'general practice', 'family medicine', 'primary care'
    ];

    this.specialtyMapping = {
      'cardiology': ['heart', 'chest pain', 'cardiac', 'blood pressure', 'hypertension'],
      'dermatology': ['skin', 'rash', 'dermatitis', 'acne', 'mole', 'lesion'],
      'orthopedics': ['bone', 'joint', 'fracture', 'arthritis', 'back pain', 'spine'],
      'oncology': ['cancer', 'tumor', 'malignancy', 'chemotherapy', 'radiation'],
      'neurology': ['headache', 'migraine', 'seizure', 'dizziness', 'numbness', 'brain'],
      'gastroenterology': ['stomach', 'digestive', 'nausea', 'vomiting', 'diarrhea', 'constipation'],
      'pulmonology': ['lung', 'breathing', 'cough', 'asthma', 'respiratory', 'chest'],
      'endocrinology': ['diabetes', 'thyroid', 'hormone', 'blood sugar', 'metabolism'],
      'urology': ['kidney', 'bladder', 'urinary', 'prostate', 'urination'],
      'gynecology': ['women', 'pregnancy', 'menstrual', 'reproductive', 'pelvic'],
      'pediatrics': ['child', 'infant', 'baby', 'pediatric', 'children'],
      'psychiatry': ['mental', 'depression', 'anxiety', 'psychiatric', 'behavioral'],
      'emergency': ['emergency', 'urgent', 'trauma', 'critical', 'severe'],
      'general': ['general', 'primary', 'family', 'internal medicine']
    };
  }

  /**
   * Extract specialties from a hospital/clinic website
   * @param {string} websiteUrl - The website URL to crawl
   * @returns {Promise<Array>} Array of detected specialties
   */
  async extractSpecialties(websiteUrl) {
    try {
      console.log(`Crawling website for specialties: ${websiteUrl}`);
      
      const response = await axios.get(websiteUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MedicalAI-Bot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      const text = $('body').text().toLowerCase();
      
      // Extract JSON-LD structured data
      const jsonLdData = this.extractJsonLdData($);
      
      // Extract specialties from JSON-LD
      const jsonLdSpecialties = this.extractSpecialtiesFromJsonLd(jsonLdData);
      
      // Extract specialties from page text
      const textSpecialties = this.extractSpecialtiesFromText(text);
      
      // Combine and deduplicate
      const allSpecialties = [...new Set([...jsonLdSpecialties, ...textSpecialties])];
      
      console.log(`Found specialties for ${websiteUrl}:`, allSpecialties);
      return allSpecialties;
      
    } catch (error) {
      console.error(`Error crawling website ${websiteUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Extract JSON-LD structured data from the page
   */
  extractJsonLdData($) {
    const jsonLdData = [];
    
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        jsonLdData.push(data);
      } catch (e) {
        // Ignore invalid JSON
      }
    });
    
    return jsonLdData;
  }

  /**
   * Extract specialties from JSON-LD data
   */
  extractSpecialtiesFromJsonLd(jsonLdData) {
    const specialties = [];
    
    for (const data of jsonLdData) {
      if (data['@type'] === 'MedicalClinic' || 
          data['@type'] === 'Physician' || 
          data['@type'] === 'Hospital' ||
          data['@type'] === 'MedicalOrganization') {
        
        if (data.medicalSpecialty) {
          if (Array.isArray(data.medicalSpecialty)) {
            specialties.push(...data.medicalSpecialty);
          } else {
            specialties.push(data.medicalSpecialty);
          }
        }
        
        if (data.specialty) {
          if (Array.isArray(data.specialty)) {
            specialties.push(...data.specialty);
          } else {
            specialties.push(data.specialty);
          }
        }
      }
    }
    
    return specialties.map(s => s.toLowerCase());
  }

  /**
   * Extract specialties from page text using intelligent keyword matching
   */
  extractSpecialtiesFromText(text) {
    const foundSpecialties = [];
    
    // Look for specialty patterns in specific contexts
    const specialtyPatterns = [
      // Services/Specialties sections
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(cardiology|cardiac|heart|cardiovascular)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(dermatology|dermatologist|skin)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(orthopedic|orthopedics|bone|joint|sports medicine)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(oncology|cancer|tumor)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(neurology|neurological|brain|nervous system)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(gastroenterology|gastro|digestive|stomach|intestine)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(pulmonology|lung|respiratory|pulmonary|chest)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(endocrinology|diabetes|thyroid|hormone|endocrine)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(urology|urological|kidney|bladder|urinary)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(gynecology|gynecological|women health|obstetrics|ob-gyn)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(pediatrics|pediatric|children|child health)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(psychiatry|psychiatric|mental health|psychology)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(emergency|trauma|urgent care|critical care)/gi,
      /(?:services?|specialties?|departments?|we offer|our services?)[\s\S]{0,200}?(internal medicine|general practice|family medicine|primary care)/gi
    ];
    
    // Check for specialty patterns
    for (const pattern of specialtyPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const specialty = this.mapKeywordToSpecialty(match.toLowerCase());
          if (specialty && !foundSpecialties.includes(specialty)) {
            foundSpecialties.push(specialty);
          }
        }
      }
    }
    
    // If no specialties found in services sections, check for general practice indicators
    if (foundSpecialties.length === 0) {
      const generalPracticeIndicators = [
        'general practice', 'family medicine', 'primary care', 'internal medicine',
        'general practitioner', 'gp', 'family doctor', 'primary healthcare'
      ];
      
      for (const indicator of generalPracticeIndicators) {
        if (text.includes(indicator)) {
          foundSpecialties.push('general');
          break;
        }
      }
    }
    
    return foundSpecialties;
  }

  /**
   * Map keyword to specialty category
   */
  mapKeywordToSpecialty(keyword) {
    const keywordLower = keyword.toLowerCase();
    
    // Only map to specialties if the keyword appears in a clear service context
    if (keywordLower.includes('cardiology') || keywordLower.includes('cardiac') || keywordLower.includes('cardiovascular')) {
      return 'cardiology';
    }
    if (keywordLower.includes('dermatology') || keywordLower.includes('dermatologist')) {
      return 'dermatology';
    }
    if (keywordLower.includes('orthopedic') || keywordLower.includes('orthopedics') || keywordLower.includes('sports medicine')) {
      return 'orthopedics';
    }
    if (keywordLower.includes('oncology') || keywordLower.includes('cancer treatment')) {
      return 'oncology';
    }
    if (keywordLower.includes('neurology') || keywordLower.includes('neurological') || keywordLower.includes('neurosurgery')) {
      return 'neurology';
    }
    if (keywordLower.includes('gastroenterology') || keywordLower.includes('gastro')) {
      return 'gastroenterology';
    }
    if (keywordLower.includes('pulmonology') || keywordLower.includes('pulmonary')) {
      return 'pulmonology';
    }
    if (keywordLower.includes('endocrinology') || keywordLower.includes('diabetes specialist')) {
      return 'endocrinology';
    }
    if (keywordLower.includes('urology') || keywordLower.includes('urological')) {
      return 'urology';
    }
    if (keywordLower.includes('gynecology') || keywordLower.includes('gynecological') || keywordLower.includes('obstetrics') || keywordLower.includes('ob-gyn')) {
      return 'gynecology';
    }
    if (keywordLower.includes('pediatrics') || keywordLower.includes('pediatric')) {
      return 'pediatrics';
    }
    if (keywordLower.includes('psychiatry') || keywordLower.includes('psychiatric')) {
      return 'psychiatry';
    }
    if (keywordLower.includes('emergency') || keywordLower.includes('trauma') || keywordLower.includes('urgent care') || keywordLower.includes('critical care')) {
      return 'emergency';
    }
    if (keywordLower.includes('internal medicine') || keywordLower.includes('general practice') || keywordLower.includes('family medicine') || keywordLower.includes('primary care')) {
      return 'general';
    }
    
    return null;
  }

  /**
   * Map symptoms to relevant specialties
   * @param {Array} symptoms - Array of symptoms
   * @returns {Array} Array of relevant specialties
   */
  mapSymptomsToSpecialties(symptoms) {
    const relevantSpecialties = new Set();
    const symptomsLower = symptoms.map(s => s.toLowerCase());
    
    for (const [specialty, keywords] of Object.entries(this.specialtyMapping)) {
      for (const keyword of keywords) {
        if (symptomsLower.some(symptom => symptom.includes(keyword))) {
          relevantSpecialties.add(specialty);
        }
      }
    }
    
    return Array.from(relevantSpecialties);
  }

  /**
   * Score hospital relevance based on symptoms
   * @param {Array} hospitalSpecialties - Hospital's specialties
   * @param {Array} relevantSpecialties - Relevant specialties for symptoms
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevanceScore(hospitalSpecialties, relevantSpecialties) {
    if (hospitalSpecialties.length === 0) return 0;
    
    const matchingSpecialties = hospitalSpecialties.filter(specialty => 
      relevantSpecialties.includes(specialty)
    );
    
    return matchingSpecialties.length / relevantSpecialties.length;
  }
}

module.exports = new HospitalSpecialtyService();
