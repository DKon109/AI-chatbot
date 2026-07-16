const BaseAgent = require('./BaseAgent');

/**
 * Meal & Nutrition Agent - Validates meals, explains AI refusals, and suggests safer food alternatives
 */
class MealNutritionAgent extends BaseAgent {
  constructor() {
    super(
      'MealNutritionAgent',
      'Validates meals, explains AI refusals, and suggests safer food alternatives'
    );
    
    // Nutrition database with condition-specific restrictions
    this.nutritionDatabase = {
      diabetes: {
        allowed: [
          'leafy greens', 'non-starchy vegetables', 'lean proteins', 'whole grains',
          'nuts', 'seeds', 'berries', 'avocado', 'olive oil', 'fish'
        ],
        restricted: [
          'refined sugars', 'white bread', 'white rice', 'sweetened beverages',
          'candy', 'cookies', 'cakes', 'fruit juices', 'dried fruits'
        ],
        portionLimits: {
          'carbohydrates': '45-60g per meal',
          'fiber': '25-35g daily',
          'protein': '15-20% of calories'
        },
        glycemicIndex: {
          low: ['broccoli', 'spinach', 'quinoa', 'sweet potato'],
          medium: ['brown rice', 'oatmeal', 'banana'],
          high: ['white bread', 'white rice', 'sugar']
        }
      },
      hypertension: {
        allowed: [
          'fresh vegetables', 'fresh fruits', 'whole grains', 'lean proteins',
          'low-fat dairy', 'nuts', 'seeds', 'herbs', 'spices'
        ],
        restricted: [
          'high sodium foods', 'processed meats', 'canned foods', 'fast food',
          'pickled foods', 'sauces', 'condiments', 'alcohol'
        ],
        sodiumLimit: '2300mg daily',
        potassiumRich: ['bananas', 'sweet potatoes', 'spinach', 'avocado', 'beans']
      },
      heart_disease: {
        allowed: [
          'omega-3 rich fish', 'nuts', 'seeds', 'olive oil', 'avocado',
          'leafy greens', 'berries', 'whole grains', 'legumes'
        ],
        restricted: [
          'saturated fats', 'trans fats', 'processed meats', 'fried foods',
          'high cholesterol foods', 'excessive sodium'
        ],
        cholesterolLimit: '200mg daily',
        saturatedFatLimit: '7% of calories'
      },
      obesity: {
        allowed: [
          'high fiber foods', 'lean proteins', 'vegetables', 'fruits',
          'whole grains', 'low-calorie foods', 'water'
        ],
        restricted: [
          'high calorie foods', 'sugary drinks', 'processed foods',
          'large portions', 'high fat foods'
        ],
        calorieTarget: '1200-1500 daily',
        portionControl: 'smaller, frequent meals'
      }
    };

    // Food safety database
    this.foodSafetyDatabase = {
      allergens: ['peanuts', 'tree nuts', 'shellfish', 'fish', 'eggs', 'milk', 'soy', 'wheat'],
      interactions: {
        'warfarin': ['leafy greens', 'cranberry', 'grapefruit'],
        'metformin': ['alcohol', 'high sugar foods'],
        'statins': ['grapefruit', 'alcohol']
      },
      contamination: {
        highRisk: ['raw fish', 'unpasteurized dairy', 'undercooked meat'],
        moderateRisk: ['pre-cut fruits', 'deli meats', 'soft cheeses']
      }
    };
  }

