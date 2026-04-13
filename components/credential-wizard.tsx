"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react"

interface WizardStep {
  id: number
  title: string
  description: string
}

const steps: WizardStep[] = [
  { id: 1, title: "Student Information", description: "Enter student details" },
  { id: 2, title: "Credential Details", description: "Specify credential type and details" },
  { id: 3, title: "Verification", description: "Review and confirm" },
  { id: 4, title: "Issuance", description: "Issue to blockchain" },
]

export function CredentialWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentId: "",
    credentialType: "Bachelor's Degree",
    major: "",
    graduationDate: "",
    gpa: "",
    honors: "None",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("Submitting credential:", formData)
    // Handle submission
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${
                currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.id}
            </div>
            <div className="ml-3">
              <p className="font-medium text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Student Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Student Name</label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Student Email</label>
                <input
                  type="email"
                  name="studentEmail"
                  value={formData.studentEmail}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="Enter student ID"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Step 2: Credential Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Credential Type</label>
                <select
                  name="credentialType"
                  value={formData.credentialType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Bachelor's Degree</option>
                  <option>Master's Degree</option>
                  <option>PhD</option>
                  <option>Certificate</option>
                  <option>Diploma</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Major/Field of Study</label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Graduation Date</label>
                <input
                  type="date"
                  name="graduationDate"
                  value={formData.graduationDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">GPA</label>
                  <input
                    type="number"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    placeholder="3.8"
                    step="0.01"
                    min="0"
                    max="4"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Honors</label>
                  <select
                    name="honors"
                    value={formData.honors}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>None</option>
                    <option>Cum Laude</option>
                    <option>Magna Cum Laude</option>
                    <option>Summa Cum Laude</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student Name:</span>
                  <span className="font-medium text-foreground">{formData.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground">{formData.studentEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="font-medium text-foreground">{formData.studentId}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credential Type:</span>
                    <span className="font-medium text-foreground">{formData.credentialType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Major:</span>
                    <span className="font-medium text-foreground">{formData.major}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Graduation Date:</span>
                    <span className="font-medium text-foreground">{formData.graduationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPA:</span>
                    <span className="font-medium text-foreground">{formData.gpa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Honors:</span>
                    <span className="font-medium text-foreground">{formData.honors}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Please review the information above. Once submitted, this credential will be issued to the blockchain.
              </p>
            </div>
          )}

          {/* Step 4: Issuance */}
          {currentStep === 4 && (
            <div className="space-y-4 text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground">Credential Issued Successfully!</h3>
              <p className="text-muted-foreground">
                The credential has been issued to the blockchain and is now verifiable.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground mb-2">Transaction Hash:</p>
                <p className="font-mono text-sm text-foreground break-all">0x1234567890abcdef...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="border-primary/30 hover:bg-primary/10 bg-transparent"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </div>

        {currentStep === steps.length ? (
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/20"
          >
            Complete
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
