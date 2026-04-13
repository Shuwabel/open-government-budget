"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure government budget transparency system settings</p>
      </div>

      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Government Name</label>
              <input
                type="text"
                placeholder="Enter government name"
                className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Blockchain Network</label>
              <select className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Ethereum Mainnet</option>
                <option>Polygon</option>
                <option>Sepolia Testnet</option>
              </select>
            </div>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
