const BaseAgent = require('./BaseAgent');

class StructuredSymptomAgent extends BaseAgent {
    constructor() {
        super('StructuredSymptomAgent');
        this.symptomCategories = this.initializeSymptomCategories();
        this.diseaseDatabase = this.initializeDiseaseDatabase();
    }

    initializeSymptomCategories() {
        return {
            'cardiovascular': {
                name: 'Heart & Circulation',
                icon: '❤️',
                symptoms: {
                    'chest_pain': {
                        name: 'Chest Pain',
                        severity: 'high',
                        questions: [
                            'Is the pain sharp or dull?',
                            'Does it radiate to your arm, neck, or jaw?',
                            'Does it worsen with activity?',
                            'How long does it last?'
                        ]
                    },
                    'shortness_breath': {
                        name: 'Shortness of Breath',
                        severity: 'high',
                        questions: [
                            'Does it occur at rest or only during activity?',
                            'Do you wake up short of breath at night?',
                            'Do you need to sit up to breathe comfortably?'
                        ]
                    },
                    'heart_palpitations': {
                        name: 'Heart Palpitations',
                        severity: 'moderate',
                        questions: [
                            'Does your heart feel like it\'s racing?',
                            'Do you feel skipped beats?',
                            'Does it happen at rest or during activity?'
                        ]
                    },
                    'swelling_legs': {
                        name: 'Swelling in Legs/Ankles',
                        severity: 'moderate',
                        questions: [
                            'Is the swelling in one or both legs?',
                            'Does it improve with elevation?',
                            'Do you have difficulty walking?'
                        ]
                    }
                }
            },
            'respiratory': {
                name: 'Lungs & Breathing',
                icon: '🫁',
                symptoms: {
                    'cough': {
                        name: 'Cough',
                        severity: 'moderate',
                        questions: [
                            'Is it dry or productive (with phlegm)?',
                            'What color is the phlegm?',
                            'How long have you had it?',
                            'Does it worsen at night?'
                        ]
                    },
                    'wheezing': {
                        name: 'Wheezing',
                        severity: 'high',
                        questions: [
                            'Do you hear whistling sounds when breathing?',
                            'Does it worsen with exercise?',
                            'Do you have a history of asthma?'
                        ]
                    },
                    'chest_tightness': {
                        name: 'Chest Tightness',
                        severity: 'high',
                        questions: [
                            'Does it feel like something is squeezing your chest?',
                            'Does it worsen with deep breathing?',
                            'Are you having trouble taking deep breaths?'
                        ]
                    }
                }
            },
            'neurological': {
                name: 'Brain & Nervous System',
                icon: '🧠',
                symptoms: {
                    'headache': {
                        name: 'Headache',
                        severity: 'moderate',
                        questions: [
                            'Is it a throbbing or constant pain?',
                            'Where is the pain located?',
                            'Does light or sound make it worse?',
                            'Have you had headaches like this before?'
                        ]
                    },
                    'dizziness': {
                        name: 'Dizziness/Vertigo',
                        severity: 'moderate',
                        questions: [
                            'Do you feel like the room is spinning?',
                            'Does it happen when you stand up?',
                            'Do you feel lightheaded or faint?'
                        ]
                    },
                    'confusion': {
                        name: 'Confusion/Memory Problems',
                        severity: 'high',
                        questions: [
                            'Are you having trouble remembering recent events?',
                            'Do you feel disoriented about time or place?',
                            'Are others noticing changes in your behavior?'
                        ]
                    },
                    'numbness': {
                        name: 'Numbness/Tingling',
                        severity: 'moderate',
                        questions: [
                            'Where do you feel numbness or tingling?',
                            'Is it in one side of your body?',
                            'Does it come and go or is it constant?'
                        ]
                    }
                }
            },
            'gastrointestinal': {
                name: 'Digestive System',
                icon: '🫃',
                symptoms: {
                    'abdominal_pain': {
                        name: 'Abdominal Pain',
                        severity: 'moderate',
                        questions: [
                            'Where exactly is the pain located?',
                            'Is it sharp, crampy, or dull?',
                            'Does eating make it better or worse?',
                            'Have you had nausea or vomiting?'
                        ]
                    },
                    'nausea_vomiting': {
                        name: 'Nausea/Vomiting',
                        severity: 'moderate',
                        questions: [
                            'How many times have you vomited?',
                            'Is there blood in the vomit?',
                            'Can you keep liquids down?',
                            'When did it start?'
                        ]
                    },
                    'diarrhea': {
                        name: 'Diarrhea',
                        severity: 'moderate',
                        questions: [
                            'How many bowel movements per day?',
                            'Is there blood or mucus in the stool?',
                            'Are you able to stay hydrated?',
                            'Have you traveled recently?'
                        ]
                    },
                    'constipation': {
                        name: 'Constipation',
                        severity: 'low',
                        questions: [
                            'How many days since your last bowel movement?',
                            'Do you feel bloated or uncomfortable?',
                            'Have you tried any remedies?'
                        ]
                    }
                }
            },
            'musculoskeletal': {
                name: 'Muscles & Bones',
                icon: '🦴',
                symptoms: {
                    'joint_pain': {
                        name: 'Joint Pain',
                        severity: 'moderate',
                        questions: [
                            'Which joints are affected?',
                            'Is there swelling or stiffness?',
                            'Does it worsen with movement?',
                            'Is it worse in the morning?'
                        ]
                    },
                    'back_pain': {
                        name: 'Back Pain',
                        severity: 'moderate',
                        questions: [
                            'Is it upper, middle, or lower back?',
                            'Does it radiate down your legs?',
                            'What makes it better or worse?',
                            'Did it start suddenly or gradually?'
                        ]
                    },
                    'muscle_weakness': {
                        name: 'Muscle Weakness',
                        severity: 'high',
                        questions: [
                            'Which muscles are affected?',
                            'Is it getting worse over time?',
                            'Do you have trouble with daily activities?'
                        ]
                    }
                }
            },
            'general': {
                name: 'General Symptoms',
                icon: '🌡️',
                symptoms: {
                    'fever': {
                        name: 'Fever',
                        severity: 'moderate',
                        questions: [
                            'What is your temperature?',
                            'How long have you had the fever?',
                            'Do you have chills or sweating?',
                            'Are you taking any fever reducers?'
                        ]
                    },
                    'fatigue': {
                        name: 'Fatigue/Tiredness',
                        severity: 'moderate',
                        questions: [
                            'How long have you felt tired?',
                            'Does rest help?',
                            'Are you sleeping well?',
                            'Is it affecting your daily activities?'
                        ]
                    },
                    'weight_loss': {
                        name: 'Unexplained Weight Loss',
                        severity: 'high',
                        questions: [
                            'How much weight have you lost?',
                            'Over what time period?',
                            'Have you been trying to lose weight?',
                            'Has your appetite changed?'
                        ]
                    },
                    'night_sweats': {
                        name: 'Night Sweats',
                        severity: 'moderate',
                        questions: [
                            'How often do you have night sweats?',
                            'Do you wake up drenched?',
                            'Is your bedroom temperature comfortable?',
                            'Are you taking any medications?'
                        ]
                    }
                }
            }
        };
    }

