"use client"

import { CredentialWizard } from "@/components/credential-wizard"

export default function IssueCredentialPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Issue New Credential</h1>
        <p className="text-muted-foreground">Follow the steps below to issue a new student credential</p>
      </div>

      <CredentialWizard />
    </div>
  )
}
