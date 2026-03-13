"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Search, Loader2, Edit2, Trash2, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

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
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    category_id: "",
    unit_type_id: ""
  })

  const supabase = createClient()

  // Filtered products
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
    setIsAdding(false)
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
    setIsAdding(false)
  }

  async function handleSubmit() {
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
        toast.success("Product updated")
      } else {
        const { error } = await supabase
          .from("products")
          .insert(payload)
        if (error) throw error
        toast.success("Product added successfully")
      }
      
      resetForm()
      fetchInitialData()
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this product from catalog?")) return

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Product removed")
      fetchInitialData()
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..." 
            className="pl-10 bg-white/5 border-white/10 focus:bg-white/10 text-white"
          />
        </div>
        {!isAdding && !editingId && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-white text-black hover:bg-zinc-200 gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="glass-card p-8 rounded-2xl flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 border-white/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{editingId ? 'Edit Product' : 'New Product Info'}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Product Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: LED Panel P2.5"
                className="bg-zinc-900 border-white/10 text-white"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Base Price</label>
              <Input 
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                placeholder="0.00"
                className="bg-zinc-900 border-white/10 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
              <select 
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Unit Type</label>
              <select 
                value={formData.unit_type_id}
                onChange={(e) => setFormData({...formData, unit_type_id: e.target.value})}
                className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="">Select Unit</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Product technical details..."
                className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-white text-black hover:bg-zinc-200 px-8">
              {editingId ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-card rounded-2xl overflow-hidden border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Product</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Category</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Base Price</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white tracking-tight">{prod.name}</span>
                        <span className="text-xs text-zinc-500 line-clamp-1">{prod.description || 'No description'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {prod.product_categories?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-sm">
                          R$ {formatCurrency(prod.base_price)} / {prod.unit_types?.symbol || 'un'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-white/10"
                          onClick={() => startEdit(prod)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(prod.id)}
                          className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-zinc-500">
                  {searchQuery ? `No results for "${searchQuery}"` : "Your catalog is empty."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
