import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// TODO: Replace with actual database
const users = new Map()

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params

  // TODO: Replace with actual database query
  const user = users.get(address) || {
    address,
    role: "investor",
    kycStatus: "pending",
    profile: {
      name: "",
      email: "",
      company: "",
      country: "",
    },
  }

  return NextResponse.json(user)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params
  const body = await request.json()

  // TODO: Replace with actual database update
  const existingUser = users.get(address) || {
    address,
    role: "investor",
    kycStatus: "pending",
    profile: {
      name: "",
      email: "",
      company: "",
      country: "",
    },
  }

  const updatedUser = {
    ...existingUser,
    profile: {
      ...existingUser.profile,
      ...body.profile,
    },
  }

  users.set(address, updatedUser)

  return NextResponse.json(updatedUser)
} 