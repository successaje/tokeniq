"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Building, Mail, Globe } from "lucide-react"

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useUser()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.profile?.name || "",
    email: user?.profile?.email || "",
    company: user?.profile?.company || "",
    country: user?.profile?.country || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await updateProfile(formData)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl"
      >
        <h1 className="mb-8 text-3xl font-bold">Profile Settings</h1>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <div className="relative mt-2">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <div className="relative mt-2">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter your country"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Wallet Address: {user?.address}
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="mt-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">Account Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">KYC Status</span>
              <span
                className={`font-medium capitalize ${
                  user?.kycStatus === "verified"
                    ? "text-green-500"
                    : user?.kycStatus === "rejected"
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {user?.kycStatus}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
} 