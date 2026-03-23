"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function DeleteAccountModal({ open, setOpen, accountId }) {

  const [otp, setOtp] = useState("")
  const [sending, setsending] = useState(false)
  const router = useRouter()

  // ⭐ AUTO REQUEST OTP WHEN MODAL OPENS
  useEffect(() => {

    if (!open) return

    const requestOtp = async () => {

      const res = await fetch("/api/account/delete/request", {
        method: "POST",
        body: JSON.stringify({ accountId })
      })

      const data = await res.json()

      toast.success(data.message)

    }

    requestOtp()

  }, [open, accountId])



  const verifyOtp = async () => {

    const res = await fetch("/api/account/delete/verify", {
      method: "POST",
      body: JSON.stringify({
        otp,
        accountId
      })
    })

    const data = await res.json()

    if (data.message === "Time expired") {
      toast.error("Time expired. Request again")
      setOpen(false)
      return
    }

    if (data.message === "Invalid OTP") {
      toast.error("Invalid OTP")
      return
    }

    if (data.message === "Account deleted") {
      toast.success("Account deleted")
      setOpen(false)
      router.refresh()
    }

  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white p-6 rounded-lg">

        <h3 className="mb-3 font-semibold">Enter OTP</h3>

        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="border p-2 rounded mb-3"
        />

        <div className="flex gap-3">
          <button
            disabled={sending}
            onClick={verifyOtp}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            {sending ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            onClick={() => setOpen(false)}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>

      </div>

    </div>
  )
}