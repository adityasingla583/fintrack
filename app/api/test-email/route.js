import { sendEmailDirect } from "@/lib/email/send"
import { NextResponse } from "next/server"

export async function GET() {

  try {

    const data = await sendEmailDirect({
      from: "FinTrack <onboarding@resend.dev>",
      to: "test@gmail.com",   // ⭐ put your real email
      subject: "Resend Test Email",
      html: "<h1>Resend is working ✅</h1>"
    })

    console.log("RESEND RESPONSE:", data)

    return NextResponse.json({
      success: true,
      data
    })

  } catch (err) {

    console.error("RESEND ERROR:", err)

    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })

  }

}