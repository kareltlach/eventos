"use client"

import { Button } from "@/components/ui/button"
import { Plus, Minus, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

interface Product {
  id: string
  name: string
  base_price: number | null
  unit_types: { symbol: string } | null
}

interface CatalogItemProps {
  product: Product
  quantity: number
  onUpdate: (productId: string, quantity: number) => void
}

export function CatalogItem({ product, quantity, onUpdate }: CatalogItemProps) {
  const isSelected = quantity > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
        isSelected 
          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5" 
          : "bg-card/30 border-border/50 hover:border-border"
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h3 className={`font-bold text-sm tracking-tight transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
              {product.name}
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-tight uppercase">
              R$ {formatCurrency(product.base_price || 0)} / {product.unit_types?.symbol || 'un'}
            </span>
          </div>
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 p-1 bg-background/50 rounded-2xl border border-border/50">
            <Button
              size="icon"
              variant="ghost"
              disabled={quantity <= 0}
              onClick={() => onUpdate(product.id, Math.max(0, quantity - 1))}
              className="w-8 h-8 rounded-xl hover:bg-background"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center text-xs font-bold font-mono">
              {quantity}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onUpdate(product.id, quantity + 1)}
              className="w-8 h-8 rounded-xl hover:bg-background"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          
          <AnimatePresence>
            {isSelected && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-xs font-bold text-foreground font-mono"
              >
                R$ {formatCurrency((product.base_price || 0) * quantity)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
