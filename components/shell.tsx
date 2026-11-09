"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, Moon, Sun, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useStore } from "@/lib/store"

const PUBLIC_LINKS = [
  { href: "/spending", label: "Spending" },
  { href: "/verify", label: "Verify" },
  { href: "/ledger", label: "Ledger" },
]

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="24" height="24" rx="3" fill="var(--accent)" />
      <path d="M6 8h14M6 13h14M6 18h8" stroke="var(--accent-ink)" strokeWidth="2" strokeLinecap="square" />
    </svg>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <button
      type="button"
      className="btn btn-quiet !px-3"
      aria-label="Switch between light and dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon size={18} aria-hidden className="theme-moon" />
      <Sun size={18} aria-hidden className="theme-sun" />
    </button>
  )
}

function ChainState() {
  const chain = useStore((s) => s.chain)
  if (!chain) return null
  return chain.ok ? (
    <span className="mark mark-ok">Ledger intact</span>
  ) : (
    <Link href="/ledger" className="mark mark-bad ulink">
      Tampering found at entry {chain.brokenAt}
    </Link>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === path
  const setOpen = (v: boolean) => setOpenAt(v ? path : null)
  const session = useStore((s) => s.session)
  const signOut = useStore((s) => s.signOut)
  const ready = useStore((s) => s.ready)

  const home = session.role === "official" ? "/admin" : session.role === "contractor" ? "/contractor" : null
  const links = [...PUBLIC_LINKS]
  const active = (href: string) => path === href || path.startsWith(href + "/")

  return (
    <>
      <div className="bg-ink text-bg text-sm">
        <p className="wrap py-2 leading-snug">
          Demonstration only. All names and figures are fictional, and the ledger is simulated in your browser. No real money, chain or wallet.
        </p>
      </div>

      <header className="border-b border-rule bg-bg sticky top-0 z-40">
        <div className="wrap flex items-center justify-between gap-3 min-h-16">
          <Link href="/" className="flex items-center gap-2.5 min-h-11">
            <Mark />
            <span className="font-serif text-xl leading-none">Ogbe Budget Ledger</span>
          </Link>

          <nav aria-label="Main" className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
                className={`px-3 min-h-11 inline-flex items-center rounded-[4px] hover:bg-sunken ${active(l.href) ? "font-semibold underline underline-offset-8 decoration-2 decoration-accent" : ""}`}>
                {l.label}
              </Link>
            ))}
            {home && (
              <Link href={home} className="px-3 min-h-11 inline-flex items-center rounded-[4px] hover:bg-sunken font-semibold">
                {session.role === "official" ? "Budget office" : "My work"}
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {session.role === "public" ? (
              <Link href="/login" className="btn">Sign in</Link>
            ) : (
              <button className="btn btn-quiet" onClick={() => { signOut(); router.push("/") }}>Sign out</button>
            )}
            <ThemeToggle />
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button type="button" className="btn btn-quiet !px-3" aria-expanded={open} aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Main" className="md:hidden border-t border-rule bg-bg">
            <div className="wrap py-2 flex flex-col">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="min-h-12 flex items-center border-b border-rule text-lg">{l.label}</Link>
              ))}
              {home && (
                <Link href={home} className="min-h-12 flex items-center border-b border-rule text-lg font-semibold">
                  {session.role === "official" ? "Budget office" : "My work"}
                </Link>
              )}
              <div className="py-3">
                {session.role === "public" ? (
                  <Link href="/login" className="btn w-full">Sign in</Link>
                ) : (
                  <button className="btn btn-quiet w-full" onClick={() => { signOut(); router.push("/") }}>Sign out</button>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="min-h-[70vh]">{children}</main>

      <footer className="border-t border-rule mt-20">
        <div className="wrap py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-serif text-xl">Ogbe Budget Ledger</p>
            <p className="mt-2 text-muted max-w-sm">
              A portfolio project showing how public spending can be recorded so that anyone can check it. Ogbe State is fictional.
            </p>
            {ready && <p className="mt-4"><ChainState /></p>}
          </div>
          <div>
            <p className="kicker">Look</p>
            <ul className="mt-3 space-y-1">
              {PUBLIC_LINKS.map((l) => (
                <li key={l.href}><Link className="ulink inline-flex min-h-11 items-center" href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="kicker">Try</p>
            <ul className="mt-3 space-y-1">
              <li><Link className="ulink inline-flex min-h-11 items-center" href="/login">Sign in as a role</Link></li>
              <li><Link className="ulink inline-flex min-h-11 items-center" href="/ledger#tamper">Tamper check</Link></li>
              <li><a className="ulink inline-flex min-h-11 items-center" href="https://github.com/Shuwabel/blockchain-validation">Source code</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  )
}
