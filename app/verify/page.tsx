"use client"

import { CredentialVerifier } from "@/components/credential-verifier"
import Link from "next/link"
import { Shield } from "lucide-react"

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">BudgetTransparency</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Verify Government Spending
          </h1>
          <p className="text-lg text-muted-foreground text-balance">
            Enter a transaction ID or project code to verify government expenditure on the blockchain
          </p>
        </div>

        <CredentialVerifier />

        {/* Info Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="rounded-lg border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-2">Instant Verification</h3>
            <p className="text-sm text-muted-foreground">
              Get immediate verification results backed by blockchain technology
            </p>
          </div>
          <div className="rounded-lg border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-2">Tamper-Proof</h3>
            <p className="text-sm text-muted-foreground">
              Government transactions stored on blockchain cannot be forged or altered
            </p>
          </div>
          <div className="rounded-lg border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-2">Transparent</h3>
            <p className="text-sm text-muted-foreground">
              View complete blockchain transaction details for full transparency
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
