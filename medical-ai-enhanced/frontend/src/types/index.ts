// Types and interfaces for the Medical AI application

export interface User {
  id: string;
  email: string;
  userType: 'patient' | 'doctor';
  name: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
  imageUrl?: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    pagination?: {
      limit: number;
      offset: number;
      total: number;
    };
  };
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    userMessage: ChatMessage;
    aiMessage: ChatMessage;
  };
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  address?: string;
  diagnosis: string;
  symptoms?: string;
  allergies?: string;
  current_medications?: string;
  created_at: string;
  updated_at?: string;
}

export interface PatientsResponse {
  success: boolean;
  data: {
    patients: Patient[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface DietRecommendation {
  id: string;
  diagnosis: string;
  recommended_foods: string[];
  avoid_foods: string[];
  additional_notes?: string;
}

export interface DietResponse {
  success: boolean;
  data: {
    recommendation: DietRecommendation;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: any[];
}

export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    api: 'running';
  };
  version?: string;
  error?: string;
}
