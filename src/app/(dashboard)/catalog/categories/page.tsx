"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Trash2, Edit2, Loader2, Search, Check, X, Tag } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newName, setNewName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const supabase = createClient()

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("name")
      
      if (error) throw error
      setCategories((data as Category[]) || [])
    } catch {
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const generateSlug = (text: string) => {
    return text
      .normalize("NFD") // Split characters from their accents
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
  }

  async function handleAdd() {
    const trimmedName = newName.trim()
    if (!trimmedName) {
      toast.error("Category name cannot be empty")
      return
    }
    
    setIsSaving(true)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .single()

      if (!profile?.org_id) throw new Error("Organization not found")

      const baseSlug = generateSlug(trimmedName)
      const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`
      
      const { error } = await supabase
        .from("product_categories")
        .insert({
          name: trimmedName,
          slug,
          org_id: profile.org_id
        })

      if (error) throw error
      
      toast.success("Category added successfully")
      setNewName("")
      setIsAdding(false)
      fetchCategories()
    } catch (err) {
      const error = err as Error
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveEdit(id: string) {
    const trimmedName = editName.trim()
    if (!trimmedName) {
      toast.error("Category name cannot be empty")
      return
    }

    setIsSaving(true)
    try {
      // We only update the slug if the name changed significantly, 
      // but for stability we'll keep the original slug if possible.
      // However, if the user really wants to change it, we can generate a new one.
      // Usually, just updating the name is enough.
      
      const { error } = await supabase
        .from("product_categories")
        .update({ 
          name: trimmedName
          // Keeping the original slug for link stability
        })
        .eq("id", id)

      if (error) throw error
      
      toast.success("Category updated")
      setEditingId(null)
      fetchCategories()
    } catch (err) {
      const error = err as Error
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure? This will remove the category from all associated products.")) return

    try {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Category deleted")
      fetchCategories()
    } catch (err) {
      const error = err as Error
      toast.error(error.message)
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
            placeholder="Search categories..." 
            className="pl-10 bg-white/5 border-white/10 focus:bg-white/10 text-white w-full"
          />
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="bg-white text-black hover:bg-zinc-200 gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-end md:items-center gap-4 animate-in fade-in slide-in-from-top-4 border-white/20">
          <div className="flex-1 w-full flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Category Name</label>
            <Input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Mobiliário ou Som Profissional"
              className="bg-zinc-900 border-white/10 text-white h-11"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 pt-2 md:pt-6">
            <Button onClick={handleAdd} disabled={isSaving} className="min-w-[120px]">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Category"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="glass-card p-6 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all min-h-[100px] border-white/5 hover:border-white/10">
              {editingId === cat.id ? (
                <div className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                  <Input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-zinc-900 border-white/10 text-white h-9 w-full"
                    placeholder="Category Name"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-green-400 hover:bg-green-400/10 h-8 font-medium" 
                      onClick={() => handleSaveEdit(cat.id)}
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
                      <Tag className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white tracking-tight text-lg">{cat.name}</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{cat.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                      onClick={() => {
                        setEditingId(cat.id)
                        setEditName(cat.name)
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(cat.id)}
                      className="h-8 w-8 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {filteredCategories.length === 0 && !isAdding && (
            <div className="col-span-full py-20 text-center glass-card rounded-2xl border-dashed border-white/5 flex flex-col items-center gap-3">
              <Search className="w-8 h-8 text-zinc-700" />
              <p className="text-zinc-500 font-medium">
                {searchQuery ? `Nenhuma categoria encontrada para "${searchQuery}"` : "Nenhuma categoria cadastrada ainda."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
