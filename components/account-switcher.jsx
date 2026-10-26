"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, CreditCard, Building2, Wallet, Loader2 } from "lucide-react";
import { updateDefaultAccount } from "@/actions/accounts";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function AccountSwitcher({ accounts = [] }) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    loading: isUpdating,
    fn: updateDefaultFn,
  } = useFetch(updateDefaultAccount);

  if (!accounts || accounts.length === 0) {
    return null;
  }

  const currentDefault = accounts.find((a) => a.isDefault) || accounts[0];

  const handleSelectAccount = async (account) => {
    // If user is inside an /account/[id] view, navigate directly
    if (pathname.startsWith("/account/")) {
      router.push(`/account/${account.id}`);
      return;
    }

    if (account.id === currentDefault.id) {
      router.push(`/account/${account.id}`);
      return;
    }

    // ⭐ Show instant loading toast immediately
    const toastId = toast.loading(`Switching default account to "${account.name}"...`);

    try {
      const res = await updateDefaultFn(account.id);
      if (res?.success) {
        toast.success(`Default account switched to "${account.name}"`, { id: toastId });
        // Full window reload to guarantee all server components & navbar refresh immediately
        window.location.reload();
      } else {
        toast.error(res?.error || "Failed to switch default account", { id: toastId });
      }
    } catch (err) {
      toast.error(err.message || "Failed to switch default account", { id: toastId });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isUpdating}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/60 text-xs font-medium text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
        title="Active account / Switch account"
      >
        {isUpdating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            {currentDefault.type === "SAVINGS" ? (
              <Wallet className="h-2.5 w-2.5" />
            ) : (
              <Building2 className="h-2.5 w-2.5" />
            )}
          </div>
        )}
        <span className="max-w-[100px] truncate font-semibold">
          {currentDefault.name}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 ml-0.5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg border-border/60">
        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
          Switch Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {accounts.map((acc) => {
          const isSelected = acc.id === currentDefault.id;
          const numBal = parseFloat(acc.balance) || 0;

          return (
            <DropdownMenuItem
              key={acc.id}
              onClick={() => handleSelectAccount(acc)}
              className="flex items-center justify-between py-2 px-2.5 rounded-md cursor-pointer hover:bg-muted text-xs group"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-md flex items-center justify-center ${
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <CreditCard className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    <span>{acc.name}</span>
                    {acc.isDefault && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.2 rounded font-semibold">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    ₹{numBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
