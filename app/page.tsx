'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { HiOutlineMail, HiOutlineRefresh, HiOutlineInbox, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineExclamationCircle, HiOutlineSearch, HiOutlineChatAlt2, HiOutlineCalendar, HiOutlineExclamation } from 'react-icons/hi'
import { FaSlack } from 'react-icons/fa'
import { FiLoader, FiX, FiCheckCircle, FiActivity } from 'react-icons/fi'

// --- Theme ---
const THEME_VARS = {
  '--background': '40 30% 96%',
  '--card': '40 35% 98%',
  '--foreground': '30 25% 18%',
  '--primary': '25 55% 40%',
  '--primary-foreground': '40 30% 98%',
  '--secondary': '40 25% 90%',
  '--accent': '15 60% 45%',
  '--muted': '40 20% 88%',
  '--muted-foreground': '30 15% 45%',
  '--border': '35 25% 82%',
  '--input': '35 20% 75%',
  '--destructive': '0 65% 50%',
  '--radius': '0.5rem',
} as React.CSSProperties

// --- Interfaces ---
interface GmailSummaryItem {
  sender: string
  subject: string
  gist: string
}

interface GmailTodoItem {
  task: string
  source: string
  priority: string
}

interface GmailResponse {
  summary: GmailSummaryItem[]
  todos: GmailTodoItem[]
  total_emails_analyzed: number
  message: string
}

interface SlackSummaryItem {
  channel: string
  topic: string
  participants: string
  gist: string
}

interface SlackTodoItem {
  task: string
  source_channel: string
  priority: string
}

interface SlackResponse {
  summary: SlackSummaryItem[]
  todos: SlackTodoItem[]
  total_messages_analyzed: number
  message: string
}

interface CalendarSummaryItem {
  event_title: string
  date_time: string
  duration: string
  attendees: string
  gist: string
}

interface CalendarTodoItem {
  task: string
  source_event: string
  priority: string
}

interface CalendarConflict {
  event_1: string
  event_2: string
  conflict_time: string
}

interface CalendarResponse {
  summary: CalendarSummaryItem[]
  todos: CalendarTodoItem[]
  total_events_analyzed: number
  conflicts: CalendarConflict[]
  message: string
}

// --- Constants ---
const GMAIL_AGENT_ID = '69a0975820f2d8662ce27ba7'
const SLACK_AGENT_ID = '69a09759488a186a311cc2d9'
const CALENDAR_AGENT_ID = '69a09aa3ac231956dceb6a60'

// --- Sample Data ---
const SAMPLE_GMAIL: GmailResponse = {
  summary: [
    { sender: 'Sarah Chen (VP Engineering)', subject: 'Q1 Sprint Planning Review', gist: 'Requesting your input on the Q1 sprint priorities before the all-hands meeting. Key focus areas: infrastructure scaling, customer-facing features, and tech debt reduction.' },
    { sender: 'Mark Johnson (Client Success)', subject: 'Renewal Discussion - Acme Corp', gist: 'Acme Corp renewal is due next month. They want to upgrade to enterprise tier. Need pricing approval from finance team by Friday.' },
    { sender: 'HR Team', subject: 'Updated Remote Work Policy 2025', gist: 'New hybrid policy effective March 1st. Teams can choose 2-3 remote days per week. Manager approval required for full remote requests.' },
    { sender: 'DevOps Alerts', subject: 'Production Deployment Successful', gist: 'Version 3.2.1 deployed successfully to all regions. Zero downtime achieved. Performance metrics within expected thresholds.' },
    { sender: 'Lisa Park (Design Lead)', subject: 'Design System V2 Feedback Needed', gist: 'The new component library is ready for review. Updated color tokens, spacing scale, and accessibility improvements. Feedback deadline: end of week.' },
  ],
  todos: [
    { task: 'Submit Q1 sprint priority recommendations to Sarah', source: 'Sarah Chen - Q1 Sprint Planning', priority: 'high' },
    { task: 'Review and approve Acme Corp enterprise pricing', source: 'Mark Johnson - Acme Renewal', priority: 'high' },
    { task: 'Read and acknowledge new remote work policy', source: 'HR Team - Remote Policy', priority: 'medium' },
    { task: 'Review Design System V2 component library', source: 'Lisa Park - Design System', priority: 'medium' },
    { task: 'Check production deployment monitoring dashboard', source: 'DevOps Alerts - Deployment', priority: 'low' },
  ],
  total_emails_analyzed: 47,
  message: 'Successfully analyzed 47 recent emails and identified 5 key messages with 5 action items.'
}

const SAMPLE_SLACK: SlackResponse = {
  summary: [
    { channel: '#engineering', topic: 'Database Migration Timeline', participants: 'Alex, Jamie, Priya, Tom', gist: 'Team discussed the PostgreSQL to CockroachDB migration. Agreed on a phased rollout starting with read replicas. Estimated 3-week timeline with rollback plan.' },
    { channel: '#product', topic: 'Feature Prioritization for Q1', participants: 'Rachel, Derek, Samantha', gist: 'Debated between real-time collaboration features and mobile app improvements. Consensus leaning toward collaboration as it impacts more users.' },
    { channel: '#general', topic: 'Company All-Hands Recap', participants: 'CEO, CTO, multiple', gist: 'Revenue grew 32% QoQ. New office opening in Austin in Q2. Employee satisfaction survey results were positive overall with room for improvement in career development.' },
    { channel: '#design', topic: 'Accessibility Audit Results', participants: 'Lisa, Chen, Maria', gist: 'External audit found 12 WCAG violations across the main product. Most are color contrast issues. Sprint planned for next week to address critical items.' },
  ],
  todos: [
    { task: 'Review database migration rollback plan before approval', source_channel: '#engineering', priority: 'high' },
    { task: 'Vote on Q1 feature prioritization survey by Thursday', source_channel: '#product', priority: 'high' },
    { task: 'Submit career development feedback form from all-hands', source_channel: '#general', priority: 'medium' },
    { task: 'Schedule accessibility sprint planning meeting', source_channel: '#design', priority: 'medium' },
  ],
  total_messages_analyzed: 312,
  message: 'Analyzed 312 messages across 4 active channels and identified 4 key discussions with 4 action items.'
}

