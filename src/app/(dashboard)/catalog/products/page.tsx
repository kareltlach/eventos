"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Plus, 
  Search, 
  Loader2, 
  Edit2, 
  Trash2, 
  X, 
  Filter, 
  ArrowUpDown, 
  Package, 
  MoreVertical,
  ChevronDown,
  LayoutGrid,
  List
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  category_id: string | null
  unit_type_id: string | null
  product_categories: { name: string } | null
  unit_types: { symbol: string } | null
}

interface Category {
  id: string
  name: string
}

interface UnitType {
  id: string
  name: string
  symbol: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<UnitType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    category_id: "",
    unit_type_id: ""
  })

  const supabase = createClient()

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_categories?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes, unitsRes] = await Promise.all([
        supabase
          .from("products")
          .select(`
            *,
            product_categories (name),
            unit_types (symbol)
          `)
          .order("name"),
        supabase.from("product_categories").select("*").order("name"),
        supabase.from("unit_types").select("*").order("name")
      ])

      if (productsRes.error) throw productsRes.error
      setProducts((productsRes.data as Product[]) || [])
      setCategories((categoriesRes.data as Category[]) || [])
      setUnits((unitsRes.data as UnitType[]) || [])
    } catch {
      toast.error("Failed to load catalog data")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const resetForm = () => {
    setFormData({ name: "", description: "", base_price: "", category_id: "", unit_type_id: "" })
    setIsDialogOpen(false)
    setEditingId(null)
  }

  const startEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      base_price: product.base_price.toString(),
      category_id: product.category_id || "",
      unit_type_id: product.unit_type_id || ""
    })
    setEditingId(product.id)
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return
    
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .single()

      const payload = {
        name: formData.name,
        description: formData.description || null,
        base_price: parseFloat(formData.base_price) || 0,
        category_id: formData.category_id || null,
        unit_type_id: formData.unit_type_id || null,
        org_id: profile?.org_id as string
      }

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId)
        if (error) throw error
        toast.success("Product updated successfully")
      } else {
        const { error } = await supabase
          .from("products")
          .insert(payload)
        if (error) throw error
        toast.success("Product added to catalog")
      }
      
      resetForm()
      fetchInitialData()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Product removed")
      fetchInitialData()
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
              Inventory
            </Badge>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">•</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{products.length} Items</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Catalog Products</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Manage your inventory of services and equipment.</p>
        </div>
        <div className="flex items-center gap-2">
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger render={
              <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 shadow-lg shadow-primary/10">
                <Plus className="w-3 h-3" /> New Product
              </Button>
            } />
            <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Name</label>
                  <Input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="LED Panel P2.5"
                    className="h-9 px-3 text-sm border-border/50 bg-background/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Base Price</label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                      placeholder="0.00"
                      className="h-9 px-3 text-sm border-border/50 bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unit</label>
                      <Select 
                        value={formData.unit_type_id || undefined} 
                        onValueChange={(val) => setFormData({...formData, unit_type_id: val as string})}
                      >
                      <SelectTrigger className="h-9 border-border/50 bg-background/50">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                  <Select 
                    value={formData.category_id || undefined} 
                    onValueChange={(val) => setFormData({...formData, category_id: val as string})}
                  >
                    <SelectTrigger className="h-9 border-border/50 bg-background/50">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Technical specifications and details..."
                    className="flex min-h-[80px] w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" className="w-full text-xs font-bold uppercase tracking-widest h-10 shadow-lg shadow-primary/20">
                    {editingId ? 'Save Changes' : 'Add to Catalog'}
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
              placeholder="Search by name, description or category..." 
              className="pl-6 bg-transparent border-none text-[11px] placeholder:text-muted-foreground/40 focus:ring-0 w-full outline-none text-foreground font-medium"
            />
          </div>
          <div className="h-4 w-[1px] bg-border/30" />
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1.5">
            <Filter className="w-3 h-3" /> Filter
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary bg-primary/10 rounded-md">
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 rounded-md">
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
           <Loader2 className="w-6 h-6 animate-spin text-primary" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Scanning Catalog</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6 font-mono">Item SKU / Name</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Classification</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6 text-right">Standard Rate</TableHead>
                <TableHead className="h-10 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((prod) => (
                <TableRow key={prod.id} className="group border-border/30 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground tracking-tight">{prod.name}</span>
                      <span className="text-[10px] text-muted-foreground/60 line-clamp-1 max-w-[400px]">
                        {prod.description || 'No detailed specifications.'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <Badge variant="outline" className="text-[9px] h-5 font-bold uppercase tracking-[0.05em] rounded-md border-border/50 text-muted-foreground bg-background/50">
                      {prod.product_categories?.name || 'Uncategorized'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        R$ {formatCurrency(prod.base_price)}
                      </span>
                      <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest opacity-50">
                        per {prod.unit_types?.symbol || 'un'}
                      </span>
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
                          <DropdownMenuItem onClick={() => startEdit(prod)} className="text-xs font-semibold gap-2 py-2">
                            <Edit2 className="w-3 h-3" /> Edit Specs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(prod.id)} className="text-xs font-semibold gap-2 py-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer">
                            <Trash2 className="w-3 h-3" /> Remove Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/30">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground">Catalog is empty</h4>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto opacity-70">
                  No products found. Start by adding a new item to your equipment list.
                </p>
              </div>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                variant="outline" 
                size="sm"
                className="mt-2 border-border/50 text-xs font-bold uppercase tracking-widest h-9 px-6 rounded-md"
              >
                Add First Product
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
