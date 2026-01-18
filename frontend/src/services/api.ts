const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface EventData {
  id?: string;
  summary: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  event_type: 'class' | 'assignment' | 'exam' | 'study' | 'travel';
  weight?: number;
  color_hex?: string;
}

export interface CanvasAssignment {
  id: number;
  title: string;
  description: string;
  due_at: string | null;
  course_id: number;
  course_name: string;
  html_url: string;
}

export interface CanvasAnnouncement {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  author: string;
  html_url: string;
  context_code: string;
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
  async getCanvasAssignments(token?: string): Promise<APIResponse<CanvasAssignment[]>> {
    const query = token ? `?canvas_token=${token}` : '';
    return this.request<CanvasAssignment[]>(`/canvas/assignments${query}`);
  }

  async getCourses(token?: string): Promise<APIResponse<any[]>> {
    const query = token ? `?canvas_token=${token}` : '';
    return this.request<any[]>(`/canvas/courses${query}`);
  }

  async getCanvasAnnouncements(token?: string): Promise<APIResponse<CanvasAnnouncement[]>> {
    const query = token ? `?canvas_token=${token}` : '';
    return this.request<CanvasAnnouncement[]>(`/canvas/announcements${query}`);
  }

  async importCanvasSyllabus(courseId: number, canvasToken?: string): Promise<APIResponse<EventData[]>> {
    const params = canvasToken ? `?canvas_token=${canvasToken}` : '';
    return this.request<EventData[]>(`/canvas/import-syllabus/${courseId}${params}`, {
      method: 'POST'
    });
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