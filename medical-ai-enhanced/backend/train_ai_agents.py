#!/usr/bin/env python3
"""
AI Agent Training Script
This script provides various training methods for the medical AI agents
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

class AIAgentTrainer:
    def __init__(self, dataset_path: str):
        """Initialize the AI agent trainer"""
        self.dataset_path = dataset_path
        self.df = pd.read_csv(dataset_path)
        self.models = {}
        self.results = {}
        
        # Create models directory
        os.makedirs('models', exist_ok=True)
        os.makedirs('training_results', exist_ok=True)
    
    def prepare_data(self):
        """Prepare training data"""
        print("Preparing training data...")
        
        # Separate features and target
        X = self.df.iloc[:, :-1]  # All symptoms
        y = self.df['prognosis']  # Disease labels
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        print(f"Dataset shape: {X.shape}")
        print(f"Number of diseases: {len(np.unique(y))}")
        print(f"Number of symptoms: {X.shape[1]}")
        
        return X, y_encoded
    
    def train_symptom_classifier(self):
        """Train symptom-to-disease classifier"""
        print("\n=== Training Symptom Classifier ===")
        
        X, y = self.prepare_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train Random Forest
        print("Training Random Forest...")
        rf_model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2
        )
        rf_model.fit(X_train, y_train)
        
        # Train Gradient Boosting
        print("Training Gradient Boosting...")
        gb_model = GradientBoostingClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=6,
            learning_rate=0.1
        )
        gb_model.fit(X_train, y_train)
        
        # Evaluate models
        models = {'RandomForest': rf_model, 'GradientBoosting': gb_model}
        
        for name, model in models.items():
            # Predictions
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X, y, cv=5)
            
            print(f"\n{name} Results:")
            print(f"Accuracy: {accuracy:.3f}")
            print(f"CV Mean: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
            
            # Save results
            self.results[name] = {
                'accuracy': accuracy,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'model': model
            }
            
            # Save model
            model_path = f'models/{name.lower()}_symptom_classifier.pkl'
            joblib.dump(model, model_path)
            print(f"Model saved to {model_path}")
        
        # Save label encoder
        joblib.dump(self.label_encoder, 'models/label_encoder.pkl')
        
        return models
    
    def train_severity_classifier(self):
        """Train severity classification model"""
        print("\n=== Training Severity Classifier ===")
        
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
        severity_labels = []
        for disease in self.df['prognosis']:
            severity_labels.append(severity_mapping.get(disease, 'moderate'))
        
        # Prepare data
        X = self.df.iloc[:, :-1]
        y_severity = np.array(severity_labels)
        
        # Encode severity labels
        severity_encoder = LabelEncoder()
        y_severity_encoded = severity_encoder.fit_transform(y_severity)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_severity_encoded, test_size=0.2, random_state=42, stratify=y_severity_encoded
        )
        
        # Train model
        severity_model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        severity_model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = severity_model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Severity Classification Accuracy: {accuracy:.3f}")
        
        # Save model and encoder
        joblib.dump(severity_model, 'models/severity_classifier.pkl')
        joblib.dump(severity_encoder, 'models/severity_encoder.pkl')
        
        self.results['SeverityClassifier'] = {
            'accuracy': accuracy,
            'model': severity_model
        }
        
        return severity_model
    
    def train_emergency_detector(self):
        """Train emergency condition detector"""
        print("\n=== Training Emergency Detector ===")
        
        # Define emergency diseases
        emergency_diseases = {
            'Heart Attack', 'Stroke', 'Pneumonia', 'Tuberculosis', 
            'Hepatitis C', 'Hepatitis D', 'Hepatitis E', 'Alcoholic Hepatitis', 
            'Acute Liver Failure'
        }
        
        # Create emergency labels
        emergency_labels = []
        for disease in self.df['prognosis']:
            emergency_labels.append(1 if disease in emergency_diseases else 0)
        
        # Prepare data
        X = self.df.iloc[:, :-1]
        y_emergency = np.array(emergency_labels)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_emergency, test_size=0.2, random_state=42, stratify=y_emergency
        )
        
        # Train model
        emergency_model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=8
        )
        emergency_model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = emergency_model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Emergency Detection Accuracy: {accuracy:.3f}")
        
        # Save model
        joblib.dump(emergency_model, 'models/emergency_detector.pkl')
        
        self.results['EmergencyDetector'] = {
            'accuracy': accuracy,
            'model': emergency_model
        }
        
        return emergency_model
    
    def generate_training_report(self):
        """Generate comprehensive training report"""
        print("\n=== Training Report ===")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'dataset_info': {
                'path': self.dataset_path,
                'shape': self.df.shape,
                'diseases': self.df['prognosis'].nunique(),
                'symptoms': len(self.df.columns) - 1
            },
            'model_results': {k: {key: val for key, val in v.items() if key != 'model'} for k, v in self.results.items()},
            'recommendations': []
        }
        
        # Add recommendations based on results
        for model_name, result in self.results.items():
            if result['accuracy'] > 0.8:
                report['recommendations'].append(f"{model_name}: Excellent performance (>{result['accuracy']:.3f})")
            elif result['accuracy'] > 0.7:
                report['recommendations'].append(f"{model_name}: Good performance ({result['accuracy']:.3f})")
            else:
                report['recommendations'].append(f"{model_name}: Needs improvement ({result['accuracy']:.3f})")
        
        # Save report
        report_path = f'training_results/training_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Training report saved to {report_path}")
        
        # Print summary
        print("\nTraining Summary:")
        for model_name, result in self.results.items():
            print(f"- {model_name}: {result['accuracy']:.3f} accuracy")
        
        return report
    
    def create_feature_importance_plot(self, model, feature_names):
        """Create feature importance visualization"""
        importances = model.feature_importances_
        indices = np.argsort(importances)[::-1][:20]  # Top 20 features
        
        plt.figure(figsize=(10, 8))
        plt.title("Top 20 Most Important Symptoms")
        plt.bar(range(20), importances[indices])
        plt.xticks(range(20), [feature_names[i] for i in indices], rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig('training_results/feature_importance.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print("Feature importance plot saved to training_results/feature_importance.png")

def main():
    """Main training function"""
    print("🤖 AI Agent Training System")
    print("=" * 50)
    
    # Initialize trainer
    trainer = AIAgentTrainer('symbipredict_2022.csv')
    
    # Train all models
    symptom_models = trainer.train_symptom_classifier()
    severity_model = trainer.train_severity_classifier()
    emergency_model = trainer.train_emergency_detector()
    
    # Generate report
    report = trainer.generate_training_report()
    
    # Create feature importance plot
    best_model = max(trainer.results.items(), key=lambda x: x[1]['accuracy'])
    trainer.create_feature_importance_plot(
        best_model[1]['model'], 
        trainer.df.columns[:-1].tolist()
    )
    
    print("\n✅ Training completed successfully!")
    print("Models saved in 'models/' directory")
    print("Results saved in 'training_results/' directory")

if __name__ == "__main__":
    main()