  /**
   * Process meal validation request
   */
  async process(request) {
    const { 
      userId, 
      meal, 
      patientCondition, 
      medications = [],
      allergies = [],
      preferences = {}
    } = request;

    this.log('info', 'Processing meal validation request', { 
      userId, 
      meal: meal.name || 'Unknown meal',
      condition: patientCondition
    });

    try {
      // Analyze meal components
      const mealAnalysis = this.analyzeMeal(meal);
      
      // Check for condition-specific restrictions
      const conditionCheck = this.checkConditionCompliance(mealAnalysis, patientCondition);
      
      // Check for medication interactions
      const interactionCheck = this.checkMedicationInteractions(mealAnalysis, medications);
      
      // Check for allergies
      const allergyCheck = this.checkAllergies(mealAnalysis, allergies);
      
      // Check food safety
      const safetyCheck = this.checkFoodSafety(mealAnalysis);
      
      // Generate overall assessment
      const assessment = this.generateAssessment(
        conditionCheck, 
        interactionCheck, 
        allergyCheck, 
        safetyCheck
      );
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        assessment, 
        mealAnalysis, 
        patientCondition
      );

      // Log the meal validation
      await this.logMealValidation(userId, meal, assessment);

      this.log('info', 'Meal validation completed', {
        status: assessment.status,
        warnings: assessment.warnings.length,
        recommendations: recommendations.length
      });

      return {
        success: true,
        mealAnalysis,
        assessment,
        recommendations,
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Meal validation failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze meal components
   */
  analyzeMeal(meal) {
    const analysis = {
      name: meal.name || 'Unknown meal',
      components: [],
      nutritionalProfile: {
        calories: 0,
        carbohydrates: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
        sugar: 0
      },
      allergens: [],
      glycemicIndex: 'unknown',
      portionSize: meal.portionSize || 'unknown'
    };

    // Extract components from meal description or ingredients
    const mealText = (meal.description || meal.ingredients || '').toLowerCase();
    
    // Identify food components
    const foodComponents = this.identifyFoodComponents(mealText);
    analysis.components = foodComponents;

    // Estimate nutritional profile
    analysis.nutritionalProfile = this.estimateNutritionalProfile(foodComponents);

    // Identify allergens
    analysis.allergens = this.identifyAllergens(mealText);

    // Estimate glycemic index
    analysis.glycemicIndex = this.estimateGlycemicIndex(foodComponents);

    return analysis;
  }

  /**
   * Identify food components from meal description
   */
  identifyFoodComponents(mealText) {
    const commonFoods = [
      'rice', 'bread', 'pasta', 'potato', 'chicken', 'beef', 'fish', 'salmon',
      'vegetables', 'broccoli', 'spinach', 'carrots', 'tomato', 'onion',
      'fruits', 'apple', 'banana', 'orange', 'berries', 'avocado',
      'dairy', 'milk', 'cheese', 'yogurt', 'butter',
      'nuts', 'almonds', 'walnuts', 'seeds', 'olive oil',
      'sugar', 'honey', 'syrup', 'sauce', 'salt'
    ];

    return commonFoods.filter(food => mealText.includes(food));
  }

  /**
   * Estimate nutritional profile
   */
  estimateNutritionalProfile(components) {
    // Simplified nutritional estimation
    const nutritionData = {
      'rice': { calories: 130, carbs: 28, protein: 2.7, fat: 0.3, fiber: 0.4, sodium: 1, sugar: 0 },
      'bread': { calories: 80, carbs: 15, protein: 3, fat: 1, fiber: 1, sodium: 150, sugar: 2 },
      'chicken': { calories: 165, carbs: 0, protein: 31, fat: 3.6, fiber: 0, sodium: 74, sugar: 0 },
      'vegetables': { calories: 25, carbs: 5, protein: 2, fat: 0.2, fiber: 2, sodium: 10, sugar: 3 },
      'fruits': { calories: 60, carbs: 15, protein: 1, fat: 0.2, fiber: 3, sodium: 1, sugar: 12 },
      'dairy': { calories: 100, carbs: 8, protein: 8, fat: 5, fiber: 0, sodium: 120, sugar: 8 },
      'nuts': { calories: 160, carbs: 6, protein: 6, fat: 14, fiber: 3, sodium: 0, sugar: 1 }
    };

    const profile = {
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
      sugar: 0
    };

    components.forEach(component => {
      const nutrition = nutritionData[component];
      if (nutrition) {
        Object.keys(profile).forEach(key => {
          profile[key] += nutrition[key] || 0;
        });
      }
    });

    return profile;
  }

  /**
   * Identify allergens in meal
   */
  identifyAllergens(mealText) {
    return this.foodSafetyDatabase.allergens.filter(allergen => 
      mealText.includes(allergen)
    );
  }

  /**
   * Estimate glycemic index
   */
  estimateGlycemicIndex(components) {
    const highGI = ['rice', 'bread', 'pasta', 'potato', 'sugar'];
    const mediumGI = ['banana', 'orange', 'oatmeal'];
    const lowGI = ['broccoli', 'spinach', 'quinoa', 'sweet potato'];

    if (components.some(comp => highGI.includes(comp))) return 'high';
    if (components.some(comp => mediumGI.includes(comp))) return 'medium';
    if (components.some(comp => lowGI.includes(comp))) return 'low';
    return 'unknown';
  }

  /**
   * Check condition-specific compliance
   */
  checkConditionCompliance(mealAnalysis, condition) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const guidelines = this.nutritionDatabase[conditionKey];
    
    if (!guidelines) {
      return {
        status: 'unknown',
        warnings: ['No specific nutrition guidelines found for this condition'],
        score: 0.5
      };
    }

    const warnings = [];
    let score = 1.0;

    // Check restricted foods
    const restrictedFound = mealAnalysis.components.filter(component =>
      guidelines.restricted.some(restricted => 
        component.includes(restricted) || restricted.includes(component)
      )
    );

    if (restrictedFound.length > 0) {
      warnings.push(`Contains restricted foods: ${restrictedFound.join(', ')}`);
      score -= 0.3;
    }

    // Check portion limits for specific conditions
    if (conditionKey === 'diabetes') {
      if (mealAnalysis.nutritionalProfile.carbohydrates > 60) {
        warnings.push('Carbohydrate content exceeds recommended limit');
        score -= 0.2;
      }
    }

    if (conditionKey === 'hypertension') {
      if (mealAnalysis.nutritionalProfile.sodium > 600) { // Assuming 1/4 of daily limit per meal
        warnings.push('Sodium content exceeds recommended limit');
        score -= 0.2;
      }
    }

    // Check glycemic index for diabetes
    if (conditionKey === 'diabetes' && mealAnalysis.glycemicIndex === 'high') {
      warnings.push('High glycemic index foods may cause blood sugar spikes');
      score -= 0.2;
    }

    return {
      status: score > 0.7 ? 'compliant' : score > 0.4 ? 'warning' : 'non_compliant',
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Check medication interactions
   */
  checkMedicationInteractions(mealAnalysis, medications) {
    const warnings = [];
    let score = 1.0;

    medications.forEach(medication => {
      const interactions = this.foodSafetyDatabase.interactions[medication.name?.toLowerCase()];
      if (interactions) {
        const interactingFoods = mealAnalysis.components.filter(component =>
          interactions.some(interaction => 
            component.includes(interaction) || interaction.includes(component)
          )
        );

        if (interactingFoods.length > 0) {
          warnings.push(`Food interaction with ${medication.name}: ${interactingFoods.join(', ')}`);
          score -= 0.3;
        }
      }
    });

    return {
      status: score > 0.7 ? 'safe' : 'warning',
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Check for allergies
   */
  checkAllergies(mealAnalysis, allergies) {
    const warnings = [];
    let score = 1.0;

    const allergenFound = mealAnalysis.allergens.filter(allergen =>
      allergies.some(allergy => 
        allergen.includes(allergy) || allergy.includes(allergen)
      )
    );

    if (allergenFound.length > 0) {
      warnings.push(`Contains allergens: ${allergenFound.join(', ')}`);
      score = 0; // Critical issue
    }

    return {
      status: score > 0 ? 'safe' : 'critical',
      warnings,
      score
    };
  }

  /**
   * Check food safety
   */
  checkFoodSafety(mealAnalysis) {
    const warnings = [];
    let score = 1.0;

    const highRiskFoods = mealAnalysis.components.filter(component =>
      this.foodSafetyDatabase.contamination.highRisk.some(risk =>
        component.includes(risk) || risk.includes(component)
      )
    );

    if (highRiskFoods.length > 0) {
      warnings.push(`High-risk foods detected: ${highRiskFoods.join(', ')}`);
      score -= 0.4;
    }

    return {
      status: score > 0.7 ? 'safe' : 'warning',
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Generate overall assessment
   */
  generateAssessment(conditionCheck, interactionCheck, allergyCheck, safetyCheck) {
    const allWarnings = [
      ...conditionCheck.warnings,
      ...interactionCheck.warnings,
      ...allergyCheck.warnings,
      ...safetyCheck.warnings
    ];

    const overallScore = (
      conditionCheck.score + 
      interactionCheck.score + 
      allergyCheck.score + 
      safetyCheck.score
    ) / 4;

    let status;
    if (allergyCheck.status === 'critical') {
      status = 'critical';
    } else if (overallScore > 0.7) {
      status = 'approved';
    } else if (overallScore > 0.4) {
      status = 'warning';
    } else {
      status = 'rejected';
    }

    return {
      status,
      score: overallScore,
      warnings: allWarnings,
      details: {
        condition: conditionCheck,
        interactions: interactionCheck,
        allergies: allergyCheck,
        safety: safetyCheck
      }
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(assessment, mealAnalysis, condition) {
    const recommendations = [];
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const guidelines = this.nutritionDatabase[conditionKey];

    if (assessment.status === 'critical') {
      recommendations.push({
        type: 'critical',
        message: 'DO NOT CONSUME - Contains allergens or dangerous interactions',
        priority: 'critical'
      });
      return recommendations;
    }

    if (assessment.status === 'rejected') {
      recommendations.push({
        type: 'rejection',
        message: 'Meal not recommended due to multiple compliance issues',
        priority: 'high'
      });
    }

    // Add specific recommendations based on warnings
    assessment.warnings.forEach(warning => {
      recommendations.push({
        type: 'warning',
        message: warning,
        priority: 'medium'
      });
    });

    // Suggest alternatives
    if (guidelines && assessment.details.condition.score < 0.7) {
      recommendations.push({
        type: 'alternative',
        message: `Consider these alternatives: ${guidelines.allowed.slice(0, 5).join(', ')}`,
        priority: 'low'
      });
    }

    // Portion control recommendations
    if (mealAnalysis.nutritionalProfile.calories > 500) {
      recommendations.push({
        type: 'portion',
        message: 'Consider reducing portion size to control calorie intake',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Log meal validation
   */
  async logMealValidation(userId, meal, assessment) {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO meal_validation_logs (id, user_id, meal_data, assessment, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          require('crypto').randomUUID(),
          userId,
          JSON.stringify(meal),
          JSON.stringify(assessment)
        ]
      );
    } catch (error) {
      this.log('error', 'Failed to log meal validation', error.message);
    }
  }

  /**
   * Get nutrition recommendations for condition
   */
  getNutritionRecommendations(condition) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    return this.nutritionDatabase[conditionKey] || null;
  }

  /**
   * Suggest meal alternatives
   */
  suggestAlternatives(originalMeal, condition, preferences = {}) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const guidelines = this.nutritionDatabase[conditionKey];
    
    if (!guidelines) return [];

    const alternatives = guidelines.allowed.map(food => ({
      food,
      reason: `Recommended for ${condition}`,
      nutritionalBenefit: this.getNutritionalBenefit(food, condition)
    }));

    return alternatives.slice(0, 5); // Return top 5 alternatives
  }

  /**
   * Get nutritional benefit of a food
   */
  getNutritionalBenefit(food, condition) {
    const benefits = {
      diabetes: 'Helps maintain stable blood sugar',
      hypertension: 'Low sodium, high potassium',
      heart_disease: 'Heart-healthy fats and nutrients',
      obesity: 'Low calorie, high fiber'
    };
    
    return benefits[condition.toLowerCase().replace(/\s+/g, '_')] || 'Nutritious option';
  }
}

module.exports = MealNutritionAgent;
