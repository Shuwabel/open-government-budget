"use client"

import { DataTable } from "./data-table"

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  enrollmentDate: string
  status: string
}

const mockStudents: Student[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@university.edu",
    studentId: "STU-2024-001",
    enrollmentDate: "2020-09-01",
    status: "Active",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@university.edu",
    studentId: "STU-2024-002",
    enrollmentDate: "2021-09-01",
    status: "Active",
  },
  {
    id: "3",
    name: "Mike Davis",
    email: "mike.davis@university.edu",
    studentId: "STU-2024-003",
    enrollmentDate: "2022-09-01",
    status: "Active",
  },
  {
    id: "4",
    name: "Emily Brown",
    email: "emily.brown@university.edu",
    studentId: "STU-2024-004",
    enrollmentDate: "2023-09-01",
    status: "Active",
  },
  {
    id: "5",
    name: "James Wilson",
    email: "james.wilson@university.edu",
    studentId: "STU-2024-005",
    enrollmentDate: "2023-09-01",
    status: "Graduated",
  },
]

export function StudentsTable() {
  const columns = [
    {
      key: "name" as const,
      label: "Name",
      sortable: true,
    },
    {
      key: "email" as const,
      label: "Email",
      sortable: true,
    },
    {
      key: "studentId" as const,
      label: "Student ID",
      sortable: true,
    },
    {
      key: "enrollmentDate" as const,
      label: "Enrollment Date",
      sortable: true,
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            value === "Active" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"
          }`}
        >
          {value}
        </span>
      ),
    },
  ]

  return <DataTable<Student> columns={columns} data={mockStudents} title="Student Records" />
}
