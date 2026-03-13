"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Trash2, Edit2, Loader2, Search, Check, X, Ruler } from "lucide-react"

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSymbol, setNewSymbol] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editSymbol, setEditSymbol] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchUnits()
  }, [])

  async function fetchUnits() {
    try {
      const { data, error } = await supabase
        .from("unit_types")
        .select("*")
        .order("name")
      
      if (error) throw error
      setUnits(data || [])
    } catch (err: any) {
      toast.error("Failed to load units")
    } finally {
      setLoading(false)
    }
  }

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleAdd() {
    if (!newName.trim() || !newSymbol.trim()) {
      toast.error("Please fill in both name and symbol")
      return
    }
    
    setIsSaving(true)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .single()

      const { error } = await supabase
        .from("unit_types")
        .insert({
          name: newName.trim(),
          symbol: newSymbol.trim(),
          org_id: profile?.org_id
        })

      if (error) throw error
      
      toast.success("Unit type added")
      setNewName("")
      setNewSymbol("")
      setIsAdding(false)
      fetchUnits()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim() || !editSymbol.trim()) {
      toast.error("Name and symbol cannot be empty")
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("unit_types")
        .update({ 
          name: editName.trim(),
          symbol: editSymbol.trim()
        })
        .eq("id", id)

      if (error) throw error
      
      toast.success("Unit updated")
      setEditingId(null)
      fetchUnits()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this unit type?")) return

    try {
      const { error } = await supabase
        .from("unit_types")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Unit deleted")
      fetchUnits()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search units..." 
            className="pl-10 bg-white/5 border-white/10 focus:bg-white/10 text-white w-full"
          />
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="bg-white text-black hover:bg-zinc-200 gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Unit
        </Button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-end md:items-center gap-4 animate-in fade-in slide-in-from-top-4 border-white/20">
          <div className="flex-1 w-full flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Unit Name</label>
            <Input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Kilogram"
              className="bg-zinc-900 border-white/10 text-white h-11"
              autoFocus
            />
          </div>
          <div className="w-full md:w-32 flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Symbol</label>
            <Input 
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Ex: kg"
              className="bg-zinc-900 border-white/10 text-white h-11"
            />
          </div>
          <div className="flex items-center gap-2 pt-2 md:pt-6">
            <Button onClick={handleAdd} disabled={isSaving} className="min-w-[80px]">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Unit"}
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUnits.map((unit) => (
            <div key={unit.id} className="glass-card p-6 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all min-h-[100px] border-white/5 hover:border-white/10">
              {editingId === unit.id ? (
                <div className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col gap-2">
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-zinc-900 border-white/10 text-white h-9 w-full"
                      placeholder="Name"
                      autoFocus
                    />
                    <Input 
                      value={editSymbol}
                      onChange={(e) => setEditSymbol(e.target.value)}
                      className="bg-zinc-900 border-white/10 text-white h-9 w-full"
                      placeholder="Symbol"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-green-400 hover:bg-green-400/10 h-8 font-medium" 
                      onClick={() => handleSaveEdit(unit.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-zinc-400 hover:bg-white/10 h-8 font-medium" 
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Ruler className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white tracking-tight">{unit.name}</span>
                      <span className="text-zinc-500 text-sm font-mono">{unit.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                      onClick={() => {
                        setEditingId(unit.id)
                        setEditName(unit.name)
                        setEditSymbol(unit.symbol)
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(unit.id)}
                      className="h-8 w-8 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {filteredUnits.length === 0 && !isAdding && (
            <div className="col-span-full py-20 text-center glass-card rounded-2xl border-dashed border-white/5 flex flex-col items-center gap-3">
              <Search className="w-8 h-8 text-zinc-700" />
              <p className="text-zinc-500 font-medium">
                {searchQuery ? `No results found for "${searchQuery}"` : "You haven't added any unit types yet."}
              </p>
              {!searchQuery && (
                <Button variant="outline" onClick={() => setIsAdding(true)} className="mt-2 border-white/10 hover:bg-white/5">
                  Add Your First Unit
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