    initializeDiseaseDatabase() {
        return {
            'heart_attack': {
                name: 'Heart Attack (Myocardial Infarction)',
                symptoms: ['chest_pain', 'shortness_breath', 'nausea_vomiting', 'sweating'],
                severity: 'critical',
                urgency: 'immediate',
                description: 'A medical emergency requiring immediate treatment'
            },
            'stroke': {
                name: 'Stroke',
                symptoms: ['numbness', 'confusion', 'headache', 'dizziness'],
                severity: 'critical',
                urgency: 'immediate',
                description: 'A medical emergency requiring immediate treatment'
            },
            'pneumonia': {
                name: 'Pneumonia',
                symptoms: ['cough', 'fever', 'shortness_breath', 'chest_pain'],
                severity: 'high',
                urgency: 'urgent',
                description: 'Lung infection requiring prompt medical attention'
            },
            'asthma_attack': {
                name: 'Asthma Attack',
                symptoms: ['wheezing', 'shortness_breath', 'chest_tightness'],
                severity: 'high',
                urgency: 'urgent',
                description: 'Respiratory condition requiring immediate treatment'
            },
            'migraine': {
                name: 'Migraine',
                symptoms: ['headache', 'nausea_vomiting', 'dizziness'],
                severity: 'moderate',
                urgency: 'appointment',
                description: 'Severe headache condition'
            },
            'flu': {
                name: 'Influenza (Flu)',
                symptoms: ['fever', 'fatigue', 'cough', 'muscle_weakness'],
                severity: 'moderate',
                urgency: 'appointment',
                description: 'Viral respiratory illness'
            },
            'gastroenteritis': {
                name: 'Gastroenteritis (Stomach Flu)',
                symptoms: ['nausea_vomiting', 'diarrhea', 'abdominal_pain', 'fever'],
                severity: 'moderate',
                urgency: 'appointment',
                description: 'Inflammation of the stomach and intestines'
            },
            'anxiety_attack': {
                name: 'Anxiety/Panic Attack',
                symptoms: ['chest_pain', 'shortness_breath', 'dizziness', 'heart_palpitations'],
                severity: 'moderate',
                urgency: 'appointment',
                description: 'Mental health condition requiring support'
            }
        };
    }

