"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Shield, Eye, TrendingUp } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">BudgetTransparency</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10 bg-transparent">
                Government Portal
              </Button>
            </Link>
            <Link href="/contractor">
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10 bg-transparent">
                Contractor Portal
              </Button>
            </Link>
            <Link href="/verify">
              <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
                Verify Spending
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6 text-balance animate-pulse-glow">
            Transparent Government Spending
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Track every government expenditure with blockchain-verified transparency. See where your tax money goes.
          </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/verify">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
                  >
                    Verify Spending
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 bg-transparent">
                    Government Portal
                  </Button>
                </Link>
                <Link href="/contractor">
                  <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 bg-transparent">
                    Contractor Portal
                  </Button>
                </Link>
              </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">Blockchain Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Every transaction is recorded on blockchain for immutable transparency and cannot be altered or deleted
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">Public Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Citizens can verify any government expenditure in real-time using project codes or transaction hashes
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">Accountability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Reduce corruption and ensure proper use of public funds through complete transparency
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
