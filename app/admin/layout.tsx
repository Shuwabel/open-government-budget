"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RoleGate } from "@/components/ui"

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/budget", label: "Budget" },
  { href: "/admin/disbursements", label: "Payments" },
  { href: "/admin/contractors", label: "Contractors" },
  { href: "/admin/certificates", label: "Certificates" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <RoleGate role="official">
      <div className="border-b border-rule">
        <nav aria-label="Budget office" className="wrap flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const on = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`min-h-12 px-3 inline-flex items-center whitespace-nowrap border-b-2 ${on ? "border-accent font-semibold" : "border-transparent text-muted hover:text-ink"}`}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {children}
    </RoleGate>
  )
}
