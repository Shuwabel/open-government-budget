"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, ChevronRight, Upload, Eye } from "lucide-react"

type Step = "info" | "upload" | "review" | "issue"

const steps: { id: Step; label: string; description: string }[] = [
  { id: "info", label: "Student Info", description: "Enter student details" },
  { id: "upload", label: "Upload", description: "Upload credential document" },
  { id: "review", label: "Review", description: "Verify information" },
  { id: "issue", label: "Issue", description: "Publish to blockchain" },
]

export function IssueWizard() {
  const [currentStep, setCurrentStep] = useState<Step>("info")
  const [formData, setFormData] = useState({
    studentName: "",
    studentId: "",
    email: "",
    degree: "",
    major: "",
    graduationDate: "",
  })

  const handleNext = () => {
    const stepOrder: Step[] = ["info", "upload", "review", "issue"]
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }

  const handlePrev = () => {
    const stepOrder: Step[] = ["info", "upload", "review", "issue"]
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Issue Credential</h1>
        <p className="text-muted-foreground mt-1">Step-by-step credential issuance wizard</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-3 pb-4 transition-all duration-200 ${
                currentStep === step.id ? "border-b-2 border-primary" : "border-b-2 border-border"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                  currentStep === step.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </button>
            {index < steps.length - 1 && <ChevronRight className="w-5 h-5 text-muted-foreground mx-4" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="gradient-card border-primary/20">
        <CardHeader>
          <CardTitle>{steps.find((s) => s.id === currentStep)?.label}</CardTitle>
          <CardDescription>{steps.find((s) => s.id === currentStep)?.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Student Name</label>
                  <Input
                    placeholder="John Smith"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Student ID</label>
                  <Input
                    placeholder="STU-2024-001"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="john@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Degree</label>
                  <Input
                    placeholder="Bachelor of Science"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Major</label>
                  <Input
                    placeholder="Computer Science"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Graduation Date</label>
                <Input
                  type="date"
                  value={formData.graduationDate}
                  onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
            </div>
          )}

          {currentStep === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-primary/60 mx-auto mb-4" />
                <p className="font-medium text-foreground mb-2">Upload Credential Document</p>
                <p className="text-sm text-muted-foreground">Drag and drop or click to select PDF, JPG, or PNG</p>
              </div>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Supported formats:</span> PDF, JPG, PNG (Max 10MB)
                </p>
              </div>
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student Name</p>
                    <p className="font-medium text-foreground">{formData.studentName || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium text-foreground">{formData.studentId || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Degree</p>
                    <p className="font-medium text-foreground">{formData.degree || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Major</p>
                    <p className="font-medium text-foreground">{formData.major || "Not provided"}</p>
                  </div>
                </div>
              </div>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex items-start gap-3">
                <Eye className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Please review all information carefully. Once issued, credentials cannot be modified.
                </p>
              </div>
            </div>
          )}

          {currentStep === "issue" && (
            <div className="space-y-4">
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
                <p className="font-medium text-foreground mb-2">Ready to Issue</p>
                <p className="text-sm text-muted-foreground">
                  Click the button below to publish this credential to the blockchain
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === "info"}
              className="border-primary/30 hover:bg-primary/10 bg-transparent"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
            >
              {currentStep === "issue" ? "Issue Credential" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
