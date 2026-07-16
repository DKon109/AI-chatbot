#!/usr/bin/env python3
"""
Enhanced Symptom Analyzer with Machine Learning Training
This script provides both rule-based and ML-based symptom analysis
"""

import pandas as pd
import numpy as np
import json
import re
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

class EnhancedSymptomAnalyzer:
    def __init__(self, dataset_path: str, model_path: str = None):
        """Initialize the enhanced symptom analyzer"""
        self.df = pd.read_csv(dataset_path)
        self.symptoms = self.df.columns[:-1].tolist()
        self.diseases = self.df['prognosis'].unique().tolist()
        
        # Create mappings
        self.symptom_disease_map = self._create_symptom_disease_mapping()
        self.severity_levels = self._define_severity_levels()
        self.emergency_symptoms = self._define_emergency_symptoms()
        
        # ML Model
        self.model = None
        self.model_path = model_path or 'models/symptom_classifier.pkl'
        self.load_or_train_model()
    
    def load_or_train_model(self):
        """Load existing model or train new one"""
        if os.path.exists(self.model_path):
            print(f"Loading existing model from {self.model_path}")
            self.model = joblib.load(self.model_path)
        else:
            print("Training new ML model...")
            self.train_ml_model()
    
    def train_ml_model(self):
        """Train machine learning model on the dataset"""
        # Prepare data
        X = self.df.iloc[:, :-1].values  # Symptoms (features)
        y = self.df['prognosis'].values  # Diseases (target)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train Random Forest model
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10,
            min_samples_split=5
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model accuracy: {accuracy:.3f}")
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print(f"Model saved to {self.model_path}")
    
    def predict_with_ml(self, symptoms_vector):
        """Predict disease using ML model"""
        if self.model is None:
            return None
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba([symptoms_vector])[0]
        disease_probs = list(zip(self.diseases, probabilities))
        
        # Sort by probability
        disease_probs.sort(key=lambda x: x[1], reverse=True)
        
        return {
            'predicted_disease': disease_probs[0][0],
            'confidence': disease_probs[0][1],
            'top_diseases': disease_probs[:5]
        }
    
    def analyze_symptoms_enhanced(self, user_text: str, use_ml: bool = True):
        """Enhanced symptom analysis using both rule-based and ML approaches"""
        # Extract symptoms using rule-based approach
        symptoms = self.extract_symptoms_from_text(user_text)
        
        if not symptoms:
            return {
                'severity': 'unknown',
                'recommendation': 'general',
                'message': 'I couldn\'t identify specific symptoms. Please describe your symptoms more clearly.',
                'suggested_diseases': [],
                'emergency': False,
                'confidence': 0,
                'method': 'rule_based'
            }
        
        # Create symptom vector for ML prediction
        symptom_vector = [1 if symptom in symptoms else 0 for symptom in self.symptoms]
        
        # Get ML prediction if requested
        ml_prediction = None
        if use_ml and self.model:
            ml_prediction = self.predict_with_ml(symptom_vector)
        
        # Rule-based analysis
        rule_analysis = self._rule_based_analysis(symptoms)
        
        # Combine results
        if ml_prediction and ml_prediction['confidence'] > 0.7:
            # Use ML prediction if confidence is high
            return {
                **rule_analysis,
                'predicted_disease': ml_prediction['predicted_disease'],
                'ml_confidence': ml_prediction['confidence'],
                'top_diseases': ml_prediction['top_diseases'],
                'method': 'ml_enhanced'
            }
        else:
            # Use rule-based analysis
            return {
                **rule_analysis,
                'method': 'rule_based'
            }
    
    def _rule_based_analysis(self, symptoms):
        """Rule-based symptom analysis"""
        # Check for emergency conditions
        is_emergency = any(symptom in self.emergency_symptoms for symptom in symptoms)
        
        if is_emergency:
            return {
                'severity': 'critical',
                'emergency': True,
                'recommendation': {
                    'action': 'emergency',
                    'message': '🚨 **EMERGENCY ALERT** 🚨\n\nYour symptoms indicate a potentially serious condition that requires **immediate medical attention**.',
                    'urgency': 'immediate'
                },
                'confidence': 0.9,
                'symptoms_found': symptoms,
                'possible_diseases': self._find_possible_diseases(symptoms)
            }
        
        # Determine severity based on symptoms
        severity = self._determine_severity(symptoms)
        
        return {
            'severity': severity,
            'emergency': False,
            'recommendation': self._generate_recommendation(severity),
            'confidence': 0.6,
            'symptoms_found': symptoms,
            'possible_diseases': self._find_possible_diseases(symptoms)
        }
    
    def _create_symptom_disease_mapping(self):
        """Create symptom-to-disease mapping from dataset"""
        mapping = {}
        for symptom in self.symptoms:
            diseases_with_symptom = self.df[self.df[symptom] == 1]['prognosis'].unique().tolist()
            mapping[symptom] = diseases_with_symptom
        return mapping
    
    def _define_severity_levels(self):
        """Define severity levels for different diseases"""
        return {
            'Heart Attack': 'critical',
            'Stroke': 'critical',
            'Pneumonia': 'high',
            'Tuberculosis': 'high',
            'Hepatitis C': 'high',
            'Hepatitis D': 'high',
            'Hepatitis E': 'high',
            'Alcoholic Hepatitis': 'high',
            'Acute Liver Failure': 'critical',
            'Common Cold': 'low',
            'Fungal Infection': 'low',
            'Dimorphic Hemmorhoids (piles)': 'moderate',
            'Varicose Veins': 'moderate',
            'Hypoglycemia': 'moderate'
        }
    
    def _define_emergency_symptoms(self):
        """Define emergency symptoms"""
        return {
            'chest_pain', 'breathlessness', 'high_fever', 'coma', 'stomach_bleeding',
            'blood_in_sputum', 'heart_attack', 'stroke', 'severe_headache',
            'loss_of_consciousness', 'severe_abdominal_pain', 'difficulty_breathing'
        }
    
    def extract_symptoms_from_text(self, text: str) -> List[str]:
        """Extract symptoms from user's text input"""
        text_lower = text.lower()
        found_symptoms = []
        
        # Enhanced symptom mappings
        symptom_mappings = {
            # Pain-related
            'pain': ['joint_pain', 'stomach_pain', 'chest_pain', 'back_pain', 'headache'],
            'ache': ['joint_pain', 'stomach_pain', 'back_pain', 'headache'],
            'hurt': ['joint_pain', 'stomach_pain', 'chest_pain', 'back_pain'],
            'sore': ['joint_pain', 'muscle_pain'],
            
            # Fever-related
            'fever': ['high_fever', 'mild_fever'],
            'temperature': ['high_fever', 'mild_fever'],
            'hot': ['high_fever', 'mild_fever'],
            'burning': ['high_fever', 'burning_micturition'],
            
            # Respiratory
            'cough': ['cough'],
            'coughing': ['cough'],
            'breath': ['breathlessness'],
            'breathing': ['breathlessness'],
            'shortness of breath': ['breathlessness'],
            'can\'t breathe': ['breathlessness'],
            'difficulty breathing': ['breathlessness'],
            
            # Digestive
            'nausea': ['nausea'],
            'vomit': ['vomiting'],
            'diarrhea': ['diarrhoea'],
            'constipation': ['constipation'],
            'stomach': ['stomach_pain', 'abdominal_pain'],
            'belly': ['stomach_pain', 'abdominal_pain'],
            
            # Skin
            'rash': ['skin_rash'],
            'itching': ['itching'],
            'skin': ['skin_rash', 'itching'],
            
            # Fatigue
            'tired': ['fatigue'],
            'exhausted': ['fatigue'],
            'weak': ['fatigue', 'muscle_weakness'],
            'lethargy': ['lethargy'],
            
            # Head
            'headache': ['headache'],
            'head pain': ['headache'],
            'migraine': ['headache'],
            
            # Heart
            'heart': ['chest_pain', 'fast_heart_rate'],
            'palpitations': ['palpitations'],
            'chest': ['chest_pain']
        }
        
        # Find symptoms in text
        for keyword, symptoms in symptom_mappings.items():
            if keyword in text_lower:
                found_symptoms.extend(symptoms)
        
        # Direct symptom matching
        for symptom in self.symptoms:
            if symptom.replace('_', ' ') in text_lower:
                found_symptoms.append(symptom)
        
        return list(set(found_symptoms))  # Remove duplicates
    
    def _find_possible_diseases(self, symptoms: List[str]) -> List[Dict]:
        """Find possible diseases based on symptoms"""
        disease_scores = {}
        
        for symptom in symptoms:
            if symptom in self.symptom_disease_map:
                for disease in self.symptom_disease_map[symptom]:
                    disease_scores[disease] = disease_scores.get(disease, 0) + 1
        
        # Sort by score
        sorted_diseases = sorted(disease_scores.items(), key=lambda x: x[1], reverse=True)
        
        return [{'disease': disease, 'score': score} for disease, score in sorted_diseases[:5]]
    
    def _determine_severity(self, symptoms: List[str]) -> str:
        """Determine severity based on symptoms"""
        if any(symptom in self.emergency_symptoms for symptom in symptoms):
            return 'critical'
        
        # Count symptom severity indicators
        high_severity_count = sum(1 for symptom in symptoms if 'severe' in symptom or 'high' in symptom)
        
        if high_severity_count > 0:
            return 'high'
        elif len(symptoms) > 3:
            return 'moderate'
        else:
            return 'low'
    
    def _generate_recommendation(self, severity: str) -> Dict:
        """Generate recommendation based on severity"""
        recommendations = {
            'critical': {
                'action': 'emergency',
                'message': '🚨 **EMERGENCY ALERT** 🚨\n\nYour symptoms indicate a potentially serious condition that requires **immediate medical attention**.',
                'urgency': 'immediate'
            },
            'high': {
                'action': 'schedule_appointment',
                'message': '📋 **MEDICAL CONSULTATION RECOMMENDED**\n\nYour symptoms suggest a condition that should be evaluated by a healthcare professional.',
                'urgency': 'moderate'
            },
            'moderate': {
                'action': 'schedule_appointment',
                'message': '📋 **MEDICAL CONSULTATION RECOMMENDED**\n\nYour symptoms suggest a condition that should be evaluated by a healthcare professional.',
                'urgency': 'moderate'
            },
            'low': {
                'action': 'self_care',
                'message': '💚 **SELF-CARE APPROPRIATE**\n\nYour symptoms appear to be mild and may be managed with self-care measures.',
                'urgency': 'low'
            }
        }
        
        return recommendations.get(severity, recommendations['low'])

if __name__ == "__main__":
    # Test the enhanced analyzer
    analyzer = EnhancedSymptomAnalyzer('symbipredict_2022.csv')
    
    # Test cases
    test_cases = [
        "I have chest pain and shortness of breath",
        "I have a mild headache",
        "I feel tired and have a slight fever",
        "I have severe abdominal pain and vomiting"
    ]
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case}")
        result = analyzer.analyze_symptoms_enhanced(test_case)
        print(f"Severity: {result['severity']}")
        print(f"Emergency: {result['emergency']}")
        print(f"Method: {result['method']}")
        if 'predicted_disease' in result:
            print(f"Predicted Disease: {result['predicted_disease']}")
            print(f"ML Confidence: {result['ml_confidence']:.3f}")
