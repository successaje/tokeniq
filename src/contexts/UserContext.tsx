"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  name?: string
  email?: string
  company?: string
  country?: string
  username?: string
  bio?: string
  avatar_url?: string
}

interface UserContextType {
  address: string | undefined
  profile: UserProfile | null
  isLoading: boolean
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { connect: connectWallet } = useConnect()
  const { disconnect: disconnectWallet } = useDisconnect()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (walletAddress: string) => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call to fetch user profile
      const response = await fetch(`/api/profiles/${walletAddress}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!address) return

    try {
      setIsLoading(true)
      // TODO: Replace with actual API call to update profile
      const response = await fetch(`/api/profiles/${address}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      setProfile(prev => ({
        ...prev,
        ...updates,
      }))

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (address) {
      await fetchProfile(address)
    }
  }

  useEffect(() => {
    if (address) {
      fetchProfile(address)
    } else {
      setProfile(null)
      setIsLoading(false)
    }
  }, [address])

  const value = {
    address,
    profile,
    isLoading,
    updateProfile,
    refreshProfile,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
} 