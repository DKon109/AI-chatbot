import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { 
  AuthResponse, 
  ChatResponse, 
  SendMessageResponse, 
  PatientsResponse, 
  DietResponse,
  HealthCheckResponse,
  User,
  ChatMessage,
  Patient,
  DietRecommendation
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, userType: 'patient' | 'doctor', name?: string): Promise<AuthResponse> {
    const requestData = {
      email,
      password,
      userType,
      name,
    };
    console.log('API Register request:', requestData);
    
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', requestData);
    console.log('API Register response:', response.data);
    return response.data;
  }

  async login(email: string, password: string, userType: 'patient' | 'doctor'): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', {
      email,
      password,
      userType,
    });
    return response.data;
  }

  async getProfile(): Promise<{ success: boolean; data: User }> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  // Chat endpoints
  async getChatHistory(limit = 50, offset = 0): Promise<ChatResponse> {
    const response: AxiosResponse<ChatResponse> = await this.api.get('/chat/history', {
      params: { limit, offset },
    });
    return response.data;
  }

  async sendMessage(message: string): Promise<SendMessageResponse> {
    // Use the new general chat endpoint that handles both conversation and medical analysis
    const response: AxiosResponse<any> = await this.api.post('/ai/chat', {
      message: message,
      additionalContext: {
        timestamp: new Date().toISOString()
      }
    });
    
    // Transform AI agent response to chat format
    if (response.data.success && response.data.response) {
      const aiResponse = response.data.response;
      const agentResults = response.data.agentResults;
      
      // Get the primary message - check for natural conversation first
      let primaryMessage = aiResponse.message;
      
      if (aiResponse.isNaturalConversation && agentResults?.conversation?.success) {
        // Use natural conversation response
        primaryMessage = agentResults.conversation.response;
      } else if (agentResults?.symptom?.success && agentResults.symptom.analysis?.recommendation?.message) {
        // Use medical analysis response
        primaryMessage = agentResults.symptom.analysis.recommendation.message;
      }
      
      // Add recommendations from the main response
      const recommendations = aiResponse.recommendations?.map((r: any) => `• ${r.message}`).join('\n') || '';
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        message: primaryMessage + (recommendations ? '\n\n' + recommendations : ''),
        created_at: new Date().toISOString()
      };
      
      return {
        success: true,
        data: {
          userMessage: {
            id: (Date.now() - 1).toString(),
            sender: 'user',
            message: message,
            created_at: new Date().toISOString()
          },
          aiMessage: aiMessage
        }
      };
    }
    
    // Fallback to original chat endpoint if AI agents fail
    const fallbackResponse: AxiosResponse<SendMessageResponse> = await this.api.post('/chat/message', {
      message,
    });
    return fallbackResponse.data;
  }

  async analyzeFoodImage(imageFile: File, description?: string): Promise<SendMessageResponse> {
    // Use the new AI agent system for food analysis
    const response: AxiosResponse<any> = await this.api.post('/ai/food-analysis', {
      meal: {
        name: 'Food Image',
        description: description || 'Uploaded food image',
        imageFile: imageFile.name
      },
      condition: 'diabetes', // Default condition, could be dynamic
      medications: [], // Could be fetched from user profile
      allergies: [] // Could be fetched from user profile
    });
    
    // Transform AI agent response to chat format
    if (response.data.success && response.data.response) {
      const aiResponse = response.data.response;
      const agentResults = response.data.agentResults;
      
      // Get the primary message from NutritionAgent if available
      let primaryMessage = aiResponse.message;
      if (agentResults?.nutrition?.success) {
        const nutrition = agentResults.nutrition;
        const components = nutrition.mealAnalysis?.components || [];
        const profile = nutrition.mealAnalysis?.nutritionalProfile || {};
        const status = nutrition.assessment?.status || 'reviewed';
        primaryMessage = [
          `Assessment: ${status.replace('_', ' ')}`,
          components.length ? `Detected from your description: ${components.join(', ')}` : 'No specific ingredients were detected from the description.',
          `Estimated profile: ${profile.calories || 0} kcal, ${profile.protein || 0}g protein, ${profile.carbohydrates || 0}g carbohydrates, ${profile.fiber || 0}g fiber.`,
          ...(nutrition.assessment?.warnings || []).map((warning: string) => `Warning: ${warning}`)
        ].join('\n');
      }
      
      // Add recommendations from the main response
      const nutritionRecommendations = agentResults?.nutrition?.recommendations || aiResponse.recommendations || [];
      const recommendations = nutritionRecommendations.map((r: any) => `• ${r.message}`).join('\n');
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        message: `🍽️ **Food Analysis Complete!**\n\n${primaryMessage}\n\n` + recommendations,
        created_at: new Date().toISOString(),
        imageUrl: URL.createObjectURL(imageFile)
      };
      
      return {
        success: true,
        data: {
          userMessage: {
            id: (Date.now() - 1).toString(),
            sender: 'user',
            message: description || '📷 [Image uploaded for analysis]',
            created_at: new Date().toISOString(),
            imageUrl: URL.createObjectURL(imageFile)
          },
          aiMessage: aiMessage
        }
      };
    }
    
    // Fallback to original chat endpoint if AI agents fail
    const formData = new FormData();
    formData.append('image', imageFile);
    if (description) {
      formData.append('description', description);
    }
    
    const fallbackResponse: AxiosResponse<SendMessageResponse> = await this.api.post('/chat/analyze-food', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return fallbackResponse.data;
  }

  async clearChatHistory(): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete('/chat/history');
    return response.data;
  }

  // Patient management endpoints (doctor only)
  async getPatients(page = 1, limit = 10, search = ''): Promise<PatientsResponse> {
    const response: AxiosResponse<PatientsResponse> = await this.api.get('/patients', {
      params: { page, limit, search },
    });
    return response.data;
  }

  async getPatient(id: string): Promise<{ success: boolean; data: Patient }> {
    const response = await this.api.get(`/patients/${id}`);
    return response.data;
  }

  async addPatient(patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; data: Patient }> {
    const response = await this.api.post('/patients', patientData);
    return response.data;
  }

  async updatePatient(id: string, patientData: Partial<Patient>): Promise<{ success: boolean; message: string; data: Patient }> {
    const response = await this.api.put(`/patients/${id}`, patientData);
    return response.data;
  }

  async deletePatient(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete(`/patients/${id}`);
    return response.data;
  }

  // Diet recommendation endpoints
  async getDietRecommendation(diagnosis: string): Promise<DietResponse> {
    const response: AxiosResponse<DietResponse> = await this.api.get('/diet/recommendation', {
      params: { diagnosis },
    });
    return response.data;
  }

  async getAllDietRecommendations(): Promise<{ success: boolean; data: DietRecommendation[] }> {
    const response = await this.api.get('/diet/all');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResponse> {
    const response: AxiosResponse<HealthCheckResponse> = await this.api.get('/health');
    return response.data;
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  async structuredSymptomAnalysis(step: string, data: any = {}) {
    const response: AxiosResponse<any> = await this.api.post('/ai/structured-symptoms', {
      step,
      ...data
    });
    return response.data;
  }

  async findNearbyPharmacies(latitude: number, longitude: number, radius: number = 5000) {
    const response: AxiosResponse<any> = await this.api.get('/pharmacy/nearby', {
      params: { latitude, longitude, radius }
    });
    return response.data;
  }

  async sharePrescriptionWithPharmacy(pharmacyId: string, prescriptionId: string, patientConsent: boolean) {
    const response: AxiosResponse<any> = await this.api.post('/pharmacy/share-prescription', {
      pharmacyId,
      prescriptionId,
      patientConsent
    });
    return response.data;
  }

  async getDirectionsToPharmacy(pharmacyId: string, latitude: number, longitude: number) {
    const response: AxiosResponse<any> = await this.api.get(`/pharmacy/directions/${pharmacyId}`, {
      params: { latitude, longitude }
    });
    return response.data;
  }

  async submitFeedback(feedback: {
    user_input: string;
    ai_response: string;
    rating: number;
    doctor_correction?: {
      diagnosis: string;
      severity: string;
    };
  }): Promise<{ success: boolean; message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await this.api.post('/ai/feedback', feedback);
    return response.data;
  }

  async getPerformanceMetrics(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/ai/performance-metrics');
    return response.data;
  }

  async getFeedbackAnalysis(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/ai/feedback-analysis');
    return response.data;
  }

  // Hospital search methods
  async searchHospitals(latitude: number, longitude: number, radius: number = 5000, symptoms: string[] = []) {
    const response: AxiosResponse<any> = await this.api.post('/hospital/search', {
      latitude,
      longitude,
      radius,
      symptoms
    });
    return response.data;
  }

  async getDirectionsToHospital(hospitalPlaceId: string, latitude: number, longitude: number) {
    const response: AxiosResponse<any> = await this.api.get(`/hospital/directions/${hospitalPlaceId}`, {
      params: { latitude, longitude }
    });
    return response.data;
  }

  async getMedicalSpecialties() {
    const response: AxiosResponse<any> = await this.api.get('/hospital/specialties');
    return response.data;
  }
}

const apiService = new ApiService();

export default apiService;
