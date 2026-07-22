import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, User, LogOut, Home, Plus, Search, Edit, Trash2, 
  Users, FileText, Eye, ArrowLeft, Brain, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { Patient, DietRecommendation } from '../types';
import './DashboardTheme.css';
import DoctorPatientInstructions from './DoctorPatientInstructions';
import AIIntakeReviewQueue from './AIIntakeReviewQueue';

const DoctorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'patients' | 'diet' | 'ai-instructions' | 'ai-review'>('patients');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dietRecommendations, setDietRecommendations] = useState<DietRecommendation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [showDietRecommendation, setShowDietRecommendation] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phone: '',
    address: '',
    diagnosis: '',
    symptoms: '',
    allergies: '',
    current_medications: ''
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getPatients(1, 50, searchTerm);
      if (response.success) {
        setPatients(response.data.patients);
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  const loadDietRecommendations = useCallback(async () => {
    try {
      const response = await ApiService.getAllDietRecommendations();
      if (response.success) {
        setDietRecommendations(response.data);
      }
    } catch (error) {
      console.error('Failed to load diet recommendations:', error);
    }
  }, []);

  useEffect(() => {
    if (!user || user.userType !== 'doctor') {
      navigate('/');
      return;
    }
    loadDietRecommendations();
  }, [user, navigate, loadDietRecommendations]);

  useEffect(() => {
    if (user?.userType === 'doctor') {
      loadPatients();
    }
  }, [user, loadPatients]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const patientData = {
        ...patientForm,
        age: parseInt(patientForm.age)
      };
      const response = await ApiService.addPatient(patientData);
      if (response.success) {
        setShowAddPatient(false);
        resetForm();
        loadPatients();
      }
    } catch (error) {
      console.error('Failed to add patient:', error);
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    try {
      const patientData = {
        ...patientForm,
        age: parseInt(patientForm.age)
      };
      const response = await ApiService.updatePatient(selectedPatient.id, patientData);
      if (response.success) {
        setShowEditPatient(false);
        setSelectedPatient(null);
        resetForm();
        loadPatients();
      }
    } catch (error) {
      console.error('Failed to update patient:', error);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await ApiService.deletePatient(patientId);
        loadPatients();
      } catch (error) {
        console.error('Failed to delete patient:', error);
      }
    }
  };

  const resetForm = () => {
    setPatientForm({
      name: '',
      age: '',
      gender: 'male',
      phone: '',
      address: '',
      diagnosis: '',
      symptoms: '',
      allergies: '',
      current_medications: ''
    });
  };

  const openEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientForm({
      name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender || 'male',
      phone: patient.phone || '',
      address: patient.address || '',
      diagnosis: patient.diagnosis,
      symptoms: patient.symptoms || '',
      allergies: patient.allergies || '',
      current_medications: patient.current_medications || ''
    });
    setShowEditPatient(true);
  };

  const openDietRecommendation = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDietRecommendation(true);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  const handleBackToHome = () => {
    if (window.confirm('Are you sure you want to return to home?')) {
      navigate('/');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="compass-dashboard doctor-compass" style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header className="compass-header" style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Stethoscope size={24} color="#10b981" />
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: 0
            }}>
              Doctor Dashboard
            </h1>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '0.5rem'
          }}>
            <User size={16} color="#64748b" />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {/^(dr\.?\s)/i.test(user.name) ? user.name : `Dr. ${user.name}`}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="compass-secondary-button"
            onClick={handleBackToHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            <Home size={16} />
            Home
          </button>
          <button
            className="compass-logout-button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="compass-sidebar" style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            className={`compass-nav-item ${activeTab === 'patients' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('patients')}
            style={{
              padding: '1rem 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'patients' ? '#10b981' : '#64748b',
              borderBottom: activeTab === 'patients' ? '2px solid #10b981' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Users size={20} />
            Patient Management
          </button>
          <button
            className={`compass-nav-item ${activeTab === 'diet' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('diet')}
            style={{
              padding: '1rem 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'diet' ? '#10b981' : '#64748b',
              borderBottom: activeTab === 'diet' ? '2px solid #10b981' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText size={20} />
            Diet Recommendations
          </button>
          <button
            className={`compass-nav-item ${activeTab === 'ai-instructions' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('ai-instructions')}
            style={{
              padding: '1rem 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'ai-instructions' ? '#10b981' : '#64748b',
              borderBottom: activeTab === 'ai-instructions' ? '2px solid #10b981' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Brain size={20} />
            AI Instructions
          </button>
          <button
            className={`compass-nav-item ${activeTab === 'ai-review' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('ai-review')}
            style={{
              padding: '1rem 0', border: 'none', backgroundColor: 'transparent',
              color: activeTab === 'ai-review' ? '#10b981' : '#64748b',
              borderBottom: activeTab === 'ai-review' ? '2px solid #10b981' : '2px solid transparent',
              cursor: 'pointer', fontSize: '1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <ClipboardCheck size={20} />
            AI Intake Review
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="compass-workspace" style={{
        flex: 1,
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {activeTab === 'patients' ? (
          <div>
            {/* Patients Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  Patient Management
                </h2>
                <p style={{
                  color: '#64748b',
                  margin: 0
                }}>
                  Manage your patients and their medical records
                </p>
              </div>
              <button
                onClick={() => setShowAddPatient(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                <Plus size={20} />
                Add Patient
              </button>
            </div>

            {/* Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <Search size={20} color="#64748b" />
              <input
                type="text"
                placeholder="Search patients by name, diagnosis, or symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Patients List */}
            {isLoading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                color: '#64748b'
              }}>
                Loading patients...
              </div>
            ) : patients.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '3rem',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <Users size={48} color="#e2e8f0" />
                <h3 style={{ margin: '1rem 0 0.5rem', color: '#374151' }}>
                  No Patients Found
                </h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  {searchTerm ? 'No patients match your search criteria.' : 'You haven\'t added any patients yet.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddPatient(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      margin: '0 auto'
                    }}
                  >
                    <Plus size={20} />
                    Add Your First Patient
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          color: '#1e293b',
                          margin: '0 0 0.5rem 0'
                        }}>
                          {patient.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          color: '#64748b',
                          fontSize: '0.9rem',
                          marginBottom: '0.5rem'
                        }}>
                          <span>Age: {patient.age}</span>
                          <span>Gender: {patient.gender}</span>
                          {patient.phone && <span>Phone: {patient.phone}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openDietRecommendation(patient)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#f0f9ff',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="View Diet Recommendations"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditPatient(patient)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Edit Patient"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient.id)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Delete Patient"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#374151',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Diagnosis
                        </h4>
                        <p style={{
                          color: '#64748b',
                          margin: 0,
                          fontSize: '0.9rem'
                        }}>
                          {patient.diagnosis}
                        </p>
                      </div>
                      
                      {patient.symptoms && (
                        <div>
                          <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#374151',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Symptoms
                          </h4>
                          <p style={{
                            color: '#64748b',
                            margin: 0,
                            fontSize: '0.9rem'
                          }}>
                            {patient.symptoms}
                          </p>
                        </div>
                      )}
                      
                      {patient.allergies && (
                        <div>
                          <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#374151',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Allergies
                          </h4>
                          <p style={{
                            color: '#64748b',
                            margin: 0,
                            fontSize: '0.9rem'
                          }}>
                            {patient.allergies}
                          </p>
                        </div>
                      )}
                      
                      {patient.current_medications && (
                        <div>
                          <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#374151',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Current Medications
                          </h4>
                          <p style={{
                            color: '#64748b',
                            margin: 0,
                            fontSize: '0.9rem'
                          }}>
                            {patient.current_medications}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'diet' ? (
          <div>
            {/* Diet Recommendations */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: '0 0 0.5rem 0'
              }}>
                Diet Recommendations
              </h2>
              <p style={{
                color: '#64748b',
                margin: 0
              }}>
                Browse available diet recommendations for different conditions
              </p>
            </div>

            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {dietRecommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    margin: '0 0 1rem 0'
                  }}>
                    {recommendation.diagnosis}
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#059669',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Recommended Foods
                      </h4>
                      <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                      }}>
                        {recommendation.recommended_foods.map((food, index) => (
                          <li key={index} style={{
                            padding: '0.25rem 0',
                            color: '#374151',
                            fontSize: '0.9rem'
                          }}>
                            • {food}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#dc2626',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Foods to Avoid
                      </h4>
                      <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                      }}>
                        {recommendation.avoid_foods.map((food, index) => (
                          <li key={index} style={{
                            padding: '0.25rem 0',
                            color: '#374151',
                            fontSize: '0.9rem'
                          }}>
                            • {food}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {recommendation.additional_notes && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#374151',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Additional Notes
                      </h4>
                      <p style={{
                        color: '#64748b',
                        margin: 0,
                        fontSize: '0.9rem',
                        lineHeight: '1.5'
                      }}>
                        {recommendation.additional_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'ai-instructions' ? (
          <DoctorPatientInstructions />
        ) : (
          <AIIntakeReviewQueue />
        )}
      </main>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: 0
              }}>
                Add New Patient
              </h2>
              <button
                onClick={() => {
                  setShowAddPatient(false);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem'
                }}
              >
                <ArrowLeft size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleAddPatient}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={patientForm.name}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Patient's full name"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Age *
                  </label>
                  <input
                    type="number"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, age: e.target.value }))}
                    required
                    min="0"
                    max="150"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Patient's age"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Gender
                  </label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Phone number"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={patientForm.address}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, address: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Patient's address"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Diagnosis *
                  </label>
                  <input
                    type="text"
                    value={patientForm.diagnosis}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Medical diagnosis"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Symptoms
                  </label>
                  <textarea
                    value={patientForm.symptoms}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, symptoms: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    placeholder="Patient's symptoms"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Allergies
                  </label>
                  <textarea
                    value={patientForm.allergies}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    placeholder="Known allergies"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Current Medications
                  </label>
                  <textarea
                    value={patientForm.current_medications}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, current_medications: e.target.value }))}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    placeholder="Current medications"
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPatient(false);
                    resetForm();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditPatient && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: 0
              }}>
                Edit Patient
              </h2>
              <button
                onClick={() => {
                  setShowEditPatient(false);
                  setSelectedPatient(null);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem'
                }}
              >
                <ArrowLeft size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleEditPatient}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={patientForm.name}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Patient's full name"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Age *
                  </label>
                  <input
                    type="number"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, age: e.target.value }))}
                    required
                    min="0"
                    max="150"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Patient's age"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Gender
                  </label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Phone number"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={patientForm.address}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, address: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Patient's address"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Diagnosis *
                  </label>
                  <input
                    type="text"
                    value={patientForm.diagnosis}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Medical diagnosis"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Symptoms
                  </label>
                  <textarea
                    value={patientForm.symptoms}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, symptoms: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    placeholder="Patient's symptoms"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Allergies
                  </label>
                  <textarea
                    value={patientForm.allergies}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    placeholder="Known allergies"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Current Medications
                  </label>
                  <textarea
                    value={patientForm.current_medications}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, current_medications: e.target.value }))}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    placeholder="Current medications"
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPatient(false);
                    setSelectedPatient(null);
                    resetForm();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Update Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diet Recommendation Modal */}
      {showDietRecommendation && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: 0
              }}>
                Diet Recommendations for {selectedPatient.name}
              </h2>
              <button
                onClick={() => {
                  setShowDietRecommendation(false);
                  setSelectedPatient(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem'
                }}
              >
                <ArrowLeft size={20} color="#64748b" />
              </button>
            </div>

            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: '0 0 1rem 0'
              }}>
                Patient Information
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <strong>Name:</strong> {selectedPatient.name}
                </div>
                <div>
                  <strong>Age:</strong> {selectedPatient.age}
                </div>
                <div>
                  <strong>Diagnosis:</strong> {selectedPatient.diagnosis}
                </div>
                {selectedPatient.allergies && (
                  <div>
                    <strong>Allergies:</strong> {selectedPatient.allergies}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '0.75rem',
              border: '1px solid #bbf7d0'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#166534',
                margin: '0 0 1rem 0'
              }}>
                Recommended Diet Plan
              </h3>
              <p style={{
                color: '#374151',
                margin: '0 0 1rem 0',
                fontSize: '0.9rem'
              }}>
                Based on the diagnosis "{selectedPatient.diagnosis}", here are the recommended dietary guidelines:
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#059669',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Recommended Foods
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Balanced diet</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Fresh vegetables</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Fruits</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Lean meat</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Fish</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Whole grains</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Adequate hydration</li>
                  </ul>
                </div>
                
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#dc2626',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Foods to Avoid
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Excessive oily food</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• High-salt foods</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Excessive sweets</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Alcohol</li>
                    <li style={{ padding: '0.25rem 0', color: '#374151', fontSize: '0.9rem' }}>• Highly processed foods</li>
                  </ul>
                </div>
              </div>
              
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db'
              }}>
                <h4 style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 0.5rem 0'
                }}>
                  Additional Notes
                </h4>
                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  Please consult a professional nutritionist for a personalized diet plan tailored to your specific needs and medical condition.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => {
                  setShowDietRecommendation(false);
                  setSelectedPatient(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
