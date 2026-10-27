"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PostReloadToast() {
  useEffect(() => {
    try {
      const msg = sessionStorage.getItem("fintrack_reload_toast");
      if (msg) {
        sessionStorage.removeItem("fintrack_reload_toast");
        toast.success(msg, { duration: 4000 });
      }
    } catch (e) {
      // Ignore storage access errors
    }
  }, []);

  return null;
}
