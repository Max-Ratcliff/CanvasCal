"use client"

import { useRef, useState, useEffect } from "react"
import { 
  Upload, 
  Loader2, 
  Calendar as CalendarIcon, 
  LogOut, 
  LogIn, 
  CheckCircle2, 
  LayoutDashboard, 
  Plus, 
  BookOpen 
} from "lucide-react"
import { Calendar } from "@/components/calendar"
import { UpcomingCard } from "@/components/upcoming-card"
import { AIAssistant } from "@/components/ai-assistant"
import { SyllabusViewer } from "@/components/syllabus-viewer"
import { BananaSlugBackground } from "@/components/banana-slug-background"
import { ThemeProvider } from "@/components/theme-provider"
import { useAuth } from "./providers"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSyncingCanvas, setIsSyncingCanvas] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [showSyllabusViewer, setShowSyllabusViewer] = useState(false)
  const [showCanvasConnect, setShowCanvasConnect] = useState(false)
  const [canvasUrl, setCanvasUrl] = useState("https://canvas.instructure.com")
  const [canvasToken, setCanvasToken] = useState("")
  const [integrations, setIntegrations] = useState({ google_calendar: false, canvas: false })
  const [cachedCourses, setCachedCourses] = useState<any[]>([])
  const { session, signIn, signOut, token } = useAuth()

  const loginWithGoogle = () => {
    setIsConnectingGoogle(true)
    api.getGoogleAuthUrl(token || "")
      .then(res => {
        if (res.success && res.data?.url) {
          window.location.href = res.data.url
        }
      })
      .finally(() => setIsConnectingGoogle(false))
  }

  useEffect(() => {
    if (token) {
      api.getIntegrationsStatus(token)
        .then(res => {
          if (res.success) {
            setIntegrations(res.data)
            // If canvas is connected, pre-fetch courses
            if (res.data.canvas) {
              api.getCanvasCourses(token).then(courseRes => {
                if (courseRes.success) setCachedCourses(courseRes.data)
              })
            }
          }
        })
        .catch(console.error)
    }
  }, [token])

  const handleCanvasConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !canvasUrl || !canvasToken) return
    setIsSyncingCanvas(true)
    try {
      const res = await api.connectCanvas(canvasUrl, canvasToken, token)
      if (res.success) {
        toast.success("Canvas connected!")
        setIntegrations(prev => ({ ...prev, canvas: true }))
        setShowCanvasConnect(false)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error("Failed to connect Canvas")
    } finally {
      setIsSyncingCanvas(false)
    }
  }

  const handleCanvasSync = async () => {
      if (!token) return
      if (!integrations.canvas) {
        setShowCanvasConnect(true)
        return
      }
      setIsSyncingCanvas(true)
      try {
          const response = await api.syncCanvas(token)
          if (response.success) {
              toast.success("Canvas sync started!")
          } else {
              toast.error(response.message || "Canvas authentication failed.")
              // If it failed, maybe the token is wrong. Let them re-connect.
              setShowCanvasConnect(true)
          }
      } catch (error) {
          toast.error("Failed to sync Canvas")
          setShowCanvasConnect(true)
      } finally {
          setIsSyncingCanvas(false)
      }
  }

  const [email, setEmail] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsSigningIn(true)
    try {
      await signIn(email)
      toast.success("Check your email for the login link!")
    } catch (error: any) {
      toast.error(error.message || "Failed to send login link")
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFECD1] relative">
      <BananaSlugBackground />

      {/* Canvas Connection Overlay */}
      {showCanvasConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-[#2d4a5e] mb-2">Connect Canvas</h2>
            <p className="text-sm text-[#6b7c8a] mb-6">Follow these steps to link your school account:</p>
            
            <form onSubmit={handleCanvasConnect} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#2d4a5e] mb-2">Canvas School URL</label>
                <input 
                  type="text" 
                  value={canvasUrl}
                  onChange={(e) => setCanvasUrl(e.target.value)}
                  placeholder="https://canvas.ucsc.edu"
                  className="w-full px-4 py-3 rounded-xl border border-[#2d4a5e]/20 text-sm focus:outline-none focus:border-[#2d4a5e]"
                  required
                />
              </div>

              <div className="bg-[#f4c542]/10 p-4 rounded-2xl border border-[#f4c542]/20">
                <p className="text-xs text-[#2d4a5e] leading-relaxed">
                  1. Click the button below to open your Canvas settings.<br/>
                  2. Scroll to <strong>"Approved Integrations"</strong>.<br/>
                  3. Click <strong>"+ New Access Token"</strong>.<br/>
                  4. Copy the code and paste it below.
                </p>
                <a 
                  href={`${canvasUrl}/profile/settings#access_tokens`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs font-bold text-[#2d4a5e] underline hover:text-black"
                >
                  Go to Canvas Settings →
                </a>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2d4a5e] mb-2">Access Token</label>
                <input 
                  type="password" 
                  value={canvasToken}
                  onChange={(e) => setCanvasToken(e.target.value)}
                  placeholder="Paste your token here..."
                  className="w-full px-4 py-3 rounded-xl border border-[#2d4a5e]/20 text-sm focus:outline-none focus:border-[#2d4a5e]"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCanvasConnect(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#2d4a5e]/20 text-[#2d4a5e] font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={isSyncingCanvas}
                  className="flex-2 bg-[#2d4a5e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1e3a4e] transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSyncingCanvas ? <Loader2 className="w-5 h-5 animate-spin" /> : "Connect Canvas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="px-6 py-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#f4c542] rounded-lg flex items-center justify-center">
              <span className="font-bold text-[#2d4a5e] text-sm">UCSC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2d4a5e]">CanvasCal</h1>
              <p className="text-sm text-[#6b7c8a]">School Calendar Hub</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!session ? (
              <form onSubmit={handleSignIn} className="flex items-center gap-2">
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="Enter your email"
                   className="px-3 py-2 rounded-xl border border-[#2d4a5e]/20 text-sm focus:outline-none focus:border-[#2d4a5e]"
                   required
                 />
                 <button 
                  type="submit"
                  disabled={isSigningIn}
                  className="flex items-center gap-2 bg-[#2d4a5e] text-white px-4 py-2.5 rounded-xl hover:bg-[#1e3a4e] transition-colors disabled:opacity-50"
                >
                  {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span className="text-sm font-medium">Sign In</span>
                </button>
              </form>
            ) : (
                <>
                <button 
                  onClick={() => setShowSyllabusViewer(true)}
                  className="flex items-center gap-2 bg-white text-[#2d4a5e] px-4 py-2.5 rounded-xl border border-[#2d4a5e]/20 hover:bg-gray-50 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Syllabus Hub</span>
                </button>

                <button 
                  onClick={handleCanvasSync}
                  disabled={isSyncingCanvas}
                  className="flex items-center gap-2 bg-[#2d4a5e] text-white px-4 py-2.5 rounded-xl hover:bg-[#1e3a4e] transition-colors disabled:opacity-50"
                >
                  {isSyncingCanvas ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    {isSyncingCanvas ? "Syncing..." : "Sync Canvas"}
                  </span>
                </button>

                {integrations.google_calendar ? (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl border border-green-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Google Connected</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => loginWithGoogle()}
                    disabled={isConnectingGoogle}
                    className="flex items-center gap-2 bg-white text-[#2d4a5e] px-4 py-2.5 rounded-xl border border-[#2d4a5e]/20 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {isConnectingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
                    <span className="text-sm font-medium">Link Google Cal</span>
                  </button>
                )}

                <button 
                  onClick={() => signOut()}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2.5 rounded-xl hover:bg-red-100 transition-colors border border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                </>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content - 3 Panel Layout */}
      <main className="px-6 pb-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 max-w-5xl mx-auto">
          {/* Left Column - Calendar on top, Upcoming below */}
          <div className="flex flex-col gap-4">
            {/* Calendar */}
            <div className="min-h-[320px]">
              <Calendar />
            </div>
            
            {/* Upcoming */}
            <div className="min-h-[200px]">
              <UpcomingCard />
            </div>
          </div>
          
          {/* Right Column - AI Agent (full height) */}
          <div className="h-full min-h-[540px]">
            <AIAssistant />
          </div>
        </div>
      </main>

      {/* Syllabus Intelligence Modal */}
      {showSyllabusViewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 md:p-10">
          <div className="bg-[#FFECD1] w-full max-w-6xl h-full max-h-[90vh] rounded-[2rem] shadow-2xl border border-white/50 overflow-hidden animate-in zoom-in-95 duration-300">
             <SyllabusViewer 
                courses={cachedCourses}
                onClose={() => setShowSyllabusViewer(false)} 
             />
          </div>
        </div>
      )}
    </div>
  )
}
