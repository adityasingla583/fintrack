"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function DeleteAccountModal({ open, setOpen, accountId }) {

  const [otp, setOtp] = useState("")
  const [sending, setsending] = useState(false)
  const router = useRouter()

  // ⭐ AUTO REQUEST OTP WHEN MODAL OPENS & LOCK BODY SCROLL
  useEffect(() => {

    if (open) {
      // Disable body scroll when modal opens
      document.body.style.overflow = "hidden"
    } else {
      // Re-enable body scroll when modal closes
      document.body.style.overflow = "unset"
    }

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

    // Cleanup: re-enable scroll on unmount
    return () => {
      document.body.style.overflow = "unset"
    }

  }, [open, accountId])

  const verifyOtp = async () => {

    setsending(true)

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
      setsending(false)
      return
    }

    if (data.message === "Invalid OTP") {
      toast.error("Invalid OTP")
      setsending(false)
      return
    }

    if (data.message === "Account deleted") {
      toast.success("Account deleted")
      setOpen(false)
      setsending(false)
      router.refresh()
    }

  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full mx-4">

        <h3 className="mb-4 font-semibold text-lg text-gray-900">Enter OTP</h3>

        <p className="text-sm text-gray-600 mb-4">
          Please enter the OTP below to confirm account deletion.
        </p>

        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          type="text"
          maxLength="6"
          className="w-full border border-gray-300 p-3 rounded mb-4 text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <div className="flex gap-3">
          <button
            disabled={sending}
            onClick={verifyOtp}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            {sending ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            onClick={() => setOpen(false)}
            disabled={sending}
            className="flex-1 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded font-medium transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>

    </div>
  )
}