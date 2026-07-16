#!/usr/bin/env python3
"""
Continuous Learning System for AI Agents
This system collects user feedback and continuously improves the AI models
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

class ContinuousLearningSystem:
    def __init__(self, feedback_db_path: str = 'feedback/feedback_data.json'):
        """Initialize continuous learning system"""
        self.feedback_db_path = feedback_db_path
        self.feedback_data = []
        self.models_path = 'models/'
        self.retrain_threshold = 100  # Retrain after 100 new feedbacks
        self.min_confidence_threshold = 0.7
        
        # Create directories
        os.makedirs('feedback', exist_ok=True)
        os.makedirs('models', exist_ok=True)
        os.makedirs('continuous_learning', exist_ok=True)
        
        # Load existing feedback
        self.load_feedback_data()
    
    def load_feedback_data(self):
        """Load existing feedback data"""
        if os.path.exists(self.feedback_db_path):
            with open(self.feedback_db_path, 'r') as f:
                self.feedback_data = json.load(f)
        else:
            self.feedback_data = []
    
    def save_feedback_data(self):
        """Save feedback data to file"""
        with open(self.feedback_db_path, 'w') as f:
            json.dump(self.feedback_data, f, indent=2)
    
    def collect_feedback(self, 
                       user_input: str, 
                       ai_response: str, 
                       user_rating: int, 
                       doctor_correction: Optional[str] = None,
                       user_id: Optional[str] = None,
                       session_id: Optional[str] = None):
        """Collect user feedback for model improvement"""
        
        feedback = {
            'id': len(self.feedback_data) + 1,
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'ai_response': ai_response,
            'user_rating': user_rating,  # 1-5 stars
            'doctor_correction': doctor_correction,
            'user_id': user_id,
            'session_id': session_id,
            'feedback_type': 'user_rating',
            'processed': False
        }
        
        self.feedback_data.append(feedback)
        self.save_feedback_data()
        
        print(f"Feedback collected: Rating {user_rating}/5")
        
        # Check if retraining is needed
        if len(self.feedback_data) % self.retrain_threshold == 0:
            self.trigger_retraining()
    
    def collect_doctor_feedback(self, 
                               user_input: str, 
                               ai_response: str, 
                               correct_diagnosis: str,
                               correct_severity: str,
                               doctor_id: str):
        """Collect doctor corrections for high-quality training data"""
        
        feedback = {
            'id': len(self.feedback_data) + 1,
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'ai_response': ai_response,
            'correct_diagnosis': correct_diagnosis,
            'correct_severity': correct_severity,
            'doctor_id': doctor_id,
            'feedback_type': 'doctor_correction',
            'processed': False
        }
        
        self.feedback_data.append(feedback)
        self.save_feedback_data()
        
        print(f"Doctor feedback collected from Dr. {doctor_id}")
        
        # Trigger immediate retraining for doctor feedback
        self.trigger_retraining()
    
    def analyze_feedback_trends(self):
        """Analyze feedback trends to identify improvement areas"""
        if not self.feedback_data:
            return {}
        
        df = pd.DataFrame(self.feedback_data)
        
        # Calculate average ratings over time
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        daily_ratings = df.groupby('date')['user_rating'].mean()
        
        # Identify low-rated responses
        low_rated = df[df['user_rating'] <= 2]
        
        # Common patterns in low-rated responses
        common_patterns = {}
        if len(low_rated) > 0:
            # Analyze user input patterns
            common_patterns['low_rated_inputs'] = low_rated['user_input'].value_counts().head(10).to_dict()
            common_patterns['low_rated_responses'] = low_rated['ai_response'].value_counts().head(10).to_dict()
        
        analysis = {
            'total_feedback': len(self.feedback_data),
            'average_rating': df['user_rating'].mean(),
            'rating_trend': daily_ratings.to_dict(),
            'low_rated_count': len(low_rated),
            'common_patterns': common_patterns,
            'doctor_corrections': len(df[df['feedback_type'] == 'doctor_correction'])
        }
        
        return analysis
    
    def trigger_retraining(self):
        """Trigger model retraining with new feedback data"""
        print("🔄 Triggering model retraining...")
        
        # Analyze feedback
        analysis = self.analyze_feedback_trends()
        
        # Prepare training data from feedback
        training_data = self.prepare_feedback_training_data()
        
        if len(training_data) < 50:  # Need minimum data for retraining
            print("Insufficient feedback data for retraining")
            return
        
        # Retrain models
        self.retrain_models(training_data)
        
        # Update feedback as processed
        self.mark_feedback_processed()
        
        # Save retraining results
        self.save_retraining_results(analysis)
    
    def prepare_feedback_training_data(self):
        """Prepare training data from feedback"""
        training_data = []
        
        for feedback in self.feedback_data:
            if feedback['processed']:
                continue
            
            if feedback['feedback_type'] == 'doctor_correction':
                # High-quality training data from doctor corrections
                training_data.append({
                    'input': feedback['user_input'],
                    'correct_diagnosis': feedback['correct_diagnosis'],
                    'correct_severity': feedback['correct_severity'],
                    'quality': 'high',
                    'source': 'doctor'
                })
            
            elif feedback['user_rating'] >= 4:
                # Positive feedback - AI response was good
                training_data.append({
                    'input': feedback['user_input'],
                    'ai_response': feedback['ai_response'],
                    'quality': 'positive',
                    'source': 'user'
                })
            
            elif feedback['user_rating'] <= 2:
                # Negative feedback - need improvement
                training_data.append({
                    'input': feedback['user_input'],
                    'ai_response': feedback['ai_response'],
                    'quality': 'negative',
                    'source': 'user'
                })
        
        return training_data
    
    def retrain_models(self, training_data):
        """Retrain models with feedback data"""
        print("Training models with feedback data...")
        
        # Load original dataset
        original_df = pd.read_csv('symbipredict_2022.csv')
        
        # Create enhanced dataset with feedback
        enhanced_data = self.create_enhanced_dataset(original_df, training_data)
        
        # Retrain symptom classifier
        self.retrain_symptom_classifier(enhanced_data)
        
        # Retrain severity classifier
        self.retrain_severity_classifier(enhanced_data)
        
        print("✅ Models retrained successfully")
    
    def create_enhanced_dataset(self, original_df, training_data):
        """Create enhanced dataset with feedback data"""
        # For now, return original dataset
        # In a real implementation, you would incorporate feedback data
        # by creating synthetic samples or adjusting weights
        return original_df
    
    def retrain_symptom_classifier(self, dataset):
        """Retrain symptom classifier"""
        X = dataset.iloc[:, :-1]
        y = dataset['prognosis']
        
        # Load label encoder
        label_encoder = joblib.load(f'{self.models_path}label_encoder.pkl')
        y_encoded = label_encoder.transform(y)
        
        # Train new model
        model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=15
        )
        model.fit(X, y_encoded)
        
        # Save updated model
        joblib.dump(model, f'{self.models_path}randomforest_symptom_classifier.pkl')
    
    def retrain_severity_classifier(self, dataset):
        """Retrain severity classifier"""
        # Define severity mapping
        severity_mapping = {
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
        
        # Create severity labels
        severity_labels = [severity_mapping.get(disease, 'moderate') for disease in dataset['prognosis']]
        
        X = dataset.iloc[:, :-1]
        y_severity = np.array(severity_labels)
        
        # Load severity encoder
        severity_encoder = joblib.load(f'{self.models_path}severity_encoder.pkl')
        y_severity_encoded = severity_encoder.transform(y_severity)
        
        # Train new model
        model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        model.fit(X, y_severity_encoded)
        
        # Save updated model
        joblib.dump(model, f'{self.models_path}severity_classifier.pkl')
    
    def mark_feedback_processed(self):
        """Mark feedback as processed"""
        for feedback in self.feedback_data:
            if not feedback['processed']:
                feedback['processed'] = True
        
        self.save_feedback_data()
    
    def save_retraining_results(self, analysis):
        """Save retraining results"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'feedback_analysis': analysis,
            'models_updated': ['symptom_classifier', 'severity_classifier'],
            'retraining_trigger': 'feedback_threshold_reached'
        }
        
        results_path = f'continuous_learning/retraining_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"Retraining results saved to {results_path}")
    
    def get_model_performance_metrics(self):
        """Get current model performance metrics"""
        if not self.feedback_data:
            return {}
        
        df = pd.DataFrame(self.feedback_data)
        
        metrics = {
            'total_feedback': len(self.feedback_data),
            'average_rating': df['user_rating'].mean(),
            'positive_feedback_rate': len(df[df['user_rating'] >= 4]) / len(df),
            'negative_feedback_rate': len(df[df['user_rating'] <= 2]) / len(df),
            'doctor_corrections': len(df[df['feedback_type'] == 'doctor_correction']),
            'last_retraining': self.get_last_retraining_date()
        }
        
        return metrics
    
    def get_last_retraining_date(self):
        """Get the date of last retraining"""
        retraining_files = [f for f in os.listdir('continuous_learning') if f.startswith('retraining_')]
        if retraining_files:
            latest_file = max(retraining_files)
            return latest_file.replace('retraining_', '').replace('.json', '')
        return None