const SAMPLE_CALENDAR: CalendarResponse = {
  summary: [
    { event_title: 'Weekly Sprint Planning', date_time: 'Mon Feb 27, 9:00 AM - 10:00 AM', duration: '1 hour', attendees: 'Engineering Team (12 people)', gist: 'Review sprint backlog, assign stories for the week, and discuss blockers from last sprint.' },
    { event_title: 'Product Strategy Review', date_time: 'Tue Feb 28, 2:00 PM - 3:30 PM', duration: '1.5 hours', attendees: 'Sarah C., Derek M., VP Product', gist: 'Q1 product roadmap review with stakeholders. Presenting user research findings and prioritization framework.' },
    { event_title: '1:1 with Manager', date_time: 'Wed Mar 1, 11:00 AM - 11:30 AM', duration: '30 min', attendees: 'Sarah Chen', gist: 'Regular check-in. Discuss career growth plan and feedback on recent project delivery.' },
    { event_title: 'Design Review: Dashboard V2', date_time: 'Thu Mar 2, 3:00 PM - 4:00 PM', duration: '1 hour', attendees: 'Lisa P., Chen W., UX Team', gist: 'Review updated dashboard mockups incorporating user feedback. Focus on data visualization components.' },
    { event_title: 'Client Demo - Acme Corp', date_time: 'Fri Mar 3, 10:00 AM - 11:00 AM', duration: '1 hour', attendees: 'Mark J., Acme Corp Team (4)', gist: 'Live demo of new enterprise features for Acme Corp renewal discussion. Prepare demo environment.' },
  ],
  todos: [
    { task: 'Prepare sprint backlog and priority list before Monday planning', source_event: 'Weekly Sprint Planning - Mon', priority: 'high' },
    { task: 'Finalize product roadmap slides and user research summary', source_event: 'Product Strategy Review - Tue', priority: 'high' },
    { task: 'Write self-assessment notes for 1:1 discussion', source_event: '1:1 with Manager - Wed', priority: 'medium' },
    { task: 'Review dashboard V2 mockups and prepare feedback', source_event: 'Design Review - Thu', priority: 'medium' },
    { task: 'Set up demo environment and test all enterprise features', source_event: 'Client Demo Acme Corp - Fri', priority: 'high' },
  ],
  total_events_analyzed: 23,
  conflicts: [
    { event_1: 'Product Strategy Review', event_2: 'Engineering Standup', conflict_time: 'Tue Feb 28, 2:00 PM - 2:15 PM' },
  ],
  message: 'Analyzed 23 events over the next 7 days. Found 5 key events, 5 action items, and 1 scheduling conflict.'
}

// --- Helpers ---
function extractAgentData(result: any): any {
  try {
    let data = result?.response?.result
    if (!data) {
      data = result?.response?.data || result?.response
    }
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        return { message: data, summary: [], todos: [], conflicts: [] }
      }
    }
    return data || { message: 'No data received', summary: [], todos: [], conflicts: [] }
  } catch {
    return { message: 'Failed to parse response', summary: [], todos: [], conflicts: [] }
  }
}

function getPriorityColor(priority: string): string {
  const p = (priority ?? '').toLowerCase()
  if (p === 'high') return 'hsl(0, 65%, 50%)'
  if (p === 'medium') return 'hsl(35, 85%, 45%)'
  return 'hsl(140, 50%, 38%)'
}

function getPriorityBg(priority: string): string {
  const p = (priority ?? '').toLowerCase()
  if (p === 'high') return 'hsl(0, 65%, 95%)'
  if (p === 'medium') return 'hsl(35, 85%, 93%)'
  return 'hsl(140, 50%, 93%)'
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(40, 30%, 96%)', color: 'hsl(30, 25%, 18%)' }}>
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm mb-4" style={{ color: 'hsl(30, 15%, 45%)' }}>{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'hsl(25, 55%, 40%)', color: 'hsl(40, 30%, 98%)' }}>
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Skeleton Loaders ---
function SummarySkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 p-3 rounded-lg" style={{ background: 'hsl(40, 20%, 88%)' }}>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  )
}

function TodoSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'hsl(40, 20%, 88%)' }}>
          <Skeleton className="h-4 w-4 rounded mt-0.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Gmail Section ---
