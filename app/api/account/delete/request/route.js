import crypto from "crypto"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { sendEmailDirect } from "@/lib/email/send"
import { db } from "@/lib/prisma"
import otpEmailTemplate from "@/emails/otptemplate"

export async function POST(req) {

  const { accountId } = await req.json()

  const { userId: clerkUserId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkUserId }
  })

  const account = await db.account.findUnique({
    where: { id: accountId }
  })

  if (!account || account.userId !== user.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  console.log("OTP is : ", otp);
  console.log("email is : ", user.email);

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  await db.deleteAccountOtp.deleteMany({
    where: { accountId }
  })

  await db.deleteAccountOtp.create({
    data: {
      accountId,
      otpHash,
      expiresAt
    }
  })

  const html = otpEmailTemplate({
    otp,
    action: "confirm deletion of your account",
    expiryMinutes: 5,
    appName: "FinTrack"
  })

  const data = await sendEmailDirect({
    from:"FinTrack <onboarding@resend.dev>",
    to: user.email,
    subject: "OTP Verification",
    html
  })

  console.log("Email sent : ", data);

  return NextResponse.json({ message: "OTP sent" })
}