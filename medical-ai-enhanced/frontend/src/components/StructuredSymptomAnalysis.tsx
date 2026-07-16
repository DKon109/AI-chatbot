import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, 
  Wind, 
  Brain, 
  Utensils, 
  Bone, 
  Thermometer,
  ChevronRight,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Stethoscope
} from 'lucide-react';
import ApiService from '../services/api';
import HospitalFinder from './HospitalFinder';

interface SymptomCategory {
  id: string;
  name: string;
  icon: string;
  symptomCount: number;
}

interface Symptom {
  id: string;
  name: string;
  severity: string;
  questionCount: number;
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
}

interface QuestionGroup {
  symptomId: string;
  symptomName: string;
  questions: Question[];
}

interface AnalysisResult {
  selectedSymptoms: string[];
  possibleDiseases: any[];
  severity: string;
  urgency: string;
  recommendations: any[];
}

const StructuredSymptomAnalysis: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'categorize' | 'select_symptoms' | 'answer_questions' | 'analyze'>('categorize');
  const [categories, setCategories] = useState<SymptomCategory[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [questions, setQuestions] = useState<QuestionGroup[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showHospitalFinder, setShowHospitalFinder] = useState(false);


  const categoryIcons: Record<string, React.ReactNode> = {
    'cardiovascular': <Heart className="w-6 h-6" />,
    'respiratory': <Wind className="w-6 h-6" />,
    'neurological': <Brain className="w-6 h-6" />,
    'gastrointestinal': <Utensils className="w-6 h-6" />,
    'musculoskeletal': <Bone className="w-6 h-6" />,
    'general': <Thermometer className="w-6 h-6" />
  };

  const severityColors: Record<string, string> = {
    'low': 'text-green-600 bg-green-100',
    'moderate': 'text-yellow-600 bg-yellow-100',
    'high': 'text-orange-600 bg-orange-100',
    'critical': 'text-red-600 bg-red-100'
  };

  const urgencyIcons: Record<string, React.ReactNode> = {
    'immediate': <AlertTriangle className="w-5 h-5 text-red-500" />,
    'urgent': <Clock className="w-5 h-5 text-orange-500" />,
    'appointment': <Calendar className="w-5 h-5 text-blue-500" />
  };

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading symptom categories...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await ApiService.structuredSymptomAnalysis('categorize');
      console.log('API Response:', response);
      
      if (response.success) {
        setCategories(response.categories);
        console.log('Categories loaded:', response.categories);
      } else {
        console.error('API returned success: false', response);
        setError('Failed to load symptom categories: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('API call failed:', error);
      setError('Failed to load symptom categories: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsLoading(true);
    try {
      const response = await ApiService.structuredSymptomAnalysis('select_symptoms', {
        category: categoryId
      });
      if (response.success) {
        setSymptoms(response.symptoms);
        setCurrentStep('select_symptoms');
      }
    } catch (error) {
      setError('Failed to load symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymptomSelect = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom');
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.structuredSymptomAnalysis('answer_questions', {
        selectedSymptoms: selectedSymptoms
      });
      if (response.success) {
        setQuestions(response.questions);
        setCurrentStep('answer_questions');
      }
    } catch (error) {
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.structuredSymptomAnalysis('analyze', {
        selectedSymptoms: selectedSymptoms,
        answers: answers,
        location: location
      });
      if (response.success) {
        setAnalysis(response.analysis);
        setCurrentStep('analyze');
      }
    } catch (error) {
      setError('Failed to analyze symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategories = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🏥 Medical Symptom Checker</h2>
        <p className="text-gray-600">Please select the category that best describes your main concern:</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{category.icon}</span>
              <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
            </div>
            <p className="text-sm text-gray-600">{category.symptomCount} symptoms available</p>
            <ChevronRight className="w-5 h-5 text-gray-400 float-right" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderSymptoms = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {categoryIcons[selectedCategory]} {categories.find(c => c.id === selectedCategory)?.name} Symptoms
        </h2>
        <p className="text-gray-600">Please select all symptoms that apply to you:</p>
      </div>
      
      <div className="space-y-3">
        {symptoms.map((symptom) => (
          <label key={symptom.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSymptoms.includes(symptom.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSymptoms(prev => [...prev, symptom.id]);
                } else {
                  setSelectedSymptoms(prev => prev.filter(id => id !== symptom.id));
                }
              }}
              className="w-5 h-5 text-blue-600"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{symptom.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[symptom.severity]}`}>
                  {symptom.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600">{symptom.questionCount} follow-up questions</p>
            </div>
          </label>
        ))}
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep('categorize')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Back to Categories
        </button>
        <button
          onClick={handleSymptomSelect}
          disabled={selectedSymptoms.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Symptom Details</h2>
        <p className="text-gray-600">Please answer these questions to help us better understand your condition:</p>
      </div>
      
      {questions.map((questionGroup, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{questionGroup.symptomName}</h3>
          <div className="space-y-4">
            {questionGroup.questions.map((question) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question.question}
                </label>
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Please describe your experience..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Your Location (for hospital recommendations)
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, State or ZIP code"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep('select_symptoms')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Back to Symptoms
        </button>
        <button
          onClick={handleAnalyze}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Analyze Symptoms →
        </button>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔍 Analysis Complete</h2>
      </div>
      
      {analysis && (
        <>
          {/* Possible Conditions */}
          {analysis.possibleDiseases.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Possible Conditions</h3>
              <div className="space-y-3">
                {analysis.possibleDiseases.slice(0, 3).map((disease, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">{disease.name}</span>
                      <p className="text-sm text-gray-600">{disease.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {disease.confidence}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Severity & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Severity Level</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${severityColors[analysis.severity]}`}>
                {analysis.severity.toUpperCase()}
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Urgency</h3>
              <div className="flex items-center space-x-2">
                {urgencyIcons[analysis.urgency]}
                <span className="font-medium text-gray-800">{analysis.urgency.toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
            <div className="space-y-4">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  rec.type === 'emergency' ? 'bg-red-50 border border-red-200' :
                  rec.type === 'urgent_care' ? 'bg-orange-50 border border-orange-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    {rec.type === 'emergency' ? <AlertTriangle className="w-5 h-5 text-red-500 mt-1" /> :
                     rec.type === 'urgent_care' ? <Clock className="w-5 h-5 text-orange-500 mt-1" /> :
                     <Calendar className="w-5 h-5 text-blue-500 mt-1" />}
                    <div>
                      <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                      <p className="text-gray-700 mt-1">{rec.action}</p>
                      <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setCurrentStep('categorize');
                setSelectedCategory('');
                setSelectedSymptoms([]);
                setAnswers({});
                setAnalysis(null);
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Start New Analysis
            </button>
            {analysis.urgency === 'immediate' && (
              <button
                onClick={() => window.open('tel:911')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call 911</span>
              </button>
            )}
            
            {/* Hospital Finder Button */}
            <button
              onClick={() => setShowHospitalFinder(!showHospitalFinder)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Stethoscope className="w-4 h-4" />
              <span>{showHospitalFinder ? 'Hide' : 'Find'} Specialized Hospitals</span>
            </button>
          </div>
          
          {/* Hospital Finder */}
          {showHospitalFinder && (
            <div className="mt-6 border-t pt-6">
              <HospitalFinder 
                symptoms={analysis.selectedSymptoms}
                onLocationUpdate={(lat, lng) => {
                  console.log('Location updated for hospital search:', lat, lng);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => {
            setError('');
            setCurrentStep('categorize');
            loadCategories();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {currentStep === 'categorize' && renderCategories()}
      {currentStep === 'select_symptoms' && renderSymptoms()}
      {currentStep === 'answer_questions' && renderQuestions()}
      {currentStep === 'analyze' && renderAnalysis()}
    </div>
  );
};

export default StructuredSymptomAnalysis;
