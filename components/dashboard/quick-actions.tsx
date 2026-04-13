"use client"

import { Button } from "@/components/ui/button"
import { Plus, FileText, Download, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface QuickActionsProps {
  onCreateAllocation?: () => void
  onCreateDisbursement?: () => void
  onExport?: () => void
}

export function QuickActions({ onCreateAllocation, onCreateDisbursement, onExport }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="border-primary/30 hover:bg-primary/10 bg-transparent"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>All Status</DropdownMenuItem>
          <DropdownMenuItem>Approved Only</DropdownMenuItem>
          <DropdownMenuItem>Pending Only</DropdownMenuItem>
          <DropdownMenuItem>This Month</DropdownMenuItem>
          <DropdownMenuItem>This Year</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        onClick={onExport}
        className="border-primary/30 hover:bg-primary/10 bg-transparent"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onCreateAllocation}>
            <FileText className="w-4 h-4 mr-2" />
            New Allocation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCreateDisbursement}>
            <FileText className="w-4 h-4 mr-2" />
            New Disbursement
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