def main():
    """Test the continuous learning system"""
    print("🔄 Continuous Learning System Test")
    print("=" * 40)
    
    # Initialize system
    cls = ContinuousLearningSystem()
    
    # Simulate feedback collection
    print("Collecting sample feedback...")
    
    # User feedback
    cls.collect_feedback(
        user_input="I have chest pain and shortness of breath",
        ai_response="🚨 EMERGENCY ALERT - Call 911 immediately",
        user_rating=5,
        user_id="user123"
    )
    
    cls.collect_feedback(
        user_input="I have a mild headache",
        ai_response="Take rest and monitor symptoms",
        user_rating=4,
        user_id="user456"
    )
    
    cls.collect_feedback(
        user_input="I feel tired",
        ai_response="You have a serious condition, go to ER",
        user_rating=1,  # Wrong diagnosis
        user_id="user789"
    )
    
    # Doctor feedback
    cls.collect_doctor_feedback(
        user_input="I feel tired",
        ai_response="You have a serious condition, go to ER",
        correct_diagnosis="Fatigue",
        correct_severity="low",
        doctor_id="dr_smith"
    )
    
    # Analyze feedback
    analysis = cls.analyze_feedback_trends()
    print(f"\nFeedback Analysis:")
    print(f"Total feedback: {analysis['total_feedback']}")
    print(f"Average rating: {analysis['average_rating']:.2f}")
    print(f"Low-rated responses: {analysis['low_rated_count']}")
    
    # Get performance metrics
    metrics = cls.get_model_performance_metrics()
    print(f"\nPerformance Metrics:")
    for key, value in metrics.items():
        print(f"- {key}: {value}")

if __name__ == "__main__":
    main()
