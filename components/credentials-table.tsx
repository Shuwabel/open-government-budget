"use client"

import { DataTable } from "./data-table"
import { CheckCircle2, Clock } from "lucide-react"

interface Credential {
  id: string
  studentName: string
  email: string
  credentialType: string
  major: string
  issuedDate: string
  status: "active" | "pending"
}

const mockCredentials: Credential[] = [
  {
    id: "1",
    studentName: "John Smith",
    email: "john.smith@university.edu",
    credentialType: "Bachelor's Degree",
    major: "Computer Science",
    issuedDate: "2024-01-15",
    status: "active",
  },
  {
    id: "2",
    studentName: "Sarah Johnson",
    email: "sarah.johnson@university.edu",
    credentialType: "Master's Degree",
    major: "Data Science",
    issuedDate: "2024-01-14",
    status: "active",
  },
  {
    id: "3",
    studentName: "Mike Davis",
    email: "mike.davis@university.edu",
    credentialType: "Certificate",
    major: "Web Development",
    issuedDate: "2024-01-13",
    status: "pending",
  },
  {
    id: "4",
    studentName: "Emily Brown",
    email: "emily.brown@university.edu",
    credentialType: "PhD",
    major: "Artificial Intelligence",
    issuedDate: "2024-01-12",
    status: "active",
  },
]

export function CredentialsTable() {
  const columns = [
    {
      key: "studentName" as const,
      label: "Student Name",
      sortable: true,
    },
    {
      key: "email" as const,
      label: "Email",
      sortable: true,
    },
    {
      key: "credentialType" as const,
      label: "Credential Type",
      sortable: true,
    },
    {
      key: "major" as const,
      label: "Major",
      sortable: true,
    },
    {
      key: "issuedDate" as const,
      label: "Issued Date",
      sortable: true,
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (value: Credential["status"]) => {
        const statusConfig = {
          active: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10" },
          pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10" },
        }
        const config = statusConfig[value]
        const Icon = config.icon
        return (
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.color} text-sm font-medium`}
          >
            <Icon className="w-4 h-4" />
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        )
      },
    },
  ]

  return <DataTable<Credential> columns={columns} data={mockCredentials} title="Issued Credentials" />
}
