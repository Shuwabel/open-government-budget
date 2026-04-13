"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Search, Download } from "lucide-react"

interface Disbursement {
  id: string
  amount: number
  contractor: string
  disbursementDate: string
  transactionHash: string | null
  status: string
  reason: string
}

interface VerificationResult {
  status: "verified" | "pending" | "invalid" | null
  projectName?: string
  projectCode?: string
  ministry?: string
  allocatedAmount?: string
  totalDisbursed?: string
  disbursements?: Disbursement[]
  disbursementCount?: number
  blockchainNetwork?: string
  blockchainTxHash?: string | null
}

export function CredentialVerifier() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<VerificationResult>({ status: null })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    
    try {
      const response = await fetch('/api/public/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash: searchQuery.includes('0x') ? searchQuery : undefined,
          projectCode: !searchQuery.includes('0x') ? searchQuery : undefined,
        }),
      })

      const data = await response.json()

      if (data.success && data.status === 'verified') {
        setResult({
          status: 'verified',
          projectName: data.data.projectName,
          projectCode: data.data.projectCode,
          ministry: data.data.ministry,
          allocatedAmount: `₦${Number(data.data.allocatedAmount).toLocaleString()}`,
          totalDisbursed: `₦${Number(data.data.totalDisbursed || 0).toLocaleString()}`,
          disbursements: data.data.disbursements || [],
          disbursementCount: data.data.disbursementCount || 0,
          blockchainNetwork: data.data.blockchainNetwork,
          blockchainTxHash: data.data.blockchainTxHash,
        })
      } else {
        setResult({ status: 'invalid' })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setResult({ status: 'invalid' })
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <Card className="border-primary/20 gradient-card">
        <CardHeader>
          <CardTitle>Search Government Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter project code or transaction ID"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Try searching for "PROJ-2024-001" or "TX-2024-002"
          </p>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result.status && (
        <div className="space-y-4">
          {/* Status Card */}
          <Card
            className={`border-2 ${
              result.status === "verified"
                ? "border-green-500/50 bg-green-500/5"
                : result.status === "pending"
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : "border-red-500/50 bg-red-500/5"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {result.status === "verified" && (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-green-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-green-600">Transaction Verified</h3>
                      <p className="text-sm text-muted-foreground">
                        This government transaction is authentic and verified on the blockchain
                      </p>
                    </div>
                  </>
                )}
                {result.status === "pending" && (
                  <>
                    <AlertCircle className="w-12 h-12 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-yellow-600">Verification Pending</h3>
                      <p className="text-sm text-muted-foreground">
                        This transaction is being verified on the blockchain
                      </p>
                    </div>
                  </>
                )}
                {result.status === "invalid" && (
                  <>
                    <AlertCircle className="w-12 h-12 text-red-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-red-600">Transaction Not Found</h3>
                      <p className="text-sm text-muted-foreground">No matching transaction found in the blockchain</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          {result.status === "verified" && (
            <>
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Project Name</p>
                      <p className="font-semibold text-foreground">{result.projectName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Project Code</p>
                      <p className="font-semibold text-foreground">{result.projectCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ministry</p>
                      <p className="font-semibold text-foreground">{result.ministry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Allocated Amount</p>
                      <p className="font-semibold text-foreground">{result.allocatedAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Disbursed</p>
                      <p className="font-semibold text-foreground">{result.totalDisbursed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Disbursement Count</p>
                      <p className="font-semibold text-foreground">{result.disbursementCount} disbursement(s)</p>
                    </div>
                  </div>

                  {/* All Disbursements */}
                  {result.disbursements && result.disbursements.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="font-semibold text-foreground mb-4">All Disbursements ({result.disbursements.length})</h4>
                      <div className="space-y-4">
                        {result.disbursements.map((disb, index) => (
                          <div key={disb.id || index} className="p-4 rounded-lg border border-border/50 bg-muted/30">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Contractor</p>
                                <p className="font-medium text-foreground">{disb.contractor}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                                <p className="font-semibold text-foreground">₦{Number(disb.amount).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Date</p>
                                <p className="text-sm text-foreground">{new Date(disb.disbursementDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                <p className="text-sm font-medium text-foreground capitalize">{disb.status}</p>
                              </div>
                            </div>
                            {disb.reason && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Reason</p>
                                <p className="text-sm text-foreground">{disb.reason}</p>
                              </div>
                            )}
                            {disb.transactionHash && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                                <a
                                  href={`https://polygonscan.com/tx/${disb.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline font-mono break-all"
                                >
                                  {disb.transactionHash}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Blockchain Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Blockchain Network</p>
                    <p className="font-semibold text-foreground">{result.blockchainNetwork}</p>
                  </div>
                  {result.blockchainTxHash && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Allocation Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground text-sm font-mono break-all">
                            {result.blockchainTxHash}
                          </code>
                          <a
                            href={`https://polygonscan.com/tx/${result.blockchainTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/30 hover:bg-primary/10 bg-transparent"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <a
                          href={`https://polygonscan.com/tx/${result.blockchainTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
                            View on Blockchain Explorer
                          </Button>
                        </a>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Verification Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Authenticity</span>
                    <span className="flex items-center gap-2 text-green-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Blockchain Status</span>
                    <span className="flex items-center gap-2 text-green-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmed
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Expenditure Status</span>
                    <span className="flex items-center gap-2 text-green-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