    async process(request) {
        const { userId, step, selectedSymptoms = [], answers = {}, location } = request;
        
        this.log('info', 'Processing structured symptom analysis', { 
            userId, 
            step, 
            selectedSymptomsCount: selectedSymptoms.length 
        });

        try {
            switch (step) {
                case 'categorize':
                    return this.getSymptomCategories();
                
                case 'select_symptoms':
                    return this.getSymptomDetails(request.category);
                
                case 'answer_questions':
                    return this.processSymptomAnswers(selectedSymptoms, answers);
                
                case 'analyze':
                    return this.performDiseaseAnalysis(selectedSymptoms, answers, location);
                
                default:
                    return this.getSymptomCategories();
            }
        } catch (error) {
            this.log('error', 'Structured symptom analysis failed', error.message);
            return {
                success: false,
                error: error.message,
                agent: this.name,
                timestamp: new Date().toISOString()
            };
        }
    }

    getSymptomCategories() {
        const categories = Object.entries(this.symptomCategories).map(([key, category]) => ({
            id: key,
            name: category.name,
            icon: category.icon,
            symptomCount: Object.keys(category.symptoms).length
        }));

        return {
            success: true,
            step: 'categorize',
            message: "🏥 **Welcome to our Medical Symptom Checker!**\n\nPlease select the category that best describes your main concern:",
            categories: categories,
            agent: this.name,
            timestamp: new Date().toISOString()
        };
    }

    getSymptomDetails(categoryId) {
        const category = this.symptomCategories[categoryId];
        if (!category) {
            throw new Error('Invalid category selected');
        }

        const symptoms = Object.entries(category.symptoms).map(([key, symptom]) => ({
            id: key,
            name: symptom.name,
            severity: symptom.severity,
            questionCount: symptom.questions.length
        }));

        return {
            success: true,
            step: 'select_symptoms',
            message: `**${category.icon} ${category.name} Symptoms**\n\nPlease select all symptoms that apply to you:`,
            symptoms: symptoms,
            category: categoryId,
            agent: this.name,
            timestamp: new Date().toISOString()
        };
    }

    processSymptomAnswers(selectedSymptoms, answers) {
        const questions = [];
        
        selectedSymptoms.forEach(symptomId => {
            // Find the symptom in all categories
            for (const category of Object.values(this.symptomCategories)) {
                if (category.symptoms[symptomId]) {
                    const symptom = category.symptoms[symptomId];
                    questions.push({
                        symptomId: symptomId,
                        symptomName: symptom.name,
                        questions: symptom.questions.map((q, index) => ({
                            id: `${symptomId}_q${index}`,
                            question: q,
                            answer: answers[`${symptomId}_q${index}`] || null
                        }))
                    });
                    break;
                }
            }
        });

        return {
            success: true,
            step: 'answer_questions',
            message: "📋 **Symptom Details**\n\nPlease answer these questions to help us better understand your condition:",
            questions: questions,
            agent: this.name,
            timestamp: new Date().toISOString()
        };
    }

    performDiseaseAnalysis(selectedSymptoms, answers, location) {
        // Analyze symptoms against disease database
        const possibleDiseases = this.matchSymptomsToDiseases(selectedSymptoms);
        const severity = this.calculateOverallSeverity(selectedSymptoms, answers);
        const urgency = this.determineUrgency(possibleDiseases, severity);
        
        // Generate recommendations based on urgency
        const recommendations = this.generateRecommendations(urgency, location, possibleDiseases);

        return {
            success: true,
            step: 'analyze',
            analysis: {
                selectedSymptoms: selectedSymptoms,
                possibleDiseases: possibleDiseases,
                severity: severity,
                urgency: urgency,
                recommendations: recommendations
            },
            message: this.generateAnalysisMessage(possibleDiseases, severity, urgency),
            agent: this.name,
            timestamp: new Date().toISOString()
        };
    }

    matchSymptomsToDiseases(selectedSymptoms) {
        const matches = [];
        
        Object.entries(this.diseaseDatabase).forEach(([diseaseId, disease]) => {
            const matchingSymptoms = disease.symptoms.filter(symptom => 
                selectedSymptoms.includes(symptom)
            );
            
            if (matchingSymptoms.length > 0) {
                const confidence = (matchingSymptoms.length / disease.symptoms.length) * 100;
                matches.push({
                    diseaseId: diseaseId,
                    name: disease.name,
                    description: disease.description,
                    severity: disease.severity,
                    urgency: disease.urgency,
                    matchingSymptoms: matchingSymptoms,
                    confidence: Math.round(confidence)
                });
            }
        });

        return matches.sort((a, b) => b.confidence - a.confidence);
    }

