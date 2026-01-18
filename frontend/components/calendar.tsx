"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/app/providers"

const DAYS = ["S", "M", "T", "W", "T", "F", "S"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function Calendar() {
  const { token } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 17))
  const [selectedDay, setSelectedDay] = useState<number | null>(17)
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const todayDate = new Date()
  const isTodayMonth = month === todayDate.getMonth() && year === todayDate.getFullYear()
  const todayDay = todayDate.getDate()
  
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  
  const monthName = currentDate.toLocaleString("default", { month: "short" })
  
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

  const hasEventOnDay = (day: number) => {
    return events.some(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year
    })
  }
  
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/40 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#2d4a5e]" />
          <h2 className="font-semibold text-[#2d4a5e] text-lg">Calendar</h2>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-[#2d4a5e]" />}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={prevMonth}
            className="p-1.5 hover:bg-white/50 rounded-lg text-[#2d4a5e] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-[#2d4a5e] min-w-[80px] text-center">
            {monthName} {year}
          </span>
          <button 
            onClick={nextMonth}
            className="p-1.5 hover:bg-white/50 rounded-lg text-[#2d4a5e] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((day, index) => (
          <div 
            key={index} 
            className="text-center py-1 text-xs font-medium text-[#6b7c8a]"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day, index) => {
          const isSelected = day === selectedDay
          const isToday = day === todayDay && isTodayMonth
          const hasEvent = day !== null && hasEventOnDay(day)
          
          return (
            <div
              key={index}
              onClick={() => day && setSelectedDay(day)}
              className={`
                flex flex-col items-center justify-center aspect-square rounded-lg text-sm transition-colors relative
                ${day === null ? "" : "cursor-pointer"}
                ${isSelected 
                  ? "bg-[#2d4a5e] text-white font-semibold hover:bg-[#3d5a6e]" 
                  : day !== null
                    ? "text-[#2d4a5e] hover:bg-[#2d4a5e]/10"
                    : ""
                }
                ${isToday && !isSelected ? "ring-2 ring-[#2d4a5e] ring-inset" : ""}
              `}
            >
              {day}
              {hasEvent && (
                <div className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-[#c95603]'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
