import { useState } from "react";
import { 
  FileText, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  BrainCircuit,
  CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function SyllabusManager() {
  const [selectedCourse, setSelectedCourse] = useState("CSE 101");
  const [isSyncing, setIsSyncing] = useState(false);

  // Mock Data
  const courses = [
    { id: "101", name: "CSE 101", status: "synced", pdf: "cse101_syllabus.pdf" },
    { id: "102", name: "MATH 23A", status: "missing", pdf: null },
    { id: "103", name: "HIS 10", status: "synced", pdf: "his10_syllabus.pdf" },
  ];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Course List Sidebar */}
      <div className="w-1/4 min-w-[250px] flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Courses</h2>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync"}
            </Button>
        </div>

        <div className="space-y-2">
            {courses.map(course => (
                <div 
                    key={course.id}
                    onClick={() => setSelectedCourse(course.name)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                        selectedCourse === course.name 
                        ? "bg-accent border-indigo-500 text-accent-foreground" 
                        : "bg-card hover:bg-muted"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">{course.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {course.status === "synced" ? "Syllabus Active" : "No Syllabus"}
                            </p>
                        </div>
                    </div>
                    {course.status === "synced" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                </div>
            ))}
        </div>

        <Button className="w-full mt-auto" variant="secondary">
            <Upload className="h-4 w-4 mr-2" />
            Upload Manual PDF
        </Button>
      </div>

      {/* Main Content Area */}
      <Card className="flex-1 flex flex-col overflow-hidden h-full">
        <CardHeader className="pb-2 border-b">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">{selectedCourse}</CardTitle>
                    <CardDescription>Syllabus & AI Insights</CardDescription>
                </div>
                <Badge variant="outline" className="flex gap-1 items-center px-3 py-1">
                    <BrainCircuit className="h-3 w-3 text-indigo-400" />
                    AI Parsed
                </Badge>
            </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
            <Tabs defaultValue="insights" className="h-full flex flex-col">
                <div className="px-6 py-2 bg-muted/30 border-b">
                    <TabsList>
                        <TabsTrigger value="insights">AI Insights</TabsTrigger>
                        <TabsTrigger value="events">Parsed Events (15)</TabsTrigger>
                        <TabsTrigger value="pdf">Original PDF</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-muted/10">
                    <TabsContent value="insights" className="mt-0 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Late Policy</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-semibold">-10% per day</p>
                                    <p className="text-sm text-muted-foreground">Up to 3 days max.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Office Hours</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-semibold">Tue/Thu 2-4 PM</p>
                                    <p className="text-sm text-muted-foreground">Room E2-304</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-indigo-500" />
                                Important Notes
                            </h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                <li>The final project requires a group of 3 members.</li>
                                <li>Midterm is strictly closed-book.</li>
                                <li>Attendance is mandatory for guest lectures.</li>
                            </ul>
                        </div>
                    </TabsContent>

                    <TabsContent value="events" className="mt-0">
                        <div className="rounded-md border bg-card">
                            <div className="p-4 border-b font-medium text-sm grid grid-cols-4 text-muted-foreground">
                                <span>Event Name</span>
                                <span>Date</span>
                                <span>Type</span>
                                <span>Weight</span>
                            </div>
                            <ScrollArea className="h-[400px]">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="p-4 border-b last:border-0 grid grid-cols-4 text-sm items-center hover:bg-muted/50 transition-colors">
                                        <span className="font-medium">Assignment {i}</span>
                                        <span>Oct {10 + i}, 2026</span>
                                        <Badge variant="secondary" className="w-fit">Assignment</Badge>
                                        <span>5%</span>
                                    </div>
                                ))}
                                <div className="p-4 grid grid-cols-4 text-sm items-center hover:bg-muted/50 transition-colors bg-indigo-500/5">
                                    <span className="font-medium">Midterm Exam</span>
                                    <span>Nov 15, 2026</span>
                                    <Badge className="w-fit bg-red-500 hover:bg-red-600">Exam</Badge>
                                    <span>25%</span>
                                </div>
                            </ScrollArea>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button className="gap-2">
                                <CalendarCheck className="h-4 w-4" />
                                Add to Calendar
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="pdf" className="mt-0 h-full">
                        <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-muted/20">
                            <div className="text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>PDF Viewer Placeholder</p>
                                <p className="text-xs">(Would integrate react-pdf here)</p>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
