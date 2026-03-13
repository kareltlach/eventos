"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Plus, Trash2, Search, ArrowLeft, Loader2, Save, Users, ShoppingCart, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewBudgetPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Catalog Data
  const [products, setProducts] = useState<any[]>([])
  
  // Form State
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    event_date: "",
    event_location: ""
  })
  
  const [items, setItems] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          unit_types (symbol)
        `)
        .order("name")
      if (error) throw error
      setProducts(data || [])
    } catch (err: any) {
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const addItem = (product: any) => {
    const newItem = {
      product_id: product.id,
      name: product.name,
      symbol: product.unit_types?.symbol || 'un',
      quantity: 1,
      unit_price: product.base_price || 0,
      total: product.base_price || 0
    }
    setItems([...items, newItem])
    toast.success(`${product.name} added to budget`)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index][field] = value
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = async () => {
    if (!customer.name) {
      toast.error("Customer name is required")
      return
    }
    if (items.length === 0) {
      toast.error("Add at least one item to the budget")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .single()

      console.log("Budget Creation - Step 1: Payload", {
        org_id: profile?.org_id,
        customer_name: customer.name,
        total_amount: calculateTotal()
      })

      // 1. Create Budget Request
      const { data: budget, error: budgetError } = await supabase
        .from("budget_requests")
        .insert({
          org_id: profile?.org_id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          customer_info: { email: customer.email, phone: customer.phone },
          event_details: { date: customer.event_date, location: customer.event_location },
          status: "pending",
          total_amount: calculateTotal()
        })
        .select()
        .single()

      if (budgetError) {
        console.error("Budget Error (Step 1):", budgetError)
        throw new Error(`Failed to create budget: ${budgetError.message}`)
      }

      console.log("Budget Creation - Step 1: Success", budget.id)

      // 2. Create Budget Items
      const budgetItemsPayload = items.map(item => ({
        budget_id: budget.id,
        product_id: item.product_id,
        description: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      console.log("Budget Creation - Step 2: Payload", budgetItemsPayload)

      const { error: itemsError } = await supabase
        .from("budget_items")
        .insert(budgetItemsPayload)

      if (itemsError) {
        console.error("Budget Items Error (Step 2):", itemsError)
        throw new Error(`Failed to save items: ${itemsError.message}`)
      }

      console.log("Budget Creation - Step 2: Success")

      toast.success("Budget created successfully!")
      router.push("/budgets")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/budgets">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-zinc-400">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create New Budget</h1>
            <p className="text-zinc-500 text-sm">Draft a new event proposal for your customer.</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-white text-black hover:bg-zinc-200 gap-2 h-11 px-8 font-bold"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Finalize Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Customer & Items */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Customer Section */}
          <div className="glass-card p-8 rounded-3xl border-white/5 flex flex-col gap-6">
            <div className="flex items-center gap-3 text-white border-b border-white/5 pb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Customer Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Full Name</label>
                <Input 
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  placeholder="Ex: Rafael Silva"
                  className="bg-zinc-900/50 border-white/10 h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Email (Optional)</label>
                <Input 
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  placeholder="customer@email.com"
                  className="bg-zinc-900/50 border-white/10 h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Phone</label>
                <Input 
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  placeholder="+55 11 99999-9999"
                  className="bg-zinc-900/50 border-white/10 h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Event Date</label>
                <Input 
                  type="date"
                  value={customer.event_date}
                  onChange={(e) => setCustomer({...customer, event_date: e.target.value})}
                  className="bg-zinc-900/50 border-white/10 h-11 text-white"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="glass-card p-8 rounded-3xl border-white/5 flex flex-col gap-6 min-h-[400px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Budget Items</h2>
              </div>
              <span className="text-zinc-500 text-sm">{items.length} items added</span>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all animate-in fade-in zoom-in-95">
                  <div className="flex-1 w-full">
                    <span className="text-white font-bold block mb-1">{item.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">{item.product_id.split('-')[0]}</span>
                  </div>
                  <div className="w-full md:w-24">
                    <label className="text-[10px] text-zinc-600 uppercase font-bold mb-1 block">Qty</label>
                    <Input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-9 bg-zinc-900 border-white/5 text-sm"
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="text-[10px] text-zinc-600 uppercase font-bold mb-1 block">Unit Price</label>
                    <Input 
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="h-9 bg-zinc-900 border-white/5 text-sm font-mono"
                    />
                  </div>
                  <div className="w-full md:w-32 text-right">
                    <label className="text-[10px] text-zinc-600 uppercase font-bold mb-1 block">Total Item</label>
                    <span className="text-white font-mono font-bold">${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(index)}
                    className="text-zinc-600 hover:text-red-400 hover:bg-red-400/10 h-9 w-9"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center gap-2">
                  <ShoppingCart className="w-8 h-8 text-zinc-800" />
                  <p className="text-zinc-600">No items added to budget yet.</p>
                  <p className="text-xs text-zinc-700">Select items from the catalog on the right.</p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center px-4">
              <span className="text-zinc-500 font-medium">Grand Total</span>
              <span className="text-4xl font-bold text-white tracking-tighter font-mono">
                R$ {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Catalog Browser */}
        <div className="flex flex-col gap-6 h-fit sticky top-8">
          <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-6 h-[calc(100vh-100px)]">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-white">Select Products</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog..." 
                  className="pl-10 bg-zinc-900/50 border-white/10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex flex-col gap-3">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all text-left group"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-white group-hover:text-white transition-colors">{p.name}</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-zinc-500 font-mono tracking-tight">R$ {formatCurrency(p.base_price)} / {p.unit_types?.symbol}</span>
                        <Plus className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
                {loading && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
