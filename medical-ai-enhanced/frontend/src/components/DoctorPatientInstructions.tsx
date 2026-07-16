import React, { useState, useEffect } from 'react';
import { 
  User, 
  Stethoscope, 
  Save, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Users,
  FileText,
  Brain,
  Activity,
  Utensils,
  Heart
} from 'lucide-react';
import './InstructionStudio.css';

interface Patient {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  medical_conditions?: string[];
  medications?: string[];
  allergies?: string[];
}

interface DoctorInstructions {
  id: string;
  instructions: any;
  createdAt: string;
  doctorName: string;
}

const DoctorPatientInstructions: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [instructions, setInstructions] = useState({
    dietary: '',
    exercise: '',
    medications: '',
    monitoring: '',
    goals: '',
    restrictions: '',
    emergency: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [instructionHistory, setInstructionHistory] = useState<DoctorInstructions[]>([]);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadInstructionHistory(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/doctor/patients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPatients(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load patient accounts' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load patients' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstructionHistory = async (patientId: string) => {
    try {
      const response = await fetch(`/api/doctor/instructions/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInstructionHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to load instruction history:', error);
    }
  };

  const handleSaveInstructions = async () => {
    if (!selectedPatient) {
      setMessage({ type: 'error', text: 'Please select a patient first' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/doctor/instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          instructions: instructions
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Instructions saved and the patient guidance profile is ready.' });
        setInstructions({
          dietary: '',
          exercise: '',
          medications: '',
          monitoring: '',
          goals: '',
          restrictions: '',
          emergency: ''
        });
        loadInstructionHistory(selectedPatient.id);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save instructions' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save instructions' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setMessage(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="instruction-studio max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Stethoscope className="w-8 h-8 mr-3 text-blue-600" />
          Patient Guidance Studio
        </h1>
        <p className="text-gray-600">
          Save structured, patient-specific guidance. The free demo builds a deterministic profile; OpenAI can be enabled separately.
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Select Patient
            </h2>
            
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading patients...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedPatient?.id === patient.id
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-gray-600">{patient.email}</div>
                    {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Conditions: {patient.medical_conditions.join(', ')}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Instruction History */}
          {selectedPatient && instructionHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Instruction History
              </h3>
              <div className="space-y-3">
                {instructionHistory.map((instruction) => (
                  <div key={instruction.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-800">
                      {instruction.doctorName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(instruction.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions Form */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Instructions for {selectedPatient.name}
              </h2>

              <div className="space-y-6">
                {/* Dietary Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Utensils className="w-4 h-4 mr-2" />
                    Dietary Instructions
                  </label>
                  <textarea
                    value={instructions.dietary}
                    onChange={(e) => setInstructions(prev => ({ ...prev, dietary: e.target.value }))}
                    placeholder="e.g., Patient has Type 2 diabetes. Avoid high-carb foods. Monitor blood sugar before meals. Recommended: Low-carb vegetables, lean proteins, whole grains in moderation."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Exercise Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Exercise Instructions
                  </label>
                  <textarea
                    value={instructions.exercise}
                    onChange={(e) => setInstructions(prev => ({ ...prev, exercise: e.target.value }))}
                    placeholder="e.g., Patient should exercise 30 minutes daily. Walking is recommended. Avoid high-impact activities due to knee issues. Monitor heart rate during exercise."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Medication Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Medication Instructions
                  </label>
                  <textarea
                    value={instructions.medications}
                    onChange={(e) => setInstructions(prev => ({ ...prev, medications: e.target.value }))}
                    placeholder="e.g., Take Metformin 500mg twice daily with meals. Monitor for side effects. Check blood sugar levels before each dose. Contact if experiencing nausea or dizziness."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Monitoring Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monitoring & Tracking
                  </label>
                  <textarea
                    value={instructions.monitoring}
                    onChange={(e) => setInstructions(prev => ({ ...prev, monitoring: e.target.value }))}
                    placeholder="e.g., Check blood pressure daily at 8 AM. Record blood sugar levels 3 times daily. Weigh yourself weekly. Track sleep patterns and energy levels."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Health Goals
                  </label>
                  <textarea
                    value={instructions.goals}
                    onChange={(e) => setInstructions(prev => ({ ...prev, goals: e.target.value }))}
                    placeholder="e.g., Achieve HbA1c below 7% within 3 months. Lose 10 pounds in 6 months. Reduce blood pressure to below 140/90. Improve sleep quality."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                {/* Restrictions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restrictions & Warnings
                  </label>
                  <textarea
                    value={instructions.restrictions}
                    onChange={(e) => setInstructions(prev => ({ ...prev, restrictions: e.target.value }))}
                    placeholder="e.g., Avoid alcohol due to medication interactions. No high-impact exercises due to knee arthritis. Limit sodium intake to 1500mg daily."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                {/* Emergency Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Protocols
                  </label>
                  <textarea
                    value={instructions.emergency}
                    onChange={(e) => setInstructions(prev => ({ ...prev, emergency: e.target.value }))}
                    placeholder="e.g., If blood sugar drops below 70, consume 15g of fast-acting carbs. If blood pressure exceeds 180/110, seek immediate medical attention. Contact emergency services for chest pain or severe shortness of breath."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveInstructions}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving guidance profile...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save patient guidance
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Select a Patient
              </h3>
              <p className="text-gray-500">
                Choose a patient from the list to create a personalized guidance profile
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientInstructions;
