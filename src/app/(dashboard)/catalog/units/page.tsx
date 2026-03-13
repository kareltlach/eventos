"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Search, 
  Check, 
  X, 
  Ruler, 
  Filter, 
  ArrowUpDown, 
  MoreVertical 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface UnitType {
  id: string
  name: string
  symbol: string
  created_at: string
}

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    symbol: ""
  })

  const supabase = createClient()

  const fetchUnits = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("unit_types")
        .select("*")
        .order("name")
      
      if (error) throw error
      setUnits((data as UnitType[]) || [])
    } catch {
      toast.error("Failed to load unit types")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => {
    setFormData({ name: "", symbol: "" })
    setIsDialogOpen(false)
    setEditingId(null)
  }

  const startEdit = (unit: UnitType) => {
    setFormData({ name: unit.name, symbol: unit.symbol })
    setEditingId(unit.id)
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.symbol.trim()) {
      toast.error("Both name and symbol are required")
      return
    }
    
    setIsSaving(true)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .single()

      if (editingId) {
        const { error } = await supabase
          .from("unit_types")
          .update({ 
            name: formData.name.trim(),
            symbol: formData.symbol.trim()
          })
          .eq("id", editingId)

        if (error) throw error
        toast.success("Unit type updated")
      } else {
        const { error } = await supabase
          .from("unit_types")
          .insert({
            name: formData.name.trim(),
            symbol: formData.symbol.trim(),
            org_id: profile?.org_id as string
          })

        if (error) throw error
        toast.success("Unit type created successfully")
      }
      
      resetForm()
      fetchUnits()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("unit_types")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Unit type removed")
      fetchUnits()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="outline" className="px-1.5 py-0 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-widest text-[10px]">
              Metrics
            </Badge>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">•</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{units.length} Units</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Unit Types</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Define standard measurement units for your catalog items.</p>
        </div>
        <div className="flex items-center gap-2">
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger render={
              <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 shadow-lg shadow-primary/10">
                <Plus className="w-3 h-3" /> New Unit
              </Button>
            } />
            <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">{editingId ? 'Edit Unit Type' : 'Add Unit Type'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Standard Name</label>
                  <Input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kilograms or Hours"
                    className="h-9 px-3 text-sm border-border/50 bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Symbol / Abbreviation</label>
                  <Input 
                    required
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g. kg, h, pc"
                    className="h-9 px-3 text-sm border-border/50 bg-background/50"
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={isSaving} className="w-full text-xs font-bold uppercase tracking-widest h-10 shadow-lg shadow-primary/20">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Save Changes' : 'Create Unit')}
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
              placeholder="Filter by name or symbol..." 
              className="pl-6 bg-transparent border-none text-[11px] placeholder:text-muted-foreground/40 focus:ring-0 w-full outline-none text-foreground font-medium"
            />
          </div>
          <div className="h-4 w-[1px] bg-border/30" />
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1.5">
            <Filter className="w-3 h-3" /> Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tighter text-right">Reference Data</span>
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
           <Loader2 className="w-6 h-6 animate-spin text-primary" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Calibrating Units</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Unit Designation</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Symbol</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">System ID</TableHead>
                <TableHead className="h-10 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id} className="group border-border/30 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center border border-border/30">
                        <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-bold text-foreground tracking-tight">{unit.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <code className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                      {unit.symbol}
                    </code>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <span className="text-[9px] font-mono text-muted-foreground/40 uppercase">
                      {unit.id.split('-')[0]}...
                    </span>
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
                          <DropdownMenuItem onClick={() => startEdit(unit)} className="text-xs font-semibold gap-2 py-2">
                             <Edit2 className="w-3 h-3" /> Modify Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(unit.id)} className="text-xs font-semibold gap-2 py-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer">
                            <Trash2 className="w-3 h-3" /> Rescind Unit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUnits.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/30">
                <Ruler className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground">No units defined</h4>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto opacity-70">
                  Standardize your catalog measurements by adding your first unit type.
                </p>
              </div>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                variant="outline" 
                size="sm"
                className="mt-2 border-border/50 text-xs font-bold uppercase tracking-widest h-9 px-6 rounded-md"
              >
                Create Standard Unit
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
