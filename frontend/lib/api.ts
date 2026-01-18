const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface EventData {
  summary: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  event_type: 'class' | 'assignment' | 'exam' | 'study' | 'travel';
  weight?: number;
}

class APIService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<APIResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async googleAuth(code: string, token: string): Promise<APIResponse<any>> {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }, token);
  }

  // AI Agent endpoint
  async chatWithAgent(message: string, token: string) {
    return this.request<{ response: string }>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }, token);
  }

  // Canvas endpoints
  async getCanvasAssignments(canvasToken?: string, token?: string): Promise<APIResponse<any[]>> {
    const params = canvasToken ? `?canvas_token=${canvasToken}` : '';
    return this.request<any[]>(`/canvas/assignments${params}`, {}, token);
  }

  async syncCanvas(token: string, canvasToken?: string): Promise<APIResponse<any>> {
    const params = canvasToken ? `?canvas_token=${canvasToken}` : '';
    return this.request(`/canvas/sync${params}`, { method: 'POST' }, token);
  }

  // Calendar endpoints
  async getEvents(token: string, start?: string, end?: string): Promise<APIResponse<any[]>> {
    let params = '';
    if (start || end) {
      const query = new URLSearchParams();
      if (start) query.append('start', start);
      if (end) query.append('end', end);
      params = `?${query.toString()}`;
    }
    return this.request<any[]>(`/calendar/events${params}`, {}, token);
  }
  
  async syncToGoogle(token: string) {
      return this.request('/calendar/sync', { method: 'POST' }, token);
  }

  // Syllabus processing
  async uploadSyllabus(file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_BASE_URL}/process/syllabus`, {
      method: 'POST',
      body: formData,
      headers
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const api = new APIService();