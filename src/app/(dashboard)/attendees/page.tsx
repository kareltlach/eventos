"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Search, Users, UserPlus, Mail, Phone, 
  Building2, Tag, CheckCircle2, XCircle, 
  MoreVertical, Edit2, Trash2, Filter,
  ArrowUpDown, ChevronDown, Download
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog"
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type AttendeeType = "guest" | "vip" | "speaker" | "staff" | "vendor"
type AttendeeStatus = "pending" | "confirmed" | "cancelled" | "checked_in"

interface Attendee {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  company: string | null
  attendee_type: AttendeeType
  status: AttendeeStatus
  notes: string | null
  created_at: string
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    attendee_type: "guest" as AttendeeType,
    status: "pending" as AttendeeStatus,
    notes: ""
  })

  const supabase = createClient()

  const fetchAttendees = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("attendees")
        .select("*")
        .order("full_name", { ascending: true })
      
      if (error) throw error
      setAttendees(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load attendees")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAttendees()
  }, [fetchAttendees])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single()

      if (!profile?.org_id) throw new Error("Organization not found")

      const payload = {
        ...formData,
        org_id: profile.org_id
      }

      if (editingAttendee) {
        const { error } = await supabase
          .from("attendees")
          .update(payload)
          .eq("id", editingAttendee.id)
        
        if (error) throw error
        toast.success("Attendee updated successfully")
      } else {
        const { error } = await supabase
          .from("attendees")
          .insert([payload])
        
        if (error) throw error
        toast.success("Attendee registered successfully")
      }

      setIsDialogOpen(false)
      setEditingAttendee(null)
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        company: "",
        attendee_type: "guest",
        status: "pending",
        notes: ""
      })
      fetchAttendees()
    } catch (err) {
      toast.error((err as Error).message || "Error saving attendee")
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("attendees")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      toast.success("Attendee deleted")
      fetchAttendees()
    } catch {
      toast.error("Error deleting attendee")
    }
  }

  const openEditDialog = (attendee: Attendee) => {
    setEditingAttendee(attendee)
    setFormData({
      full_name: attendee.full_name,
      email: attendee.email || "",
      phone: attendee.phone || "",
      company: attendee.company || "",
      attendee_type: attendee.attendee_type,
      status: attendee.status,
      notes: attendee.notes || ""
    })
    setIsDialogOpen(true)
  }

  const filteredAttendees = attendees.filter(a => 
    a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusStyles = (status: AttendeeStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'checked_in': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    }
  }

  const getTypeStyles = (type: AttendeeType) => {
    switch (type) {
      case 'vip': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'speaker': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'staff': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      case 'vendor': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      default: return 'bg-white/5 text-zinc-400 border-white/10'
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="outline" className="px-1.5 py-0 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-widest text-[10px]">
              CRM
            </Badge>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">•</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{attendees.length} Total</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendees</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Manage your event participants and guest lists with precision.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-border/50 gap-2">
            <Download className="w-3 h-3" /> Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingAttendee(null)
          }}>
            <DialogTrigger render={
              <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 shadow-lg shadow-primary/10">
                <UserPlus className="w-3 h-3" /> Add Attendee
              </Button>
            } />
            <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">{editingAttendee ? 'Edit Attendee' : 'New Attendee'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <Input 
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="John Doe"
                    className="h-9 px-3 text-sm border-border/50 bg-background/50 focus:bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com"
                      className="h-9 px-3 text-sm border-border/50 bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1..."
                      className="h-9 px-3 text-sm border-border/50 bg-background/50"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company</label>
                  <Input 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Acme Inc."
                    className="h-9 px-3 text-sm border-border/50 bg-background/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</label>
                    <Select 
                      value={formData.attendee_type} 
                      onValueChange={(val) => setFormData({...formData, attendee_type: val as AttendeeType})}
                    >
                      <SelectTrigger className="h-9 border-border/50 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest">Guest</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="speaker">Speaker</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(val) => setFormData({...formData, status: val as AttendeeStatus})}
                    >
                      <SelectTrigger className="h-9 border-border/50 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="checked_in">Checked In</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" className="w-full text-xs font-bold uppercase tracking-widest h-10 shadow-lg shadow-primary/20">
                    {editingAttendee ? 'Update Profile' : 'Create Attendee'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 h-10 px-1 border-b border-border/20">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-[300px]">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or company..." 
              className="pl-6 bg-transparent border-none text-[11px] placeholder:text-muted-foreground/40 focus:ring-0 w-full outline-none text-foreground font-medium"
            />
          </div>
          <div className="h-4 w-[1px] bg-border/30" />
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1.5">
            <Filter className="w-3 h-3" /> Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tighter">Sorted by Name</span>
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
           <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Synchronizing</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Attendee</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Company</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Category</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Status</TableHead>
                <TableHead className="h-10 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendees.map((attendee) => (
                <TableRow key={attendee.id} className="group border-border/30 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground tracking-tight">{attendee.full_name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 opacity-60">
                         {attendee.email || <span className="italic">No email provided</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-muted/30 flex items-center justify-center border border-border/30">
                        <Building2 className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground/80">{attendee.company || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <Badge variant="outline" className={cn(
                      "text-[9px] h-5 font-bold uppercase tracking-[0.05em] rounded-md border-transparent ring-1 ring-inset",
                      getTypeStyles(attendee.attendee_type)
                    )}>
                      {attendee.attendee_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide",
                      getStatusStyles(attendee.status)
                    )}>
                       {attendee.status === 'checked_in' ? <CheckCircle2 className="w-2.5 h-2.5" /> : 
                        attendee.status === 'cancelled' ? <XCircle className="w-2.5 h-2.5" /> : 
                        <div className="w-1 h-1 rounded-full bg-current" />}
                       {attendee.status?.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        } />
                         <DropdownMenuContent align="end" className="w-40 border-border/50 bg-card/95 backdrop-blur-xl">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(attendee)} className="text-xs font-semibold gap-2 py-2">
                              <Edit2 className="w-3 h-3" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(attendee.id)} className="text-xs font-semibold gap-2 py-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer">
                              <Trash2 className="w-3 h-3" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredAttendees.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground/30" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground">No attendees found</h4>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto opacity-70">
                  We couldn't find any results matching your current search criteria.
                </p>
              </div>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                variant="outline" 
                size="sm"
                className="mt-2 border-border/50 text-xs font-bold uppercase tracking-widest h-9 px-6 rounded-md"
              >
                Create Attendee
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
