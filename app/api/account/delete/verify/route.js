import { db} from "@/lib/prisma"
import crypto from "crypto"
import { NextResponse } from "next/server"

export async function POST(req) {

  const { otp, accountId } = await req.json()

  const record = await db.deleteAccountOtp.findUnique({
    where: { accountId }
  })

  if (!record)
    return NextResponse.json({ message: "OTP not found" }, { status: 400 })

  if (new Date() > record.expiresAt) {

    await db.deleteAccountOtp.delete({
      where: { accountId }
    })

    return NextResponse.json({ message: "Time expired" }, { status: 400 })
  }

  const hash = crypto.createHash("sha256").update(otp).digest("hex")

  if (hash !== record.otpHash)
    return NextResponse.json({ message: "Invalid OTP" }, { status: 400 })

  await db.$transaction([
    db.deleteAccountOtp.delete({
      where: { accountId }
    }),
    db.account.delete({
      where: { id: accountId }
    })
  ])

  return NextResponse.json({ message: "Account deleted" })
}