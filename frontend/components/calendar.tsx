"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react"
import { api, EventData } from "@/lib/api"
import { useAuth } from "@/app/providers"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function Calendar() {
  const { token } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date()) // Default to today
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const todayDate = new Date()
  const isTodayMonth = month === todayDate.getMonth() && year === todayDate.getFullYear()
  const todayDay = todayDate.getDate()
  
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  
  const monthName = currentDate.toLocaleString("default", { month: "long" })
  
  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) return
      setIsLoading(true)
      try {
        const start = new Date(year, month, 1).toISOString()
        const end = new Date(year, month + 1, 0).toISOString()
        const response = await api.getEvents(token, start, end)
        if (response.success) {
          setEvents(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch events:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [year, month, token])

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year
    })
  }
  
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/40 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-[#2d4a5e]" />
          <h2 className="font-bold text-[#2d4a5e] text-xl">Calendar</h2>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#2d4a5e]" />}
        </div>
        <div className="flex items-center gap-2 bg-white/50 rounded-lg p-1">
          <button 
            onClick={prevMonth}
            className="p-1.5 hover:bg-white rounded-md text-[#2d4a5e] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-[#2d4a5e] min-w-[100px] text-center">
            {monthName} {year}
          </span>
          <button 
            onClick={nextMonth}
            className="p-1.5 hover:bg-white rounded-md text-[#2d4a5e] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2 border-b border-[#2d4a5e]/10 pb-2">
        {DAYS.map((day, index) => (
          <div 
            key={index} 
            className="text-center text-xs font-bold text-[#6b7c8a] uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[#2d4a5e]/10 flex-1 border border-[#2d4a5e]/10 rounded-lg overflow-hidden">
        {days.map((day, index) => {
          const isToday = day === todayDay && isTodayMonth
          const dayEvents = day ? getEventsForDay(day) : []
          
          return (
            <div
              key={index}
              className={`
                flex flex-col min-h-[100px] p-1 bg-white
                ${day === null ? "bg-gray-50/50" : "hover:bg-blue-50/30 transition-colors"}
                ${isToday ? "bg-blue-50/50" : ""}
              `}
            >
              {day && (
                <>
                  <div className={`
                    text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-[#2d4a5e] text-white" : "text-[#6b7c8a]"}
                  `}>
                    {day}
                  </div>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayEvents.map((event, i) => (
                      <div 
                        key={i}
                        title={event.summary}
                        className={`
                          text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer font-medium
                          ${event.event_type === 'assignment' 
                            ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'}
                        `}
                      >
                        {event.summary}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
