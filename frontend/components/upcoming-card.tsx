"use client"

import { useState, useEffect } from "react"
import { Clock, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/app/providers"

interface UpcomingItem {
  id: number
  title: string
  course: string
  dueDate: string
  color: string
}

const COLORS = ["bg-sky-400", "bg-rose-400", "bg-amber-400", "bg-blue-500", "bg-emerald-400", "bg-violet-400"]

export function UpcomingCard() {
  const { token } = useAuth()
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!token) return
      setIsLoading(true)
      try {
        const canvasToken = localStorage.getItem('canvas_token') || undefined
        const response = await api.getCanvasAssignments(canvasToken, token)
        if (response.success && response.data) {
          // Map Canvas assignments to UpcomingItem format
          const mappedItems: UpcomingItem[] = response.data
            .filter((a: any) => a.due_at) // Only those with due dates
            .map((a: any, index: number) => ({
              id: a.id,
              title: a.title,
              course: a.course_name,
              dueDate: new Date(a.due_at).toLocaleString([], { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5) // Top 5
          
          setItems(mappedItems)
        }
      } catch (error) {
        console.error("Failed to fetch assignments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [token])

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/40 h-full overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Clock className="w-5 h-5 text-[#2d4a5e]" />
        <h2 className="font-semibold text-[#2d4a5e] text-lg">Upcoming</h2>
      </div>
      
      <div className="space-y-3 overflow-y-auto pr-1 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-[#2d4a5e]" />
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div 
              key={item.id}
              className="flex items-start gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors cursor-pointer"
            >
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.color}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#2d4a5e] text-sm truncate">{item.title}</p>
                <p className="text-xs text-[#6b7c8a] truncate">{item.course}</p>
                <p className="text-xs text-[#b85c38] mt-1 font-medium">{item.dueDate}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm text-[#6b7c8a]">
              {!token ? "Sign in to see upcoming items" : "No upcoming assignments"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
