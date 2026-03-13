"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Plus, Search, Users, UserPlus, Mail, Phone, 
  Building2, Tag, CheckCircle2, XCircle, 
  MoreVertical, Edit2, Trash2, Filter
} from "lucide-react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { PageTransition } from "@/components/page-transition"

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
  
  // Form State
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

  useEffect(() => {
    fetchAttendees()
  }, [])

  async function fetchAttendees() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("attendees")
        .select("*")
        .order("full_name", { ascending: true })
      
      if (error) throw error
      setAttendees(data || [])
    } catch (err: any) {
      toast.error("Erro ao carregar participantes")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single()

      if (!profile?.org_id) throw new Error("Organização não encontrada")

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
        toast.success("Participante atualizado")
      } else {
        const { error } = await supabase
          .from("attendees")
          .insert([payload])
        
        if (error) throw error
        toast.success("Participante cadastrado")
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
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar participante")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este participante?")) return

    try {
      const { error } = await supabase
        .from("attendees")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      toast.success("Participante excluído")
      fetchAttendees()
    } catch (err: any) {
      toast.error("Erro ao excluir participante")
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

  const getStatusColor = (status: AttendeeStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'checked_in': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    }
  }

  const getTypeColor = (type: AttendeeType) => {
    switch (type) {
      case 'vip': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'speaker': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
      case 'staff': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      case 'vendor': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      default: return 'bg-white/5 text-zinc-400 border-white/10'
    }
  }

  return (
    <div className="flex flex-col gap-8 flex-1">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Attendees</h1>
        <p className="text-zinc-500">Manage your event participants, VIPs, and staff.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attendees..." 
            className="pl-10 bg-white/5 border-white/10 focus:bg-white/10 text-white w-full h-11 rounded-xl"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open: boolean) => {
          setIsDialogOpen(open)
          if (!open) {
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
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-zinc-200 gap-2 w-full sm:w-auto h-11 px-6 rounded-xl font-bold">
              <UserPlus className="w-4 h-4" /> Add Attendee
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10 text-white sm:max-w-lg rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {editingAttendee ? 'Edit Attendee' : 'New Attendee'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
                  <Input 
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="bg-white/5 border-white/10 focus:bg-white/10 h-11"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email</label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="bg-white/5 border-white/10 focus:bg-white/10 h-11"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Phone</label>
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+55 ..."
                    className="bg-white/5 border-white/10 focus:bg-white/10 h-11"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Company</label>
                  <Input 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Company name"
                    className="bg-white/5 border-white/10 focus:bg-white/10 h-11"
                  />
                </div>
                <div className="flex flex-col gap-2 text-black">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Type</label>
                  <Select 
                    value={formData.attendee_type} 
                    onValueChange={(val: any) => setFormData({...formData, attendee_type: val})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 focus:bg-white/10 h-11 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="speaker">Speaker</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 text-black">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Status</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val: any) => setFormData({...formData, status: val})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 focus:bg-white/10 h-11 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex-row gap-2 mt-4">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 text-zinc-500 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold"
                >
                  {editingAttendee ? 'Update Attendee' : 'Save Attendee'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-card rounded-[2rem] overflow-hidden border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    <th className="p-6">Name & Company</th>
                    <th className="p-6">Contact</th>
                    <th className="p-6">Type</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 w-[100px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAttendees.map((attendee) => (
                    <tr key={attendee.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-white tracking-tight text-base">
                            {attendee.full_name}
                          </span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" />
                            {attendee.company || 'Private'}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1 text-sm text-zinc-400">
                          <span className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-zinc-600" />
                            {attendee.email || '—'}
                          </span>
                          <span className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-zinc-600" />
                            {attendee.phone || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-zinc-400">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getTypeColor(attendee.attendee_type)}`}>
                          <Tag className="w-3.5 h-3.5" />
                          {attendee.attendee_type}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(attendee.status)}`}>
                          {attendee.status === 'checked_in' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                           attendee.status === 'cancelled' ? <XCircle className="w-3.5 h-3.5" /> : 
                           <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                          {attendee.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white rounded-xl p-1 w-40">
                              <DropdownMenuItem 
                                onClick={() => openEditDialog(attendee)}
                                className="gap-2 rounded-lg focus:bg-white/10"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(attendee.id)}
                                className="gap-2 rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAttendees.length === 0 && (
              <div className="py-24 text-center flex flex-col items-center gap-4 bg-white/[0.01]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Users className="w-8 h-8 text-zinc-700" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white font-bold text-lg">No attendees found</p>
                  <p className="text-zinc-500 max-w-xs mx-auto">Start adding participants to your event lists.</p>
                </div>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  variant="outline" 
                  className="mt-2 border-white/10 hover:bg-white/5 rounded-xl px-8"
                >
                  Create Attendee
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
