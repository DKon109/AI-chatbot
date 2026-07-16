import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, Camera, Star, Stethoscope, FileText, Heart, Bell, Pill, Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import StructuredSymptomAnalysis from './StructuredSymptomAnalysis';
import GoogleMapsPharmacyFinder from './GoogleMapsPharmacyFinder';
import './DashboardTheme.css';

const PatientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'symptom-checker' | 'food-analysis' | 'exercises' | 'reports' | 'motivation' | 'prescriptions'>('symptom-checker');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [foodDescription, setFoodDescription] = useState('');
  const [foodAnalysisResult, setFoodAnalysisResult] = useState('');
  const [foodAnalysisError, setFoodAnalysisError] = useState('');
  const [isAnalyzingFood, setIsAnalyzingFood] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
      return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setFoodAnalysisResult('');
    setFoodAnalysisError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeSelectedFood = async () => {
    if (!selectedImage) return;
    if (foodDescription.trim().length < 3) {
      setFoodAnalysisError('Please describe the main ingredients or dish before analyzing.');
      return;
    }

    setIsAnalyzingFood(true);
    setFoodAnalysisError('');
    setFoodAnalysisResult('');
    try {
      const response = await ApiService.analyzeFoodImage(selectedImage, foodDescription.trim());
      if (response.success) {
        setFoodAnalysisResult(response.data.aiMessage.message);
      } else {
        setFoodAnalysisError('The meal could not be analyzed. Please revise the description and try again.');
      }
    } catch (error) {
      console.error('Food analysis failed:', error);
      setFoodAnalysisError('Food analysis is temporarily unavailable. Please try again.');
    } finally {
      setIsAnalyzingFood(false);
    }
  };

  const handleLogout = () => {
      logout();
      navigate('/');
  };

  return (
    <div className="compass-dashboard patient-compass" style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header className="compass-header" style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="compass-secondary-button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <Home size={16} />
            Home
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
            Patient Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Welcome, {user?.name || 'Patient'}
          </span>
          <button
            className="compass-logout-button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="compass-sidebar" style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          <button
            className={`compass-nav-item ${activeTab === 'symptom-checker' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('symptom-checker')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'symptom-checker' ? '#3b82f6' : 'transparent',
              color: activeTab === 'symptom-checker' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderBottom: activeTab === 'symptom-checker' ? '2px solid #3b82f6' : '2px solid transparent',
              whiteSpace: 'nowrap'
            }}
          >
            <Stethoscope size={16} />
            Symptom Checker
          </button>
          <button
            className={`compass-nav-item ${activeTab === 'food-analysis' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('food-analysis')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'food-analysis' ? '#3b82f6' : 'transparent',
              color: activeTab === 'food-analysis' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderBottom: activeTab === 'food-analysis' ? '2px solid #3b82f6' : '2px solid transparent',
              whiteSpace: 'nowrap'
            }}
          >
            <Camera size={16} />
            Food Analysis
          </button>
          <button
            className={`compass-nav-item ${activeTab === 'exercises' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('exercises')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'exercises' ? '#3b82f6' : 'transparent',
              color: activeTab === 'exercises' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderBottom: activeTab === 'exercises' ? '2px solid #3b82f6' : '2px solid transparent',
              whiteSpace: 'nowrap'
            }}
          >
            <Activity size={16} />
            Exercises
          </button>
          <button
            className={`compass-nav-item ${activeTab === 'reports' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'reports' ? '#3b82f6' : 'transparent',
              color: activeTab === 'reports' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderBottom: activeTab === 'reports' ? '2px solid #3b82f6' : '2px solid transparent',
              whiteSpace: 'nowrap'
            }}
          >
            <FileText size={16} />
            Reports
          </button>
          <button
            className={`compass-nav-item ${activeTab === 'motivation' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('motivation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'motivation' ? '#3b82f6' : 'transparent',
              color: activeTab === 'motivation' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderBottom: activeTab === 'motivation' ? '2px solid #3b82f6' : '2px solid transparent',
              whiteSpace: 'nowrap'
            }}
          >
            <Bell size={16} />
            Motivation
          </button>
          <button
            className={`compass-nav-item ${activeTab === 'prescriptions' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'prescriptions' ? '#3b82f6' : 'transparent',
              color: activeTab === 'prescriptions' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderBottom: activeTab === 'prescriptions' ? '2px solid #3b82f6' : '2px solid transparent',
              whiteSpace: 'nowrap'
            }}
          >
            <Heart size={16} />
            Prescriptions
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="compass-workspace" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        padding: '1rem'
      }}>
        {/* Content based on active tab */}
        {activeTab === 'symptom-checker' && <StructuredSymptomAnalysis />}
        
        {activeTab === 'food-analysis' && (
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '1rem',
            padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: '500px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Camera size={48} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                Food Analysis
              </h2>
              <p style={{ margin: 0, color: '#64748b' }}>
                Add a photo and describe the ingredients for a transparent, rule-based nutrition estimate
              </p>
            </div>
            
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => fileInputRef.current?.click()}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.backgroundColor = '#f0f9ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
            >
              <Camera size={32} style={{ color: '#64748b', marginBottom: '1rem' }} />
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '500', color: '#374151' }}>
                Click to upload food photo
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Supports JPG, PNG, GIF up to 10MB
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            
            {imagePreview && (
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '0.75rem',
                border: '1px solid #bae6fd'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Image Preview</h3>
                <img 
                  src={imagePreview} 
                  alt="Food preview" 
                style={{
                    width: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'cover', 
                    borderRadius: '0.5rem',
                  marginBottom: '1rem'
                  }} 
                />
                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                  <label htmlFor="food-description" style={{ display: 'block', marginBottom: '0.5rem', color: '#001e2b', fontWeight: 650 }}>
                    What is in this meal?
                  </label>
                  <textarea
                    id="food-description"
                    value={foodDescription}
                    onChange={(event) => setFoodDescription(event.target.value)}
                    placeholder="Example: grilled chicken, broccoli, brown rice and tomato salad"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #889397',
                      borderRadius: '0.375rem',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                  <p style={{ margin: '0.4rem 0 0', color: '#64748b', fontSize: '0.78rem' }}>
                    The free demo estimates nutrition from this description; it does not use image-recognition AI.
                  </p>
                </div>
                {foodAnalysisError && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid #fecaca', borderRadius: '0.375rem', background: '#fef2f2', color: '#b91c1c' }}>
                    {foodAnalysisError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={analyzeSelectedFood}
                    disabled={isAnalyzingFood}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: isAnalyzingFood ? 'not-allowed' : 'pointer',
                      opacity: isAnalyzingFood ? 0.65 : 1,
                      fontWeight: '500'
                    }}
                  >
                    {isAnalyzingFood ? 'Analyzing meal...' : 'Analyze Meal'}
                  </button>
                  <button
                    onClick={removeImage}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Remove
                  </button>
                </div>
                {foodAnalysisResult && (
                  <div style={{ marginTop: '1rem', padding: '1.25rem', border: '1px solid #b7dfd1', borderRadius: '0.5rem', background: '#f2faf7', textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 0.75rem', color: '#00684a' }}>Nutrition guidance</h3>
                    <div style={{ color: '#33474f', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                      {foodAnalysisResult.replace(/\*\*/g, '')}
                    </div>
                    <p style={{ margin: '0.9rem 0 0', color: '#64748b', fontSize: '0.78rem' }}>
                      Educational estimate only. It is not a diagnosis or a substitute for dietary advice from a clinician.
                    </p>
                  </div>
                )}
              </div>
                    )}
                  </div>
        )}
        
        {activeTab === 'exercises' && (
                  <div style={{
            flex: 1,
            backgroundColor: 'white',
                    borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: '500px',
            textAlign: 'center'
          }}>
            <Activity size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
              Exercise Recommendations
            </h2>
            <p style={{ margin: '0 0 2rem 0', color: '#64748b' }}>
              Your doctor will add personalized exercise recommendations here based on your health condition.
            </p>
                    <div style={{
              padding: '2rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic' }}>
                No exercise recommendations available yet. Please check back after your doctor adds them.
              </p>
                </div>
              </div>
        )}
        
        {activeTab === 'reports' && (
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: '500px',
            textAlign: 'center'
          }}>
            <TrendingUp size={48} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
              Weekly Health Reports
            </h2>
            <p style={{ margin: '0 0 2rem 0', color: '#64748b' }}>
              View your weekly health progress reports and insights.
            </p>
            <div style={{
              padding: '2rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic' }}>
                No reports available yet. Reports will be generated weekly based on your health data.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'motivation' && (
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: '500px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Bell size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                Motivation & Reminders
              </h2>
              <p style={{ margin: 0, color: '#64748b' }}>
                Stay motivated with personalized reminders and encouragement
              </p>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#fef3c7',
                borderRadius: '0.75rem',
                border: '1px solid #fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <Pill size={24} style={{ color: '#d97706' }} />
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#92400e' }}>
                    Medication Reminder
                  </h3>
                  <p style={{ margin: 0, color: '#a16207', fontSize: '0.9rem' }}>
                    Take your Metformin 500mg - Next dose in 2 hours
                  </p>
                </div>
              </div>
              
                <div style={{
                padding: '1.5rem',
                backgroundColor: '#dbeafe',
                borderRadius: '0.75rem',
                border: '1px solid #60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                gap: '1rem'
              }}>
                <Activity size={24} style={{ color: '#2563eb' }} />
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#1e40af' }}>
                    Exercise Reminder
                  </h3>
                  <p style={{ margin: 0, color: '#1d4ed8', fontSize: '0.9rem' }}>
                    Time for your 30-minute walk! You're doing great! 💪
                  </p>
                </div>
              </div>
              
                <div style={{
                padding: '1.5rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.75rem',
                border: '1px solid #4ade80',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <Star size={24} style={{ color: '#16a34a' }} />
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#166534' }}>
                    Achievement Unlocked!
                  </h3>
                  <p style={{ margin: 0, color: '#15803d', fontSize: '0.9rem' }}>
                    You've completed 7 days of medication adherence! 🎉
                  </p>
                </div>
                </div>
              </div>
            </div>
          )}
          
        {activeTab === 'prescriptions' && (
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: '500px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Heart size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                Find Nearby Pharmacies
              </h2>
              <p style={{ margin: 0, color: '#64748b' }}>
                Interactive map with real pharmacy locations, hours, and directions
              </p>
          </div>
            
            {/* Google Maps Integration */}
            <GoogleMapsPharmacyFinder />
            
            {/* API Key Notice */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.75rem',
              border: '1px solid #fbbf24',
              marginTop: '2rem'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#92400e' }}>
                🔑 API Key Required
              </h3>
              <p style={{ margin: '0 0 1rem 0', color: '#a16207', fontSize: '0.9rem' }}>
                To use this feature, you need to:
              </p>
              <div style={{ display: 'grid', gap: '0.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#d97706', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.9rem', color: '#a16207' }}>Get a Google Maps API key from Google Cloud Console</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#d97706', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.9rem', color: '#a16207' }}>Enable Maps JavaScript API and Places API</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#d97706', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.9rem', color: '#a16207' }}>Replace YOUR_API_KEY in GoogleMapsPharmacyFinder.tsx</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#d97706', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.9rem', color: '#a16207' }}>Restrict API key by HTTP referrer for security</span>
                </div>
              </div>
            </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
