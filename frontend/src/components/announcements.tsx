import { useState, useEffect } from 'react';
import { Megaphone, ExternalLink, RefreshCw } from 'lucide-react';
import { api, CanvasAnnouncement } from '../services/api';
import { toast } from 'sonner';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<CanvasAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem('canvas_token') || import.meta.env.VITE_CANVAS_TOKEN;
    
    setLoading(true);
    try {
      const response = await api.getCanvasAnnouncements(token || undefined);
      if (response.success && response.data) {
        setAnnouncements(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      toast.error("Failed to sync announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch on mount (backend handles auth fallback)
    fetchAnnouncements();
  }, []);

  if (announcements.length === 0 && !loading) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ borderWidth: '2px', borderColor: '#185177' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#c95603]" />
            <h2 style={{ color: '#185177' }}>Announcements</h2>
            <button 
              onClick={fetchAnnouncements} 
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-[#185177] ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.slice(0, 5).map((announcement) => (
          <div key={announcement.id} className="border-b last:border-0 pb-3 last:pb-0">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-sm" style={{ color: '#185177' }}>{announcement.title}</h3>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {new Date(announcement.posted_at).toLocaleDateString()}
              </span>
            </div>
            <div 
                className="text-xs text-gray-600 mt-1 line-clamp-2" 
                dangerouslySetInnerHTML={{ __html: announcement.message }} 
            />
            <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-semibold" style={{ color: '#c95603' }}>
                    {announcement.author}
                </span>
                <a 
                    href={announcement.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs hover:underline"
                    style={{ color: '#185177' }}
                >
                    View <ExternalLink className="w-3 h-3" />
                </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
