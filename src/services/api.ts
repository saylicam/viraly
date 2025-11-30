import { ApiResponse, AnalysisResult, VideoUploadResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    // Warn if using localhost on mobile (won't work)
    if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
      console.warn('⚠️  Using localhost - this won\'t work on a physical device!');
      console.warn('⚠️  Set EXPO_PUBLIC_API_URL to your computer\'s IP address (e.g., http://192.168.1.100:3333)');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Une erreur est survenue',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/health');
  }

  // Video analysis
  async analyzeVideo(videoUrl: string, prompt?: string): Promise<ApiResponse<AnalysisResult>> {
    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ videoUrl, prompt }),
    });
  }

  // Upload video with timeout
  async uploadVideo(videoUri: string, onProgress?: (progress: number) => void): Promise<ApiResponse<VideoUploadResponse>> {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    try {
      console.log('📤 Starting video upload:', videoUri);
      
      // Create FormData
      const formData = new FormData();
      
      // Get file name from URI
      const fileName = videoUri.split('/').pop() || 'video.mp4';
      
      // Detect file type from URI or default to mp4
      let fileType = 'video/mp4';
      if (videoUri.includes('.mov')) fileType = 'video/quicktime';
      if (videoUri.includes('.webm')) fileType = 'video/webm';
      if (videoUri.includes('.m4v')) fileType = 'video/mp4';

      // For React Native, we need to use the URI directly
      // The FormData will handle the file reading
      formData.append('video', {
        uri: videoUri,
        type: fileType,
        name: fileName,
      } as any);

      console.log('📤 FormData prepared:', { fileName, fileType, uri: videoUri });

      const url = `${this.baseUrl}/api/analyze/video`;
      
      console.log('📤 Uploading to:', url);
      console.log('📤 Timeout set to 120 seconds (2 minutes)');
      
      // Simulate progress (React Native fetch doesn't support progress natively)
      if (onProgress) {
        onProgress(10); // Start
        setTimeout(() => onProgress(30), 1000);
        setTimeout(() => onProgress(50), 2000);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let React Native set it with boundary
      });

      clearTimeout(timeoutId);

      console.log('📤 Upload response status:', response.status);

      if (onProgress) {
        onProgress(70); // Upload complete, analysis starting
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Erreur HTTP ${response.status}` };
        }
        
        console.error('❌ Upload error:', errorData);
        return {
          success: false,
          error: errorData.error || errorData.message || `Erreur HTTP ${response.status}`,
        };
      }

      if (onProgress) {
        onProgress(90); // Analysis processing
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);

      if (onProgress) {
        onProgress(100); // Complete
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      console.error('❌ Upload error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Le téléversement a pris trop de temps. La vidéo est peut-être trop grande ou le serveur est lent. Réessaye avec une vidéo plus courte.',
        };
      }
      
      if (error.message?.includes('Network request failed') || error.message?.includes('timeout')) {
        const isLocalhost = this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
        return {
          success: false,
          error: isLocalhost 
            ? 'Connexion échouée. Si tu es sur un téléphone, configure EXPO_PUBLIC_API_URL avec l\'IP de ton PC (ex: http://192.168.1.100:3333)'
            : 'Connexion au serveur échouée. Vérifie que le serveur backend est lancé (cd src/server && npm run dev)',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion lors de l\'upload',
      };
    }
  }

  // Get analysis suggestions
  async getSuggestions(): Promise<ApiResponse<{
    trendingHashtags: string[];
    contentTypes: string[];
    optimizationTips: string[];
  }>> {
    return this.request('/api/analyze/suggestions');
  }

  // Payment methods
  async createPaymentIntent(customerId: string): Promise<ApiResponse<{
    clientSecret: string;
    paymentIntentId: string;
  }>> {
    return this.request('/api/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ customerId }),
    });
  }

  async createCustomer(email: string, name: string): Promise<ApiResponse<{
    customerId: string;
    email: string;
  }>> {
    return this.request('/api/payments/create-customer', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  async getSubscription(customerId: string): Promise<ApiResponse<{
    isActive: boolean;
    subscription: any;
  }>> {
    return this.request(`/api/payments/subscription/${customerId}`);
  }

  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<{
    success: boolean;
    subscription: any;
  }>> {
    return this.request('/api/payments/cancel-subscription', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId }),
    });
  }
}

export const apiService = new ApiService();
