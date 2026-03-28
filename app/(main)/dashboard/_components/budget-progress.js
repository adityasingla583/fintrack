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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Monthly Account Budget <p className="inline text-gray-500">(Default Account)</p>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ⭐ Spendings Section */}
        <div className="flex justify-between items-center text-sm">

          <div className="flex items-center gap-2 text-red-500">
            <ArrowDownRight size={16}/>
            <span>₹ {monthlySpend}</span>
            <span className="text-muted-foreground text-xs">
              (Spent this month)
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
      </CardContent>
    </Card>
  );
}