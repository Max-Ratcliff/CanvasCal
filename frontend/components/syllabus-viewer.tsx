"use client"

import { useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/app/providers"
import { Loader2, BookOpen, Clock, FileText, X, AlertCircle, Plus, Search, Upload } from "lucide-react"
import { toast } from "sonner"

interface Syllabus {
  id: string
  course_name: string
  pdf_url?: string
  ai_insights: {
    grading_scale?: string
    office_hours?: string
    key_policies?: string[]
    summary?: string
  }
  raw_text: string
}

export function SyllabusViewer({ 
  courses, 
  onClose 
}: { 
  courses: any[],
  onClose: () => void 
}) {
  const { token } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [syllabi, setSyllabi] = useState<Syllabus[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null)
  const [currentSyllabus, setCurrentSyllabus] = useState<Syllabus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [viewMode, setViewMode] = useState<'insights' | 'pdf'>('insights')

  const fetchSyllabi = async () => {
    if (!token) return
    try {
      const res = await api.getSyllabi(token)
      if (res.success) {
        setSyllabi(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSyllabi()
  }, [token])

  // When a course is selected, check if we have its syllabus data
  useEffect(() => {
    if (selectedCourse) {
      const existing = syllabi.find(s => s.course_name === selectedCourse.name)
      if (existing) {
        setCurrentSyllabus(existing)
      } else {
        setCurrentSyllabus(null)
      }
    }
  }, [selectedCourse, syllabi])

  const handleProcessCourse = async () => {
    if (!token || !selectedCourse || isProcessing) return
    
    setIsProcessing(true)
    toast.info(`Analyzing syllabus for ${selectedCourse.name}...`)
    try {
      const res = await api.processCourse(selectedCourse.id, token)
      if (res.success) {
        toast.success("Analysis complete!")
        await fetchSyllabi() // Refresh our list
      } else {
        toast.error(res.message || "Failed to analyze syllabus")
      }
    } catch (error) {
      toast.error("Error connecting to server")
    } finally {
      setTimeout(() => setIsProcessing(false), 1000)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    setIsUploading(true)
    try {
      const response = await api.uploadSyllabus(file, token)
      if (response.success) {
        toast.success("Syllabus processed!")
        fetchSyllabi()
      } else {
        toast.error(response.message || "Failed to process syllabus")
      }
    } catch (error) {
      toast.error("An error occurred during upload")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d4a5e]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center justify-between p-4 border-b border-white/40 bg-white/20">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#2d4a5e]" />
          <h2 className="text-xl font-bold text-[#2d4a5e]">Syllabus Intelligence</h2>
        </div>
        
        {currentSyllabus && (
          <div className="flex bg-white/40 rounded-xl p-1 border border-white/60">
             <button 
                onClick={() => setViewMode('insights')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'insights' ? 'bg-[#2d4a5e] text-white shadow-sm' : 'text-[#2d4a5e] hover:bg-white/50'}`}
             >
               AI Insights
             </button>
             <button 
                onClick={() => setViewMode('pdf')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'pdf' ? 'bg-[#2d4a5e] text-white shadow-sm' : 'text-[#2d4a5e] hover:bg-white/50'}`}
             >
               View PDF
             </button>
          </div>
        )}

        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-white/40 overflow-y-auto p-4 bg-white/30 flex flex-col">
          <div className="mb-6 space-y-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 bg-[#2d4a5e] text-white py-2.5 rounded-xl hover:bg-[#1e3a4e] transition-all text-sm font-medium shadow-sm"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Local PDF
            </button>
          </div>

          <p className="text-xs font-semibold text-[#6b7c8a] px-1 mb-3 uppercase tracking-wider">My Canvas Courses</p>
          <div className="flex-1 space-y-1">
            {courses.length === 0 ? (
              <div className="text-center py-8 px-4 bg-white/20 rounded-2xl border border-dashed border-[#2d4a5e]/20">
                <p className="text-sm text-[#6b7c8a] italic">No courses found. Ensure Canvas is linked!</p>
              </div>
            ) : (
              courses.map((course) => {
                const isAnalyzed = syllabi.some(s => s.course_name === course.name)
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full text-left px-4 py-3 rounded-2xl mb-1 transition-all text-sm font-medium flex items-center justify-between ${
                      selectedCourse?.id === course.id 
                        ? "bg-[#2d4a5e] text-white shadow-md scale-[1.02]" 
                        : "text-[#2d4a5e] hover:bg-white/50"
                    }`}
                  >
                    <span className="truncate mr-2">{course.name}</span>
                    {isAnalyzed && <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-white/40">
          {selectedCourse ? (
            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
              {currentSyllabus ? (
                // Show AI Insights
                viewMode === 'insights' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <h1 className="text-3xl font-bold text-[#2d4a5e] mb-2">{currentSyllabus.course_name}</h1>
                      <p className="text-[#6b7c8a] italic">{currentSyllabus.ai_insights.summary || "Course summary not available."}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/70 p-4 rounded-2xl shadow-sm border border-white/60">
                        <div className="flex items-center gap-2 mb-3 text-[#2d4a5e]">
                          <Clock className="w-5 h-5" />
                          <h3 className="font-semibold">Office Hours</h3>
                        </div>
                        <p className="text-sm text-[#2d4a5e]">{currentSyllabus.ai_insights.office_hours || "Not specified."}</p>
                      </div>

                      <div className="bg-white/70 p-4 rounded-2xl shadow-sm border border-white/60">
                        <div className="flex items-center gap-2 mb-3 text-[#2d4a5e]">
                          <BookOpen className="w-5 h-5" />
                          <h3 className="font-semibold">Grading Scale</h3>
                        </div>
                        <p className="text-sm text-[#2d4a5e] whitespace-pre-line">{currentSyllabus.ai_insights.grading_scale || "Not specified."}</p>
                      </div>
                    </div>

                    <div className="bg-white/70 p-6 rounded-2xl shadow-sm border border-white/60">
                      <div className="flex items-center gap-2 mb-4 text-[#2d4a5e]">
                        <AlertCircle className="w-5 h-5" />
                        <h3 className="font-semibold">Important Policies</h3>
                      </div>
                      <ul className="space-y-2">
                        {currentSyllabus.ai_insights.key_policies?.map((policy, i) => (
                          <li key={i} className="flex gap-2 text-sm text-[#2d4a5e]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f4c542] mt-1.5 shrink-0" />
                            {policy}
                          </li>
                        )) || <p className="text-sm italic">No policies extracted.</p>}
                      </ul>
                    </div>

                    <div className="bg-white/70 p-6 rounded-2xl shadow-sm border border-white/60">
                      <div className="flex items-center gap-2 mb-4 text-[#2d4a5e]">
                        <FileText className="w-5 h-5" />
                        <h3 className="font-semibold">Raw Syllabus Content</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto bg-black/5 p-4 rounded-xl text-xs text-[#2d4a5e] whitespace-pre-wrap font-mono leading-relaxed">
                        {currentSyllabus.raw_text}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show PDF
                  <div className="h-full flex flex-col">
                     {currentSyllabus.pdf_url ? (
                       <iframe 
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/canvas/file/${currentSyllabus.pdf_url}`} 
                          className="w-full h-full rounded-2xl border-none shadow-inner bg-white/20"
                          title="Syllabus PDF"
                       />
                     ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-[#6b7c8a] bg-white/20 rounded-2xl border border-dashed border-white/40">
                          <FileText className="w-16 h-16 mb-4 opacity-20" />
                          <p className="font-medium">PDF not available for this course</p>
                       </div>
                     )}
                  </div>
                )
              ) : (
                // Show On-Demand Analysis Trigger
                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-6 animate-in fade-in duration-500">
                   <div className="w-20 h-20 bg-[#2d4a5e]/10 rounded-full flex items-center justify-center">
                      <Search className="w-10 h-10 text-[#2d4a5e]" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-[#2d4a5e] mb-2">{selectedCourse.name}</h2>
                      <p className="text-[#6b7c8a]">This course hasn't been analyzed yet. We can scan the syllabus and extract grading, policies, and deadlines for you.</p>
                   </div>
                   
                   <button 
                      onClick={handleProcessCourse}
                      disabled={isProcessing}
                      className="flex items-center gap-3 bg-[#2d4a5e] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#1e3a4e] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 group"
                   >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                      {isProcessing ? "Analyzing..." : "Analyze Syllabus"}
                   </button>

                   {!selectedCourse.syllabus_file_id && (
                     <p className="text-xs text-rose-500 font-medium">
                       Note: No syllabus file was found automatically for this course on Canvas.
                     </p>
                   )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#6b7c8a] opacity-50">
              <BookOpen className="w-16 h-16 mb-4" />
              <p>Select a course to view insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
