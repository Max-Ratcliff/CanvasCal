"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/app/providers"
import { Loader2, BookOpen, Clock, FileText, X, AlertCircle } from "lucide-react"

interface Syllabus {
  id: string
  course_name: string
  ai_insights: {
    grading_scale?: string
    office_hours?: string
    key_policies?: string[]
    summary?: string
  }
  raw_text: string
}

export function SyllabusViewer({ onClose }: { onClose: () => void }) {
  const { token } = useAuth()
  const [syllabi, setSyllabi] = useState<Syllabus[]>([])
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.getSyllabi(token)
        .then(res => {
          if (res.success) {
            setSyllabi(res.data)
            if (res.data.length > 0) setSelectedSyllabus(res.data[0])
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [token])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d4a5e]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center justify-between p-4 border-b border-white/40">
        <h2 className="text-xl font-bold text-[#2d4a5e]">Syllabus Intelligence</h2>
        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/40 overflow-y-auto p-2 bg-white/30">
          <p className="text-xs font-semibold text-[#6b7c8a] px-3 mb-2 uppercase tracking-wider">My Courses</p>
          {syllabi.length === 0 ? (
            <p className="text-sm text-[#6b7c8a] p-3 italic">No syllabi uploaded yet.</p>
          ) : (
            syllabi.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSyllabus(s)}
                className={`w-full text-left px-3 py-2 rounded-xl mb-1 transition-all text-sm font-medium ${
                  selectedSyllabus?.id === s.id 
                    ? "bg-[#2d4a5e] text-white shadow-md" 
                    : "text-[#2d4a5e] hover:bg-white/50"
                }`}
              >
                {s.course_name}
              </button>
            ))
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white/40 custom-scrollbar">
          {selectedSyllabus ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h1 className="text-3xl font-bold text-[#2d4a5e] mb-2">{selectedSyllabus.course_name}</h1>
                <p className="text-[#6b7c8a] italic">{selectedSyllabus.ai_insights.summary || "Course summary not available."}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/70 p-4 rounded-2xl shadow-sm border border-white/60">
                  <div className="flex items-center gap-2 mb-3 text-[#2d4a5e]">
                    <Clock className="w-5 h-5" />
                    <h3 className="font-semibold">Office Hours</h3>
                  </div>
                  <p className="text-sm text-[#2d4a5e]">{selectedSyllabus.ai_insights.office_hours || "Not specified."}</p>
                </div>

                <div className="bg-white/70 p-4 rounded-2xl shadow-sm border border-white/60">
                  <div className="flex items-center gap-2 mb-3 text-[#2d4a5e]">
                    <BookOpen className="w-5 h-5" />
                    <h3 className="font-semibold">Grading Scale</h3>
                  </div>
                  <p className="text-sm text-[#2d4a5e] whitespace-pre-line">{selectedSyllabus.ai_insights.grading_scale || "Not specified."}</p>
                </div>
              </div>

              <div className="bg-white/70 p-6 rounded-2xl shadow-sm border border-white/60">
                <div className="flex items-center gap-2 mb-4 text-[#2d4a5e]">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Important Policies</h3>
                </div>
                <ul className="space-y-2">
                  {selectedSyllabus.ai_insights.key_policies?.map((policy, i) => (
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
                  {selectedSyllabus.raw_text}
                </div>
              </div>
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
