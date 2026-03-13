"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    { name: "Products", href: "/catalog/products" },
    { name: "Categories", href: "/catalog/categories" },
    { name: "Unit Types", href: "/catalog/units" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em]">Inventory</h2>
        <h1 className="text-4xl font-bold tracking-tight text-white">Product Catalog</h1>
      </header>

      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? "bg-white text-black shadow-lg" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </div>

      <div className="mt-2">
        {children}
      </div>
    </div>
  )
}
