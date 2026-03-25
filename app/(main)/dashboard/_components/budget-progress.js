"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function BudgetProgress({
  accountId,
  budget,
  monthlySpend,
  yearlySpend
}) {

  const percentUsed =
    budget > 0 ? Math.min((monthlySpend / budget) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Monthly Account Budget
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ⭐ Spendings Section */}
        <div className="flex justify-between items-center text-sm">

          <div className="flex items-center gap-2 text-red-500">
            <ArrowDownRight size={16}/>
            <span>₹ {monthlySpend}</span>
            <span className="text-muted-foreground text-xs">
              (Spent)
            </span>
          </div>

          <div className="flex items-center gap-2 text-green-500">
            <ArrowUpRight size={16}/>
            <span>₹ {budget}</span>
            <span className="text-muted-foreground text-xs">
              (Remaining)
            </span>
          </div>

        </div>

        {/* Budget */}
        <div className="text-sm flex justify-between">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-semibold">₹ {budget}</span>
        </div>

      </CardContent>
    </Card>
  );
}