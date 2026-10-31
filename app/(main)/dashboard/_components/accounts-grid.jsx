"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateDefaultAccount } from "@/actions/accounts";
import AccountCard from "./account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function AccountsGrid({ accounts: initialAccounts = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accountsList, setAccountsList] = useState(initialAccounts);
  const [loadingAccountId, setLoadingAccountId] = useState(null);

  // Sync state whenever server re-renders and passes updated initialAccounts
  useEffect(() => {
    setAccountsList(initialAccounts);
  }, [initialAccounts]);

  // Synchronize when default account changes elsewhere (e.g. from header AccountSwitcher)
  useEffect(() => {
    const handleExternalDefaultChange = (e) => {
      const newDefaultId = e.detail;
      if (!newDefaultId) return;

      setAccountsList((prev) =>
        prev.map((acc) => ({
          ...acc,
          isDefault: acc.id === newDefaultId,
        }))
      );
    };

    window.addEventListener(
      "fintrack:default-account-changed",
      handleExternalDefaultChange
    );
    return () => {
      window.removeEventListener(
        "fintrack:default-account-changed",
        handleExternalDefaultChange
      );
    };
  }, []);

  const handleDefaultToggle = async (account) => {
    // If account is already default, prevent toggling it off
    if (account.isDefault) {
      toast.warning("You must have at least one default account");
      return;
    }

    const previousAccounts = accountsList;

    // 1. Instantly update all account cards in place (optimistic UI)
    setAccountsList((prev) =>
      prev.map((acc) => ({
        ...acc,
        isDefault: acc.id === account.id,
      }))
    );
    setLoadingAccountId(account.id);

    // Notify header switcher immediately so its label and checkmark match
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("fintrack:default-account-changed", {
          detail: account.id,
        })
      );
    }

    const toastId = toast.loading(`Setting "${account.name}" as your default account...`);

    try {
      const result = await updateDefaultAccount(account.id);

      if (result?.success) {
        toast.success(`"${account.name}" is now your default account!`, {
          id: toastId,
        });

        // Seamlessly refresh server components (charts, budget bar, overview) without reloading the page
        startTransition(() => {
          router.refresh();
        });
      } else {
        // Rollback optimistic state
        setAccountsList(previousAccounts);
        if (typeof window !== "undefined") {
          const oldDefault = previousAccounts.find((a) => a.isDefault);
          if (oldDefault) {
            window.dispatchEvent(
              new CustomEvent("fintrack:default-account-changed", {
                detail: oldDefault.id,
              })
            );
          }
        }
        toast.error(result?.error || "Failed to update default account", {
          id: toastId,
        });
      }
    } catch (err) {
      // Rollback on network / unexpected error
      setAccountsList(previousAccounts);
      if (typeof window !== "undefined") {
        const oldDefault = previousAccounts.find((a) => a.isDefault);
        if (oldDefault) {
          window.dispatchEvent(
            new CustomEvent("fintrack:default-account-changed", {
              detail: oldDefault.id,
            })
          );
        }
      }
      toast.error(err.message || "Failed to update default account", {
        id: toastId,
      });
    } finally {
      setLoadingAccountId(null);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Create New Account Button Card */}
      <CreateAccountDrawer>
        <Card className="hover:shadow-md transition-all cursor-pointer border-dashed border-2 hover:border-primary/50 group bg-card/50">
          <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full py-10 group-hover:text-primary transition-colors">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold">Add New Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track another bank or card
            </p>
          </CardContent>
        </Card>
      </CreateAccountDrawer>

      {/* Account Cards */}
      {accountsList.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          isUpdating={loadingAccountId === account.id || (isPending && loadingAccountId !== null)}
          onDefaultToggle={() => handleDefaultToggle(account)}
        />
      ))}
    </div>
  );
}
