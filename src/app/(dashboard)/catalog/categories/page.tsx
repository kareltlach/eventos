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
  Tag, 
  ChevronRight,
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

interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: ""
  })

  const supabase = createClient()

  const fetchCategories = useCallback(async () => {
    setLoading(true)
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
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/--+/g, '-')
  }

  const resetForm = () => {
    setFormData({ name: "" })
    setIsDialogOpen(false)
    setEditingId(null)
  }

  const startEdit = (cat: Category) => {
    setFormData({ name: cat.name })
    setEditingId(cat.id)
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      toast.error("Category name is required")
      return
    }
    
    setIsSaving(true)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .single()

      if (!profile?.org_id) throw new Error("Organization not found")

      if (editingId) {
        const { error } = await supabase
          .from("product_categories")
          .update({ name: trimmedName })
          .eq("id", editingId)

        if (error) throw error
        toast.success("Category updated")
      } else {
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
        toast.success("Category created successfully")
      }
      
      resetForm()
      fetchCategories()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Category removed")
      fetchCategories()
    } catch (err) {
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
              Taxonomy
            </Badge>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">•</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{categories.length} Groups</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Product Categories</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Organize your offerings into meaningful groups.</p>
        </div>
        <div className="flex items-center gap-2">
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger render={
              <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 shadow-lg shadow-primary/10">
                <Plus className="w-3 h-3" /> New Category
              </Button>
            } />
            <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">{editingId ? 'Edit Category' : 'Create Category'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category Name</label>
                  <Input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    placeholder="e.g. Audio Equipment"
                    className="h-9 px-3 text-sm border-border/50 bg-background/50"
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={isSaving} className="w-full text-xs font-bold uppercase tracking-widest h-10 shadow-lg shadow-primary/20">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Save Changes' : 'Add Category')}
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
              placeholder="Filter by name or slug..." 
              className="pl-6 bg-transparent border-none text-[11px] placeholder:text-muted-foreground/40 focus:ring-0 w-full outline-none text-foreground font-medium"
            />
          </div>
          <div className="h-4 w-[1px] bg-border/30" />
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1.5">
            <Filter className="w-3 h-3" /> Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tighter text-right">Alphabetical</span>
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
           <Loader2 className="w-6 h-6 animate-spin text-primary" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Mapping Taxonomy</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Classification Name</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Identification Slug</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Created</TableHead>
                <TableHead className="h-10 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((cat) => (
                <TableRow key={cat.id} className="group border-border/30 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-foreground tracking-tight">{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <code className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/30">
                      {cat.slug}
                    </code>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <span className="text-xs font-medium text-muted-foreground/60">
                      {new Date(cat.created_at).toLocaleDateString()}
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
                          <DropdownMenuItem onClick={() => startEdit(cat)} className="text-xs font-semibold gap-2 py-2">
                            <Edit2 className="w-3 h-3" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(cat.id)} className="text-xs font-semibold gap-2 py-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer">
                            <Trash2 className="w-3 h-3" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCategories.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/30">
                <Tag className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground">No categories found</h4>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto opacity-70">
                  You haven't defined any groups yet. Start clustering your items now.
                </p>
              </div>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                variant="outline" 
                size="sm"
                className="mt-2 border-border/50 text-xs font-bold uppercase tracking-widest h-9 px-6 rounded-md"
              >
                Create Group
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
