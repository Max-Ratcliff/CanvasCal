const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

export interface AssignmentData {
  id: string;
  title: string;
  course: string;
  due_date: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

class APIService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async googleAuth(authCode: string) {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ auth_code: authCode }),
    });
  }

  // Syllabus processing
  async uploadSyllabus(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/process/syllabus`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Canvas endpoints
  async getCanvasAssignments(canvasToken?: string): Promise<APIResponse<AssignmentData[]>> {
    const params = canvasToken ? `?canvas_token=${canvasToken}` : '';
    return this.request(`/canvas/assignments${params}`);
  }

  async toggleAssignment(id: string) {
    return this.request(`/canvas/assignments/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  // Calendar endpoints
  async getEvents(): Promise<APIResponse<EventData[]>> {
    return this.request('/calendar/events');
  }

  async syncCalendar(events: EventData[], googleToken: string) {
    return this.request('/calendar/sync', {
      method: 'POST',
      body: JSON.stringify({ events, google_token: googleToken }),
    });
  }

  // AI Agent endpoint
  async chatWithAgent(message: string, context?: any) {
    return this.request('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }
}

export const api = new APIService();
