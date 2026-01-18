import { useState, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  BrainCircuit,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PDFViewer } from "@/components/syllabus/PDFViewer";
import { api } from "@/services/api";
import { BRAND_COLORS } from "@/lib/constants";

interface Course {
  id: number;
  name: string;
  course_code: string;
  syllabus_file_id?: number | null;
}

export default function SyllabusManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('canvas_token') || import.meta.env.VITE_CANVAS_TOKEN;
        const res = await api.getCourses(token);
        if (res.success && res.data) {
            setCourses(res.data);
            if (res.data.length > 0 && !selectedCourseId) {
                setSelectedCourseId(res.data[0].id);
            }
        }
    } catch (e) {
        console.error("Failed to fetch courses", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await fetchCourses();
    setIsSyncing(false);
  };

  const activeCourse = courses.find(c => c.id === selectedCourseId);
  
  // Construct proxy URL if we have a file ID
  const pdfUrl = activeCourse?.syllabus_file_id
    ? `http://localhost:8000/canvas/proxy-pdf/${activeCourse.syllabus_file_id}`
    : null;

  return (
    <div className="flex h-full gap-6">
      {/* Course List Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: BRAND_COLORS.blue }}>Courses</h2>
            <Button size="sm" onClick={handleSync} disabled={isSyncing} 
                    style={{ backgroundColor: 'white', color: BRAND_COLORS.blue, borderColor: BRAND_COLORS.blue, borderWidth: '1px' }}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sync" : "Sync"}
            </Button>
        </div>

        <div className="space-y-2">
            {isLoading ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading courses...</div>
            ) : courses.map(course => (
                <div 
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className="p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between group"
                    style={{
                        backgroundColor: selectedCourseId === course.id ? BRAND_COLORS.blue : 'white',
                        borderColor: BRAND_COLORS.blue,
                        color: selectedCourseId === course.id ? 'white' : '#333'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded flex items-center justify-center"
                             style={{ backgroundColor: selectedCourseId === course.id ? 'rgba(255,255,255,0.2)' : '#F0F4F8' }}>
                            <FileText className="h-4 w-4" style={{ color: selectedCourseId === course.id ? 'white' : BRAND_COLORS.blue }} />
                        </div>
                        <div className="truncate">
                            <p className="font-medium text-sm truncate w-32" title={course.name}>{course.name}</p>
                            <p className="text-xs" style={{ color: selectedCourseId === course.id ? BRAND_COLORS.yellow : '#666' }}>
                                {course.syllabus_file_id ? "Syllabus Detected" : "No Syllabus"}
                            </p>
                        </div>
                    </div>
                    {course.syllabus_file_id && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                </div>
            ))}
            
            {!isLoading && courses.length === 0 && (
                <div className="p-4 border border-dashed rounded text-center text-sm text-gray-500">
                    No active courses found.
                </div>
            )}
        </div>

        <Button className="w-full mt-auto" 
                style={{ backgroundColor: BRAND_COLORS.blue, color: 'white' }}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Manual PDF
        </Button>
      </div>

      {/* Main Split View Area */}
      {activeCourse ? (
      <Card className="flex-1 flex flex-col overflow-hidden h-full rounded-lg shadow-md" style={{ borderColor: BRAND_COLORS.blue, borderWidth: '2px' }}>
        <CardHeader className="pb-3 border-b flex-shrink-0" style={{ borderColor: BRAND_COLORS.border, backgroundColor: '#fff' }}>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl" style={{ color: BRAND_COLORS.blue }}>{activeCourse.name}</CardTitle>
                    <CardDescription style={{ color: BRAND_COLORS.gray }}>
                        {activeCourse.syllabus_file_id 
                            ? "Split View: Verify AI extraction against original document"
                            : "No syllabus PDF detected for this course."
                        }
                    </CardDescription>
                </div>
                {activeCourse.syllabus_file_id && (
                <div className="flex gap-2">
                    <Badge variant="outline" className="flex gap-1 items-center px-3 py-1 bg-[#F0F9FF] border-blue-200 text-blue-700">
                        <BrainCircuit className="h-3 w-3" />
                        AI Confidence: High
                    </Badge>
                </div>
                )}
            </div>
        </CardHeader>

        <div className="flex-1 flex overflow-hidden">
            {/* Left Pane: PDF Viewer */}
            <div className="w-[55%] border-r bg-gray-50 flex flex-col relative" style={{ borderColor: BRAND_COLORS.border }}>
                 <div className="absolute top-2 left-2 z-10">
                     <Badge className="bg-gray-800/80 hover:bg-gray-800/80 text-white backdrop-blur-sm">Original PDF</Badge>
                 </div>
                 <div className="flex-1 overflow-hidden">
                     {pdfUrl ? (
                         <PDFViewer file={pdfUrl} />
                     ) : (
                         <div className="h-full flex items-center justify-center text-gray-400 p-8 text-center">
                             <div className="space-y-2">
                                <AlertCircle className="h-12 w-12 mx-auto opacity-20" />
                                <p>No PDF Syllabus found.</p>
                                <Button size="sm" variant="outline">Upload One</Button>
                             </div>
                         </div>
                     )}
                 </div>
            </div>

            {/* Right Pane: AI Insights & Events */}
            <div className="w-[45%] flex flex-col bg-white">
                 <div className="p-4 border-b" style={{ borderColor: BRAND_COLORS.border, backgroundColor: BRAND_COLORS.cream }}>
                     <h3 className="font-semibold flex items-center gap-2" style={{ color: BRAND_COLORS.blue }}>
                         <BrainCircuit className="h-4 w-4" style={{ color: BRAND_COLORS.yellow }} />
                         Extracted Events
                     </h3>
                 </div>
                 
                 <ScrollArea className="flex-1 p-0">
                     <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
                         {/* Placeholder for AI Extracted Events */}
                         <div className="p-8 text-center text-gray-400 italic">
                             Select "Parse Syllabus" to run AI extraction.
                         </div>
                     </div>
                 </ScrollArea>
            </div>
        </div>
      </Card>
      ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a course to view syllabus.
          </div>
      )}
    </div>
  );
}