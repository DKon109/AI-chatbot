import React, { useState } from 'react';
import { Bot, Stethoscope, User, Shield, Zap, Heart } from 'lucide-react';
import AuthModal from './AuthModal';
import './HomeTheme.css';

const HomePage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');

  const handleAuthClick = (mode: 'login' | 'register', type: 'patient' | 'doctor') => {
    setAuthMode(mode);
    setUserType(type);
    setShowAuthModal(true);
  };

  return (
    <div className="compass-home" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header className="compass-home-header" style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={32} color="white" />
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            MedAI Pro
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => handleAuthClick('login', 'patient')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Patient Login
          </button>
          <button
            onClick={() => handleAuthClick('login', 'doctor')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Doctor Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="compass-home-main" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '1200px', width: '100%' }}>
          {/* Hero Section */}
          <div className="compass-home-hero" style={{ marginBottom: '4rem' }}>
            <div style={{
              width: '120px',
              height: '120px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              backdropFilter: 'blur(10px)',
              animation: 'float 3s ease-in-out infinite'
            }}>
              <Bot size={60} color="white" />
            </div>
            
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              Medical AI Assistant
            </h1>
            <p style={{
              fontSize: '1.5rem',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Intelligent Health Consultation · Professional Medical Support
            </p>
          </div>

          {/* Portal Cards */}
          <div className="compass-portal-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {/* Patient Portal */}
            <div className="compass-portal-card patient-card" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            }}
            onClick={() => handleAuthClick('login', 'patient')}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                margin: '0 auto 1.5rem'
              }}>
                <User size={40} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Patient Portal
              </h3>
              <p style={{
                color: '#64748b',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Get personalized health consultations and symptom analysis from our AI assistant
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuthClick('login', 'patient');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}
                >
                  Login
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuthClick('register', 'patient');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: '#3b82f6',
                    border: '2px solid #3b82f6',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Doctor Portal */}
            <div className="compass-portal-card doctor-card" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            }}
            onClick={() => handleAuthClick('login', 'doctor')}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                margin: '0 auto 1.5rem'
              }}>
                <Stethoscope size={40} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Doctor Portal
              </h3>
              <p style={{
                color: '#64748b',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Manage patients, provide AI-assisted diagnosis, and access comprehensive medical tools
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuthClick('login', 'doctor');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}
                >
                  Login
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuthClick('register', 'doctor');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: '#10b981',
                    border: '2px solid #10b981',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}
                >
                  Register
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="compass-home-features" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '3rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <Zap size={32} color="white" style={{ marginBottom: '1rem' }} />
              <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Structured Guidance</h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                Deterministic symptom analysis with safety-focused recommendations
              </p>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <Shield size={32} color="white" style={{ marginBottom: '1rem' }} />
              <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Role-Based Access</h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                Separate patient and doctor workflows with authenticated routes
              </p>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <Heart size={32} color="white" style={{ marginBottom: '1rem' }} />
              <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Portfolio Demo</h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                Educational prototype using fictional data, not medical advice
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          userType={userType}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