    calculateOverallSeverity(selectedSymptoms, answers) {
        let maxSeverity = 'low';
        
        selectedSymptoms.forEach(symptomId => {
            for (const category of Object.values(this.symptomCategories)) {
                if (category.symptoms[symptomId]) {
                    const severity = category.symptoms[symptomId].severity;
                    if (severity === 'critical') maxSeverity = 'critical';
                    else if (severity === 'high' && maxSeverity !== 'critical') maxSeverity = 'high';
                    else if (severity === 'moderate' && maxSeverity === 'low') maxSeverity = 'moderate';
                }
            }
        });

        return maxSeverity;
    }

    determineUrgency(possibleDiseases, severity) {
        if (severity === 'critical') return 'immediate';
        
        const hasCriticalDisease = possibleDiseases.some(disease => 
            disease.urgency === 'immediate'
        );
        if (hasCriticalDisease) return 'immediate';
        
        const hasUrgentDisease = possibleDiseases.some(disease => 
            disease.urgency === 'urgent'
        );
        if (hasUrgentDisease) return 'urgent';
        
        return 'appointment';
    }

    generateRecommendations(urgency, location, possibleDiseases) {
        const recommendations = [];
        
        switch (urgency) {
            case 'immediate':
                recommendations.push({
                    type: 'emergency',
                    title: '🚨 IMMEDIATE MEDICAL ATTENTION REQUIRED',
                    action: 'Call 911 or go to the nearest emergency room immediately',
                    reason: 'Your symptoms suggest a potentially life-threatening condition'
                });
                break;
                
            case 'urgent':
                recommendations.push({
                    type: 'urgent_care',
                    title: '⚠️ URGENT CARE NEEDED',
                    action: 'Visit urgent care or emergency room within 24 hours',
                    reason: 'Your symptoms require prompt medical evaluation'
                });
                break;
                
            case 'appointment':
                recommendations.push({
                    type: 'appointment',
                    title: '📅 SCHEDULE APPOINTMENT',
                    action: 'Book an appointment with your doctor within 1-2 weeks',
                    reason: 'Your symptoms should be evaluated by a healthcare professional'
                });
                break;
        }

        // Add location-based hospital recommendations
        if (location && (urgency === 'immediate' || urgency === 'urgent')) {
            recommendations.push({
                type: 'location',
                title: '🏥 NEARBY HOSPITALS',
                action: this.getNearbyHospitals(location),
                reason: 'Based on your location'
            });
        }

        return recommendations;
    }

    getNearbyHospitals(location) {
        // This would integrate with a real hospital database/API
        return [
            'City General Hospital - Emergency Department',
            'Regional Medical Center - Urgent Care',
            'Community Health Center - Walk-in Clinic'
        ];
    }

    generateAnalysisMessage(possibleDiseases, severity, urgency) {
        let message = `🔍 **Symptom Analysis Complete**\n\n`;
        
        if (possibleDiseases.length > 0) {
            message += `**Possible Conditions:**\n`;
            possibleDiseases.slice(0, 3).forEach((disease, index) => {
                message += `${index + 1}. ${disease.name} (${disease.confidence}% match)\n`;
            });
            message += `\n`;
        }
        
        message += `**Severity Level:** ${severity.toUpperCase()}\n`;
        message += `**Urgency:** ${urgency.toUpperCase()}\n\n`;
        
        switch (urgency) {
            case 'immediate':
                message += `🚨 **EMERGENCY ALERT** 🚨\n\nYour symptoms indicate a potentially serious condition that requires **immediate medical attention**.\n\n**IMMEDIATE ACTIONS:**\n• Call emergency services (911/ambulance) immediately\n• Go to the nearest emergency room\n• Do not delay seeking medical help`;
                break;
            case 'urgent':
                message += `⚠️ **URGENT MEDICAL ATTENTION NEEDED**\n\nYour symptoms suggest a condition that requires prompt medical evaluation.\n\n**RECOMMENDED ACTIONS:**\n• Contact your doctor immediately or visit urgent care\n• Schedule an appointment within 24-48 hours\n• Monitor your symptoms closely`;
                break;
            case 'appointment':
                message += `📋 **MEDICAL CONSULTATION RECOMMENDED**\n\nYour symptoms suggest a condition that should be evaluated by a healthcare professional.\n\n**RECOMMENDED ACTIONS:**\n• Schedule an appointment with your doctor within a week\n• Monitor your symptoms and note any changes\n• Keep a symptom diary`;
                break;
        }
        
        return message;
    }
}

module.exports = StructuredSymptomAgent;
