"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Pencil,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { updateBudget } from "@/actions/budget";
import { toast } from "sonner";

export function BudgetProgress({
  accountId,
  initialBudget = 0,
  currentExpenses = 0,
  yearlySpend = 0,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget ? initialBudget.toString() : ""
  );

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const currentBudgetValue =
    updatedBudget?.success && updatedBudget?.data?.amount !== undefined
      ? updatedBudget.data.amount
      : initialBudget;

  const percentUsed =
    currentBudgetValue > 0
      ? Math.min(Math.round((currentExpenses / currentBudgetValue) * 100), 100)
      : 0;

  const remaining = currentBudgetValue - currentExpenses;

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid positive budget amount");
      return;
    }

    await updateBudgetFn(accountId, amount);
  };

  const handleCancel = () => {
    setNewBudget(initialBudget ? initialBudget.toString() : "");
    setIsEditing(false);
  };

  // Sync state on success
  if (updatedBudget?.success && isEditing) {
    setIsEditing(false);
    toast.success("Monthly budget updated successfully");
  }

  if (error && isEditing) {
    toast.error(error.message || "Failed to update budget");
  }

  const isOverBudget = currentBudgetValue > 0 && currentExpenses > currentBudgetValue;
  const isNearBudget = currentBudgetValue > 0 && percentUsed >= 80 && !isOverBudget;

  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm hover:shadow-md transition-all">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold tracking-tight">
              Monthly Budget
            </CardTitle>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Default Account
            </span>
          </div>
          <CardDescription className="text-xs">
            Track and control monthly spending against your target
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={handleUpdateBudget}
                disabled={isLoading}
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={isLoading}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewBudget(currentBudgetValue ? currentBudgetValue.toString() : "");
                setIsEditing(true);
              }}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>{currentBudgetValue > 0 ? "Edit Budget" : "Set Budget"}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Budget Value & Editing Row */}
        {isEditing ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
            <span className="text-sm font-medium text-muted-foreground">₹</span>
            <Input
              type="number"
              step="100"
              placeholder="e.g. 50000"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="max-w-[200px] h-9 font-semibold"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateBudget();
                if (e.key === "Escape") handleCancel();
              }}
            />
            <span className="text-xs text-muted-foreground">
              Press Enter to save
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-xs font-medium text-muted-foreground block mb-1">
                Allocated Budget
              </span>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                ₹{currentBudgetValue.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Spent this Month
                </span>
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                ₹{currentExpenses.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Remaining
                </span>
                <ArrowUpRight
                  className={`h-3.5 w-3.5 ${
                    remaining >= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                />
              </div>
              <span
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  remaining >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                ₹{Math.abs(remaining).toLocaleString("en-IN")}{" "}
                {remaining < 0 && (
                  <span className="text-xs font-normal text-rose-500">(Over)</span>
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Year-to-Date
                </span>
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                ₹{yearlySpend.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {currentBudgetValue > 0 ? (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 font-medium">
                <span
                  className={
                    isOverBudget
                      ? "text-rose-600 dark:text-rose-400 font-semibold"
                      : isNearBudget
                      ? "text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-foreground"
                  }
                >
                  {isOverBudget
                    ? `Budget exceeded by ${(
                        ((currentExpenses - currentBudgetValue) /
                          currentBudgetValue) *
                        100
                      ).toFixed(0)}%`
                    : `${percentUsed}% utilized`}
                </span>
              </div>
              <span className="text-muted-foreground">
                {currentExpenses > currentBudgetValue
                  ? "₹0 left"
                  : `₹${remaining.toLocaleString("en-IN")} remaining`}
              </span>
            </div>

            <Progress
              value={percentUsed}
              className={`h-2.5 rounded-full ${
                isOverBudget
                  ? "[&>div]:bg-rose-500"
                  : isNearBudget
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-indigo-600"
              }`}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg border border-dashed text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>No monthly budget set for this account yet. Click "Set Budget" to get insights and alerts.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
