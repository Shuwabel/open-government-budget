"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Upload, Search, ExternalLink } from "lucide-react"

type VerificationStatus = "valid" | "revoked" | "invalid" | null

export function VerifierPortal() {
  const [activeTab, setActiveTab] = useState("record")
  const [recordId, setRecordId] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(null)

  const handleVerifyRecord = () => {
    // Simulate verification
    setVerificationStatus("valid")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">BlockVerify</span>
          </div>
          <p className="text-muted-foreground">Credential Verification Portal</p>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Verify Student Credentials Instantly
          </h1>
          <p className="text-lg text-muted-foreground text-balance">
            Check the authenticity of academic credentials on the blockchain
          </p>
        </div>

        {/* Verification Card */}
        <Card className="gradient-card border-primary/20 mb-8">
          <CardHeader>
            <CardTitle>Credential Verification</CardTitle>
            <CardDescription>Enter a record ID or upload a credential document</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30">
                <TabsTrigger
                  value="record"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Verify by Record ID
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Verify by Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="record" className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Record ID</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter credential record ID (e.g., 0x1a2b3c...)"
                      value={recordId}
                      onChange={(e) => setRecordId(e.target.value)}
                      className="bg-input border-border flex-1"
                    />
                    <Button
                      onClick={handleVerifyRecord}
                      className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 mt-6">
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-primary/60 mx-auto mb-4" />
                  <p className="font-medium text-foreground mb-2">Upload Credential Document</p>
                  <p className="text-sm text-muted-foreground">Drag and drop or click to select PDF, JPG, or PNG</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {verificationStatus && (
          <Card
            className={`gradient-card border-2 mb-8 ${
              verificationStatus === "valid" ? "border-accent/50" : "border-destructive/50"
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {verificationStatus === "valid" ? (
                  <CheckCircle2 className="w-8 h-8 text-accent" />
                ) : (
                  <XCircle className="w-8 h-8 text-destructive" />
                )}
                <div>
                  <CardTitle>{verificationStatus === "valid" ? "Credential Valid" : "Credential Invalid"}</CardTitle>
                  <CardDescription>
                    {verificationStatus === "valid"
                      ? "This credential has been verified on the blockchain"
                      : "This credential could not be verified"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Student Name</p>
                  <p className="font-medium text-foreground">John Smith</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Student ID</p>
                  <p className="font-medium text-foreground">STU-2024-001</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Degree</p>
                  <p className="font-medium text-foreground">Bachelor of Science</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Major</p>
                  <p className="font-medium text-foreground">Computer Science</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Issued By</p>
                  <p className="font-medium text-foreground">State University</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Issue Date</p>
                  <p className="font-medium text-foreground">May 15, 2024</p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <p className="text-sm text-foreground mb-2">
                  <span className="font-medium">Transaction Hash:</span>
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted/50 px-3 py-2 rounded flex-1 overflow-x-auto text-foreground">
                    0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
                  </code>
                  <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setVerificationStatus(null)}
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10"
              >
                Verify Another Credential
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="gradient-card border-primary/20">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Enter Record ID or Upload</p>
                <p className="text-sm text-muted-foreground">Provide the credential record ID or upload the document</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Blockchain Verification</p>
                <p className="text-sm text-muted-foreground">The system checks the blockchain for the credential</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Instant Results</p>
                <p className="text-sm text-muted-foreground">
                  Get immediate verification status and credential details
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
