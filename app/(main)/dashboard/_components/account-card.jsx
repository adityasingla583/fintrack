"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowDownRight, ArrowUpRight, Building2, Loader2, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import React from "react";
import DeleteAccountModal from "./delete-otp";

const AccountCard = ({
  account,
  isUpdating = false,
  onDefaultToggle,
}) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const { name, type, balance, id, isDefault } = account;

  const numBalance = parseFloat(balance) || 0;

  return (
    <Card className="hover:shadow-md transition-all group relative border-border/60 bg-card hover:border-primary/40 overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            {type === "SAVINGS" ? (
              <Wallet className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
          <div>
            <CardTitle className="text-sm font-semibold capitalize text-foreground">
              {name}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
              {type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            Default
          </span>
          {isUpdating && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
          <Switch
            checked={Boolean(isDefault)}
            onCheckedChange={onDefaultToggle}
            disabled={isUpdating}
          />
        </div>
      </CardHeader>

      <Link href={`/account/${id}`} className="block">
        <CardContent className="pt-2 pb-4">
          <span className="text-xs text-muted-foreground font-medium">
            Available Balance
          </span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            ₹{numBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Link>

      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/40 pt-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
            Income
          </div>

          <div className="flex items-center text-rose-600 dark:text-rose-400 font-medium">
            <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
            Expense
          </div>
        </div>

        {!isDefault && (
          <>
            <button
              onClick={() => setOpenDeleteModal(true)}
              className="text-muted-foreground hover:text-rose-600 transition-colors p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              title="Delete account"
            >
              <Trash2 size={16} />
            </button>

            <DeleteAccountModal
              open={openDeleteModal}
              setOpen={setOpenDeleteModal}
              accountId={id}
            />
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default AccountCard;
