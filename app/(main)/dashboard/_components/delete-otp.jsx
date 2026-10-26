"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

export default function DeleteAccountModal({ open, setOpen, accountId }) {
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const router = useRouter();

  // ⭐ AUTO REQUEST OTP WHEN MODAL OPENS & LOCK BODY SCROLL
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setOtp("");
    }

    if (!open) return;

    const requestOtp = async () => {
      setRequestingOtp(true);
      const toastId = toast.loading("Sending deletion verification OTP to your email...");

      try {
        const res = await fetch("/api/account/delete/request", {
          method: "POST",
          body: JSON.stringify({ accountId }),
        });

        const data = await res.json();
        if (res.ok) {
          toast.success("Security OTP sent to your registered email!", { id: toastId });
        } else {
          toast.error(data.message || "Failed to send OTP", { id: toastId });
        }
      } catch (e) {
        toast.error("Failed to send OTP. Please try again.", { id: toastId });
      } finally {
        setRequestingOtp(false);
      }
    };

    requestOtp();

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, accountId]);

  const verifyOtp = async () => {
    if (!otp || otp.trim().length < 6) {
      toast.warning("Please enter the 6-digit verification code");
      return;
    }

    setSending(true);
    // ⭐ Show instant early notification
    const toastId = toast.loading("Verifying security code & deleting account...");

    try {
      const res = await fetch("/api/account/delete/verify", {
        method: "POST",
        body: JSON.stringify({
          otp: otp.trim(),
          accountId,
        }),
      });

      const data = await res.json();

      if (data.message === "Time expired") {
        toast.error("Code expired. Please request a new code.", { id: toastId });
        setOpen(false);
        setSending(false);
        return;
      }

      if (data.message === "Invalid OTP") {
        toast.error("Invalid verification code. Please check your email.", { id: toastId });
        setSending(false);
        return;
      }

      if (data.message === "Account deleted") {
        toast.success("Account successfully deleted!", { id: toastId });
        setOpen(false);
        setSending(false);
        router.refresh();
      } else {
        toast.error(data.message || "Account deletion failed", { id: toastId });
        setSending(false);
      }
    } catch (e) {
      toast.error("Network error while deleting account", { id: toastId });
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-200">
      <div className="bg-card text-card-foreground p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-border/70 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              Delete Account
            </h3>
            <p className="text-xs text-muted-foreground">
              Two-Factor Email Verification
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          For your security, enter the 6-digit verification code sent to your email to permanently delete this account.
        </p>

        <div className="relative">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="• • • • • •"
            type="text"
            maxLength="6"
            disabled={requestingOtp || sending}
            autoFocus
            className="w-full border border-input bg-background p-3 rounded-xl text-center text-xl font-mono tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40"
          />
          {requestingOtp && (
            <div className="absolute right-3 top-3.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={sending}
            className="flex-1 border border-border/80 bg-background hover:bg-muted text-foreground px-4 py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={sending || requestingOtp}
            onClick={verifyOtp}
            className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-destructive/20"
          >
            {sending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              "Confirm Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