function GmailSection({
  data,
  loading,
  error,
  onFetch,
  onRetry,
  checkedTodos,
  onToggleTodo,
  sampleMode,
}: {
  data: GmailResponse | null
  loading: boolean
  error: string | null
  onFetch: (query: string, maxEmails: number) => void
  onRetry: () => void
  checkedTodos: Record<string, boolean>
  onToggleTodo: (key: string) => void
  sampleMode: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [maxEmails, setMaxEmails] = useState(20)
  const [summaryOpen, setSummaryOpen] = useState(true)

  const displayData = sampleMode ? SAMPLE_GMAIL : data
  const summaryItems = Array.isArray(displayData?.summary) ? displayData.summary : []
  const todoItems = Array.isArray(displayData?.todos) ? displayData.todos : []
  const totalAnalyzed = displayData?.total_emails_analyzed ?? 0
  const responseMessage = displayData?.message ?? ''

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: 'hsl(0, 70%, 95%)' }}>
          <HiOutlineMail className="w-6 h-6" style={{ color: 'hsl(0, 65%, 50%)' }} />
        </div>
        <div>
          <h2 className="text-xl font-semibold font-sans" style={{ color: 'hsl(30, 25%, 18%)' }}>Gmail</h2>
          <p className="text-xs" style={{ color: 'hsl(30, 15%, 45%)' }}>Summarize your inbox</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={{ color: 'hsl(30, 15%, 45%)' }}>Search filter</Label>
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} />
              <Input
                placeholder="e.g., from:boss@company.com"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 text-sm"
                style={{ borderColor: 'hsl(35, 20%, 75%)', background: 'hsl(40, 30%, 96%)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FiX className="w-3.5 h-3.5" style={{ color: 'hsl(30, 15%, 45%)' }} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={{ color: 'hsl(30, 15%, 45%)' }}>Max emails</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={maxEmails}
              onChange={(e) => setMaxEmails(Number(e.target.value) || 20)}
              className="text-sm w-24"
              style={{ borderColor: 'hsl(35, 20%, 75%)', background: 'hsl(40, 30%, 96%)' }}
            />
          </div>
          <Button
            onClick={() => onFetch(searchQuery, maxEmails)}
            disabled={loading}
            className="w-full font-medium text-sm shadow-md"
            style={{ background: 'hsl(25, 55%, 40%)', color: 'hsl(40, 30%, 98%)' }}
          >
            {loading ? (
              <span className="flex items-center gap-2"><FiLoader className="w-4 h-4 animate-spin" /> Analyzing...</span>
            ) : (
              <span className="flex items-center gap-2"><HiOutlineMail className="w-4 h-4" /> Summarize Gmail</span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
            <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
            <SummarySkeleton />
          </Card>
          <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
            <CardHeader className="pb-2"><Skeleton className="h-5 w-32" /></CardHeader>
            <TodoSkeleton />
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card style={{ background: 'hsl(0, 65%, 97%)', borderColor: 'hsl(0, 65%, 85%)' }} className="shadow-md border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HiOutlineExclamationCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(0, 65%, 50%)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'hsl(0, 65%, 40%)' }}>Failed to fetch Gmail summary</p>
                <p className="text-xs mt-1" style={{ color: 'hsl(0, 40%, 50%)' }}>{error}</p>
                <Button onClick={onRetry} variant="outline" size="sm" className="mt-3 text-xs" style={{ borderColor: 'hsl(0, 65%, 75%)', color: 'hsl(0, 65%, 45%)' }}>
                  Try again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && !displayData && (
        <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="p-4 rounded-full mb-4" style={{ background: 'hsl(40, 25%, 90%)' }}>
              <HiOutlineInbox className="w-10 h-10" style={{ color: 'hsl(30, 15%, 45%)' }} />
            </div>
            <p className="font-medium text-sm" style={{ color: 'hsl(30, 25%, 18%)' }}>Click Summarize Gmail to get started</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(30, 15%, 45%)' }}>Your inbox summary and action items will appear here</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && displayData && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {totalAnalyzed > 0 && (
              <Badge variant="secondary" className="text-xs font-medium px-3 py-1" style={{ background: 'hsl(40, 25%, 90%)', color: 'hsl(30, 25%, 18%)' }}>
                {totalAnalyzed} emails analyzed
              </Badge>
            )}
            {responseMessage && (
              <span className="text-xs" style={{ color: 'hsl(30, 15%, 45%)' }}>{responseMessage}</span>
            )}
          </div>

          {/* Summary Card */}
          {summaryItems.length > 0 && (
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HiOutlineMail className="w-4 h-4" style={{ color: 'hsl(0, 65%, 50%)' }} />
                        <CardTitle className="text-sm font-semibold" style={{ color: 'hsl(30, 25%, 18%)' }}>Email Summaries</CardTitle>
                        <Badge variant="secondary" className="text-xs" style={{ background: 'hsl(0, 70%, 95%)', color: 'hsl(0, 65%, 45%)' }}>
                          {summaryItems.length}
                        </Badge>
                      </div>
                      {summaryOpen ? <HiOutlineChevronUp className="w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} /> : <HiOutlineChevronDown className="w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-3">
                        {summaryItems.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg border" style={{ background: 'hsl(40, 30%, 96%)', borderColor: 'hsl(35, 25%, 87%)' }}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold leading-tight" style={{ color: 'hsl(30, 25%, 18%)' }}>{item?.subject ?? 'No subject'}</p>
                            </div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: 'hsl(25, 55%, 40%)' }}>{item?.sender ?? 'Unknown sender'}</p>
                            <p className="text-xs leading-relaxed" style={{ color: 'hsl(30, 15%, 35%)', lineHeight: '1.65' }}>{item?.gist ?? ''}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Todo Checklist */}
          {todoItems.length > 0 && (
            <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4" style={{ color: 'hsl(25, 55%, 40%)' }} />
                  <CardTitle className="text-sm font-semibold" style={{ color: 'hsl(30, 25%, 18%)' }}>Action Items</CardTitle>
                  <Badge variant="secondary" className="text-xs" style={{ background: 'hsl(25, 55%, 92%)', color: 'hsl(25, 55%, 35%)' }}>
                    {todoItems.filter((_, idx) => !checkedTodos[`gmail-${idx}`]).length} remaining
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {todoItems.map((todo, idx) => {
                    const key = `gmail-${idx}`
                    const checked = !!checkedTodos[key]
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border transition-all duration-200" style={{ background: checked ? 'hsl(40, 20%, 92%)' : 'hsl(40, 30%, 96%)', borderColor: 'hsl(35, 25%, 87%)', opacity: checked ? 0.7 : 1 }}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => onToggleTodo(key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${checked ? 'line-through' : ''}`} style={{ color: 'hsl(30, 25%, 18%)', lineHeight: '1.65' }}>
                            {todo?.task ?? ''}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs px-2 py-0.5" style={{ borderColor: 'hsl(35, 25%, 75%)', color: 'hsl(30, 15%, 45%)', fontSize: '10px' }}>
                              {todo?.source ?? 'Unknown'}
                            </Badge>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: getPriorityBg(todo?.priority ?? ''), color: getPriorityColor(todo?.priority ?? '') }}>
                              {(todo?.priority ?? 'medium').charAt(0).toUpperCase() + (todo?.priority ?? 'medium').slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// --- Slack Section ---
function SlackSection({
  data,
  loading,
  error,
  onFetch,
  onRetry,
  checkedTodos,
  onToggleTodo,
  sampleMode,
}: {
  data: SlackResponse | null
  loading: boolean
  error: string | null
  onFetch: (channels: string, messageCount: number) => void
  onRetry: () => void
  checkedTodos: Record<string, boolean>
  onToggleTodo: (key: string) => void
  sampleMode: boolean
}) {
  const [channels, setChannels] = useState('')
  const [messageCount, setMessageCount] = useState(50)
  const [summaryOpen, setSummaryOpen] = useState(true)

  const displayData = sampleMode ? SAMPLE_SLACK : data
  const summaryItems = Array.isArray(displayData?.summary) ? displayData.summary : []
  const todoItems = Array.isArray(displayData?.todos) ? displayData.todos : []
  const totalAnalyzed = displayData?.total_messages_analyzed ?? 0
  const responseMessage = displayData?.message ?? ''

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: 'hsl(290, 50%, 93%)' }}>
          <FaSlack className="w-6 h-6" style={{ color: 'hsl(290, 50%, 45%)' }} />
        </div>
        <div>
          <h2 className="text-xl font-semibold font-sans" style={{ color: 'hsl(30, 25%, 18%)' }}>Slack</h2>
          <p className="text-xs" style={{ color: 'hsl(30, 15%, 45%)' }}>Catch up on conversations</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={{ color: 'hsl(30, 15%, 45%)' }}>Channels</Label>
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} />
              <Input
                placeholder="e.g., #general, #engineering"
                value={channels}
                onChange={(e) => setChannels(e.target.value)}
                className="pl-9 pr-8 text-sm"
                style={{ borderColor: 'hsl(35, 20%, 75%)', background: 'hsl(40, 30%, 96%)' }}
              />
              {channels && (
                <button onClick={() => setChannels('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FiX className="w-3.5 h-3.5" style={{ color: 'hsl(30, 15%, 45%)' }} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={{ color: 'hsl(30, 15%, 45%)' }}>Messages per channel</Label>
            <Input
              type="number"
              min={1}
              max={500}
              value={messageCount}
              onChange={(e) => setMessageCount(Number(e.target.value) || 50)}
              className="text-sm w-24"
              style={{ borderColor: 'hsl(35, 20%, 75%)', background: 'hsl(40, 30%, 96%)' }}
            />
          </div>
          <Button
            onClick={() => onFetch(channels, messageCount)}
            disabled={loading}
            className="w-full font-medium text-sm shadow-md"
            style={{ background: 'hsl(290, 50%, 40%)', color: 'hsl(40, 30%, 98%)' }}
          >
            {loading ? (
              <span className="flex items-center gap-2"><FiLoader className="w-4 h-4 animate-spin" /> Analyzing...</span>
            ) : (
              <span className="flex items-center gap-2"><FaSlack className="w-4 h-4" /> Summarize Slack</span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
            <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
            <SummarySkeleton />
          </Card>
          <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
            <CardHeader className="pb-2"><Skeleton className="h-5 w-32" /></CardHeader>
            <TodoSkeleton />
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card style={{ background: 'hsl(0, 65%, 97%)', borderColor: 'hsl(0, 65%, 85%)' }} className="shadow-md border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HiOutlineExclamationCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(0, 65%, 50%)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'hsl(0, 65%, 40%)' }}>Failed to fetch Slack summary</p>
                <p className="text-xs mt-1" style={{ color: 'hsl(0, 40%, 50%)' }}>{error}</p>
                <Button onClick={onRetry} variant="outline" size="sm" className="mt-3 text-xs" style={{ borderColor: 'hsl(0, 65%, 75%)', color: 'hsl(0, 65%, 45%)' }}>
                  Try again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && !displayData && (
        <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="p-4 rounded-full mb-4" style={{ background: 'hsl(40, 25%, 90%)' }}>
              <HiOutlineChatAlt2 className="w-10 h-10" style={{ color: 'hsl(30, 15%, 45%)' }} />
            </div>
            <p className="font-medium text-sm" style={{ color: 'hsl(30, 25%, 18%)' }}>Click Summarize Slack to catch up</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(30, 15%, 45%)' }}>Channel summaries and action items will appear here</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && displayData && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {totalAnalyzed > 0 && (
              <Badge variant="secondary" className="text-xs font-medium px-3 py-1" style={{ background: 'hsl(40, 25%, 90%)', color: 'hsl(30, 25%, 18%)' }}>
                {totalAnalyzed} messages analyzed
              </Badge>
            )}
            {responseMessage && (
              <span className="text-xs" style={{ color: 'hsl(30, 15%, 45%)' }}>{responseMessage}</span>
            )}
          </div>

          {/* Summary Card */}
          {summaryItems.length > 0 && (
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaSlack className="w-4 h-4" style={{ color: 'hsl(290, 50%, 45%)' }} />
                        <CardTitle className="text-sm font-semibold" style={{ color: 'hsl(30, 25%, 18%)' }}>Channel Summaries</CardTitle>
                        <Badge variant="secondary" className="text-xs" style={{ background: 'hsl(290, 50%, 93%)', color: 'hsl(290, 50%, 40%)' }}>
                          {summaryItems.length}
                        </Badge>
                      </div>
                      {summaryOpen ? <HiOutlineChevronUp className="w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} /> : <HiOutlineChevronDown className="w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-3">
                        {summaryItems.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg border" style={{ background: 'hsl(40, 30%, 96%)', borderColor: 'hsl(35, 25%, 87%)' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs font-semibold" style={{ borderColor: 'hsl(290, 50%, 75%)', color: 'hsl(290, 50%, 40%)' }}>
                                {item?.channel ?? '#unknown'}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold leading-tight mb-1" style={{ color: 'hsl(30, 25%, 18%)' }}>{item?.topic ?? 'No topic'}</p>
                            <p className="text-xs mb-1.5" style={{ color: 'hsl(25, 55%, 40%)' }}>
                              Participants: {item?.participants ?? 'Unknown'}
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: 'hsl(30, 15%, 35%)', lineHeight: '1.65' }}>{item?.gist ?? ''}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Todo Checklist */}
          {todoItems.length > 0 && (
            <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4" style={{ color: 'hsl(290, 50%, 40%)' }} />
                  <CardTitle className="text-sm font-semibold" style={{ color: 'hsl(30, 25%, 18%)' }}>Action Items</CardTitle>
                  <Badge variant="secondary" className="text-xs" style={{ background: 'hsl(290, 50%, 93%)', color: 'hsl(290, 50%, 40%)' }}>
                    {todoItems.filter((_, idx) => !checkedTodos[`slack-${idx}`]).length} remaining
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {todoItems.map((todo, idx) => {
                    const key = `slack-${idx}`
                    const checked = !!checkedTodos[key]
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border transition-all duration-200" style={{ background: checked ? 'hsl(40, 20%, 92%)' : 'hsl(40, 30%, 96%)', borderColor: 'hsl(35, 25%, 87%)', opacity: checked ? 0.7 : 1 }}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => onToggleTodo(key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${checked ? 'line-through' : ''}`} style={{ color: 'hsl(30, 25%, 18%)', lineHeight: '1.65' }}>
                            {todo?.task ?? ''}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs px-2 py-0.5" style={{ borderColor: 'hsl(290, 50%, 75%)', color: 'hsl(290, 50%, 40%)', fontSize: '10px' }}>
                              {todo?.source_channel ?? 'Unknown'}
                            </Badge>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: getPriorityBg(todo?.priority ?? ''), color: getPriorityColor(todo?.priority ?? '') }}>
                              {(todo?.priority ?? 'medium').charAt(0).toUpperCase() + (todo?.priority ?? 'medium').slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// --- Calendar Section ---
function CalendarSection({
  data,
  loading,
  error,
  onFetch,
  onRetry,
  checkedTodos,
  onToggleTodo,
  sampleMode,
}: {
  data: CalendarResponse | null
  loading: boolean
  error: string | null
  onFetch: (query: string, daysAhead: number) => void
  onRetry: () => void
  checkedTodos: Record<string, boolean>
  onToggleTodo: (key: string) => void
  sampleMode: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [daysAhead, setDaysAhead] = useState(7)
  const [summaryOpen, setSummaryOpen] = useState(true)

  const displayData = sampleMode ? SAMPLE_CALENDAR : data
  const summaryItems = Array.isArray(displayData?.summary) ? displayData.summary : []
  const todoItems = Array.isArray(displayData?.todos) ? displayData.todos : []
  const conflictItems = Array.isArray(displayData?.conflicts) ? displayData.conflicts : []
  const totalAnalyzed = displayData?.total_events_analyzed ?? 0
  const responseMessage = displayData?.message ?? ''

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: 'hsl(180, 35%, 92%)' }}>
          <HiOutlineCalendar className="w-6 h-6" style={{ color: 'hsl(180, 35%, 45%)' }} />
        </div>
        <div>
          <h2 className="text-xl font-semibold font-sans" style={{ color: 'hsl(30, 25%, 18%)' }}>Calendar</h2>
          <p className="text-xs" style={{ color: 'hsl(30, 15%, 45%)' }}>Review your schedule</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={{ color: 'hsl(30, 15%, 45%)' }}>Search filter</Label>
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} />
              <Input
                placeholder="e.g., standup, review meeting"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 text-sm"
                style={{ borderColor: 'hsl(35, 20%, 75%)', background: 'hsl(40, 30%, 96%)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FiX className="w-3.5 h-3.5" style={{ color: 'hsl(30, 15%, 45%)' }} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={{ color: 'hsl(30, 15%, 45%)' }}>Days ahead</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value) || 7)}
              className="text-sm w-24"
              style={{ borderColor: 'hsl(35, 20%, 75%)', background: 'hsl(40, 30%, 96%)' }}
            />
          </div>
          <Button
            onClick={() => onFetch(searchQuery, daysAhead)}
            disabled={loading}
            className="w-full font-medium text-sm shadow-md"
            style={{ background: 'hsl(180, 35%, 40%)', color: 'hsl(40, 30%, 98%)' }}
          >
            {loading ? (
              <span className="flex items-center gap-2"><FiLoader className="w-4 h-4 animate-spin" /> Analyzing...</span>
            ) : (
              <span className="flex items-center gap-2"><HiOutlineCalendar className="w-4 h-4" /> Summarize Calendar</span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
            <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
            <SummarySkeleton />
          </Card>
          <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
            <CardHeader className="pb-2"><Skeleton className="h-5 w-32" /></CardHeader>
            <TodoSkeleton />
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card style={{ background: 'hsl(0, 65%, 97%)', borderColor: 'hsl(0, 65%, 85%)' }} className="shadow-md border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HiOutlineExclamationCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(0, 65%, 50%)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'hsl(0, 65%, 40%)' }}>Failed to fetch Calendar summary</p>
                <p className="text-xs mt-1" style={{ color: 'hsl(0, 40%, 50%)' }}>{error}</p>
                <Button onClick={onRetry} variant="outline" size="sm" className="mt-3 text-xs" style={{ borderColor: 'hsl(0, 65%, 75%)', color: 'hsl(0, 65%, 45%)' }}>
                  Try again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && !displayData && (
        <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="p-4 rounded-full mb-4" style={{ background: 'hsl(40, 25%, 90%)' }}>
              <HiOutlineCalendar className="w-10 h-10" style={{ color: 'hsl(30, 15%, 45%)' }} />
            </div>
            <p className="font-medium text-sm" style={{ color: 'hsl(30, 25%, 18%)' }}>Click Summarize Calendar to review your schedule</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(30, 15%, 45%)' }}>Event summaries, conflicts, and action items will appear here</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && displayData && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {totalAnalyzed > 0 && (
              <Badge variant="secondary" className="text-xs font-medium px-3 py-1" style={{ background: 'hsl(40, 25%, 90%)', color: 'hsl(30, 25%, 18%)' }}>
                {totalAnalyzed} events analyzed
              </Badge>
            )}
            {responseMessage && (
              <span className="text-xs" style={{ color: 'hsl(30, 15%, 45%)' }}>{responseMessage}</span>
            )}
          </div>

          {/* Conflicts Warning Card */}
          {conflictItems.length > 0 && (
            <Card className="shadow-md border" style={{ background: 'hsl(35, 85%, 93%)', borderColor: 'hsl(35, 60%, 70%)' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <HiOutlineExclamation className="w-4 h-4" style={{ color: 'hsl(35, 85%, 40%)' }} />
                  <CardTitle className="text-sm font-semibold" style={{ color: 'hsl(35, 85%, 40%)' }}>Scheduling Conflicts</CardTitle>
                  <Badge variant="secondary" className="text-xs" style={{ background: 'hsl(35, 85%, 85%)', color: 'hsl(35, 85%, 30%)' }}>
                    {conflictItems.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {conflictItems.map((conflict, idx) => (
                    <div key={idx} className="p-3 rounded-lg border" style={{ background: 'hsl(35, 85%, 97%)', borderColor: 'hsl(35, 60%, 80%)' }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'hsl(35, 85%, 85%)', color: 'hsl(35, 85%, 30%)' }}>
                          {conflict?.event_1 ?? 'Event 1'}
                        </span>
                        <span className="text-xs" style={{ color: 'hsl(35, 85%, 40%)' }}>vs</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'hsl(35, 85%, 85%)', color: 'hsl(35, 85%, 30%)' }}>
                          {conflict?.event_2 ?? 'Event 2'}
                        </span>
                      </div>
                      <p className="text-xs mt-1.5 font-medium" style={{ color: 'hsl(35, 85%, 35%)' }}>
                        Overlap: {conflict?.conflict_time ?? 'Unknown time'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Card */}
          {summaryItems.length > 0 && (
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="w-4 h-4" style={{ color: 'hsl(180, 35%, 45%)' }} />
                        <CardTitle className="text-sm font-semibold" style={{ color: 'hsl(30, 25%, 18%)' }}>Event Summaries</CardTitle>
                        <Badge variant="secondary" className="text-xs" style={{ background: 'hsl(180, 35%, 92%)', color: 'hsl(180, 35%, 35%)' }}>
                          {summaryItems.length}
                        </Badge>
                      </div>
                      {summaryOpen ? <HiOutlineChevronUp className="w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} /> : <HiOutlineChevronDown className="w-4 h-4" style={{ color: 'hsl(30, 15%, 45%)' }} />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-3">
                        {summaryItems.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg border" style={{ background: 'hsl(40, 30%, 96%)', borderColor: 'hsl(35, 25%, 87%)' }}>
                            <p className="text-sm font-semibold leading-tight mb-1" style={{ color: 'hsl(30, 25%, 18%)' }}>
                              {item?.event_title ?? 'Untitled Event'}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-xs font-medium" style={{ color: 'hsl(180, 35%, 40%)' }}>
                                {item?.date_time ?? ''}
                              </span>
                              {item?.duration && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ borderColor: 'hsl(180, 35%, 75%)', color: 'hsl(180, 35%, 40%)', fontSize: '10px' }}>
                                  {item.duration}
                                </Badge>
                              )}
                            </div>
                            {item?.attendees && (
                              <p className="text-xs mb-1.5" style={{ color: 'hsl(30, 15%, 45%)' }}>
                                Attendees: {item.attendees}
                              </p>
                            )}
                            <p className="text-xs leading-relaxed" style={{ color: 'hsl(30, 15%, 35%)', lineHeight: '1.65' }}>{item?.gist ?? ''}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Todo Checklist */}
          {todoItems.length > 0 && (
            <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4" style={{ color: 'hsl(180, 35%, 40%)' }} />
                  <CardTitle className="text-sm font-semibold" style={{ color: 'hsl(30, 25%, 18%)' }}>Action Items</CardTitle>
                  <Badge variant="secondary" className="text-xs" style={{ background: 'hsl(180, 35%, 92%)', color: 'hsl(180, 35%, 35%)' }}>
                    {todoItems.filter((_, idx) => !checkedTodos[`calendar-${idx}`]).length} remaining
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {todoItems.map((todo, idx) => {
                    const key = `calendar-${idx}`
                    const checked = !!checkedTodos[key]
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border transition-all duration-200" style={{ background: checked ? 'hsl(40, 20%, 92%)' : 'hsl(40, 30%, 96%)', borderColor: 'hsl(35, 25%, 87%)', opacity: checked ? 0.7 : 1 }}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => onToggleTodo(key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${checked ? 'line-through' : ''}`} style={{ color: 'hsl(30, 25%, 18%)', lineHeight: '1.65' }}>
                            {todo?.task ?? ''}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs px-2 py-0.5" style={{ borderColor: 'hsl(180, 35%, 75%)', color: 'hsl(180, 35%, 40%)', fontSize: '10px' }}>
                              {todo?.source_event ?? 'Unknown'}
                            </Badge>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: getPriorityBg(todo?.priority ?? ''), color: getPriorityColor(todo?.priority ?? '') }}>
                              {(todo?.priority ?? 'medium').charAt(0).toUpperCase() + (todo?.priority ?? 'medium').slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// --- Agent Status ---
function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: GMAIL_AGENT_ID, name: 'Gmail Summary Agent', desc: 'Fetches and summarizes recent emails', icon: HiOutlineMail, color: 'hsl(0, 65%, 50%)' },
    { id: SLACK_AGENT_ID, name: 'Slack Summary Agent', desc: 'Summarizes Slack channel conversations', icon: FaSlack, color: 'hsl(290, 50%, 45%)' },
    { id: CALENDAR_AGENT_ID, name: 'Calendar Summary Agent', desc: 'Summarizes Google Calendar events', icon: HiOutlineCalendar, color: 'hsl(180, 35%, 45%)' },
  ]

  return (
    <Card style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }} className="shadow-md border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FiActivity className="w-4 h-4" style={{ color: 'hsl(25, 55%, 40%)' }} />
          <CardTitle className="text-sm font-semibold" style={{ color: 'hsl(30, 25%, 18%)' }}>Agents</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="flex flex-col sm:flex-row sm:gap-4 gap-2">
          {agents.map((agent) => {
            const isActive = activeAgentId === agent.id
            const IconComponent = agent.icon
            return (
              <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg flex-1" style={{ background: isActive ? 'hsl(40, 25%, 90%)' : 'transparent' }}>
                <div className="relative">
                  <IconComponent className="w-4 h-4" style={{ color: agent.color }} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: isActive ? 'hsl(140, 60%, 45%)' : 'hsl(40, 20%, 75%)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'hsl(30, 25%, 18%)' }}>{agent.name}</p>
                  <p className="text-xs truncate" style={{ color: 'hsl(30, 15%, 45%)', fontSize: '10px' }}>{agent.desc}</p>
                </div>
                {isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: 'hsl(140, 50%, 93%)', color: 'hsl(140, 60%, 35%)', fontSize: '10px' }}>
                    Active
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// === MAIN PAGE ===
export default function Page() {
  // Gmail state
  const [gmailData, setGmailData] = useState<GmailResponse | null>(null)
  const [gmailLoading, setGmailLoading] = useState(false)
  const [gmailError, setGmailError] = useState<string | null>(null)
  const [gmailLastQuery, setGmailLastQuery] = useState({ query: '', maxEmails: 20 })

  // Slack state
  const [slackData, setSlackData] = useState<SlackResponse | null>(null)
  const [slackLoading, setSlackLoading] = useState(false)
  const [slackError, setSlackError] = useState<string | null>(null)
  const [slackLastQuery, setSlackLastQuery] = useState({ channels: '', messageCount: 50 })

  // Calendar state
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [calendarLastQuery, setCalendarLastQuery] = useState({ query: '', daysAhead: 7 })

  // Shared state
  const [checkedTodos, setCheckedTodos] = useState<Record<string, boolean>>({})
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sampleMode, setSampleMode] = useState(false)

  const toggleTodo = useCallback((key: string) => {
    setCheckedTodos(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Gmail fetch
  const fetchGmail = useCallback(async (searchQuery: string, maxEmails: number) => {
    setGmailLoading(true)
    setGmailError(null)
    setActiveAgentId(GMAIL_AGENT_ID)
    setGmailLastQuery({ query: searchQuery, maxEmails })

    try {
      const message = `Fetch and summarize my recent emails.${searchQuery ? ' Search filter: ' + searchQuery : ''} Max results: ${maxEmails}`
      const result = await callAIAgent(message, GMAIL_AGENT_ID)

      if (result?.success) {
        const data = extractAgentData(result)
        setGmailData(data as GmailResponse)
      } else {
        setGmailError(result?.error ?? result?.response?.message ?? 'Failed to fetch Gmail summary')
      }
    } catch (err) {
      setGmailError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setGmailLoading(false)
      setActiveAgentId(null)
    }
  }, [])

  const retryGmail = useCallback(() => {
    fetchGmail(gmailLastQuery.query, gmailLastQuery.maxEmails)
  }, [fetchGmail, gmailLastQuery])

  // Slack fetch
  const fetchSlack = useCallback(async (channels: string, messageCount: number) => {
    setSlackLoading(true)
    setSlackError(null)
    setActiveAgentId(SLACK_AGENT_ID)
    setSlackLastQuery({ channels, messageCount })

    try {
      const message = `Summarize recent Slack conversations.${channels ? ' Channels: ' + channels : ' Analyze the most active channels.'} Messages per channel: ${messageCount}`
      const result = await callAIAgent(message, SLACK_AGENT_ID)

      if (result?.success) {
        const data = extractAgentData(result)
        setSlackData(data as SlackResponse)
      } else {
        setSlackError(result?.error ?? result?.response?.message ?? 'Failed to fetch Slack summary')
      }
    } catch (err) {
      setSlackError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setSlackLoading(false)
      setActiveAgentId(null)
    }
  }, [])

  const retrySlack = useCallback(() => {
    fetchSlack(slackLastQuery.channels, slackLastQuery.messageCount)
  }, [fetchSlack, slackLastQuery])

  // Calendar fetch
  const fetchCalendar = useCallback(async (searchQuery: string, daysAhead: number) => {
    setCalendarLoading(true)
    setCalendarError(null)
    setActiveAgentId(CALENDAR_AGENT_ID)
    setCalendarLastQuery({ query: searchQuery, daysAhead })

    try {
      const message = `Summarize my Google Calendar events.${searchQuery ? ' Search filter: ' + searchQuery : ''} Look ahead ${daysAhead} days from today.`
      const result = await callAIAgent(message, CALENDAR_AGENT_ID)

      if (result?.success) {
        const data = extractAgentData(result)
        setCalendarData(data as CalendarResponse)
      } else {
        setCalendarError(result?.error ?? result?.response?.message ?? 'Failed to fetch Calendar summary')
      }
    } catch (err) {
      setCalendarError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setCalendarLoading(false)
      setActiveAgentId(null)
    }
  }, [])

  const retryCalendar = useCallback(() => {
    fetchCalendar(calendarLastQuery.query, calendarLastQuery.daysAhead)
  }, [fetchCalendar, calendarLastQuery])

  const anyLoading = gmailLoading || slackLoading || calendarLoading

  return (
    <ErrorBoundary>
      <div style={{ background: 'hsl(40, 30%, 96%)', color: 'hsl(30, 25%, 18%)' }} className="min-h-screen font-sans">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 border-b shadow-sm" style={{ background: 'hsl(40, 35%, 98%)', borderColor: 'hsl(35, 25%, 82%)' }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg shadow-sm" style={{ background: 'hsl(25, 55%, 40%)' }}>
                  <HiOutlineInbox className="w-6 h-6" style={{ color: 'hsl(40, 30%, 98%)' }} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'hsl(30, 25%, 18%)' }}>Inbox Intelligence Hub</h1>
                  <p className="text-xs hidden sm:block" style={{ color: 'hsl(30, 15%, 45%)' }}>AI-powered summaries for Gmail, Slack, and Calendar</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Sample Data Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-toggle" className="text-xs font-medium cursor-pointer hidden sm:inline" style={{ color: 'hsl(30, 15%, 45%)' }}>
                    Sample Data
                  </Label>
                  <Switch
                    id="sample-toggle"
                    checked={sampleMode}
                    onCheckedChange={setSampleMode}
                  />
                </div>
                {/* Refresh button */}
                <button
                  onClick={() => {
                    if (!gmailLoading && gmailData) retryGmail()
                    if (!slackLoading && slackData) retrySlack()
                    if (!calendarLoading && calendarData) retryCalendar()
                  }}
                  disabled={anyLoading}
                  className="p-2 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-40"
                  style={{ background: 'hsl(40, 25%, 90%)' }}
                  title="Refresh all"
                >
                  <HiOutlineRefresh className={`w-5 h-5 ${anyLoading ? 'animate-spin' : ''}`} style={{ color: 'hsl(25, 55%, 40%)' }} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Column 1: Gmail */}
            <GmailSection
              data={gmailData}
              loading={gmailLoading}
              error={gmailError}
              onFetch={fetchGmail}
              onRetry={retryGmail}
              checkedTodos={checkedTodos}
              onToggleTodo={toggleTodo}
              sampleMode={sampleMode}
            />

            {/* Column 2: Slack */}
            <SlackSection
              data={slackData}
              loading={slackLoading}
              error={slackError}
              onFetch={fetchSlack}
              onRetry={retrySlack}
              checkedTodos={checkedTodos}
              onToggleTodo={toggleTodo}
              sampleMode={sampleMode}
            />

            {/* Column 3: Calendar */}
            <CalendarSection
              data={calendarData}
              loading={calendarLoading}
              error={calendarError}
              onFetch={fetchCalendar}
              onRetry={retryCalendar}
              checkedTodos={checkedTodos}
              onToggleTodo={toggleTodo}
              sampleMode={sampleMode}
            />
          </div>

          {/* Agent Status Panel */}
          <div className="mt-8 max-w-2xl mx-auto">
            <AgentStatusPanel activeAgentId={activeAgentId} />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t py-4 mt-8" style={{ borderColor: 'hsl(35, 25%, 82%)' }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs" style={{ color: 'hsl(30, 15%, 45%)' }}>
              Inbox Intelligence Hub — Powered by AI agents
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
