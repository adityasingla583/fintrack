"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Inbox, PieChart as PieIcon } from "lucide-react";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const emptySubscribe = () => () => {};

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#64748b", // slate
];

const DashboardOverview = ({ accounts, transactions }) => {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Always select the default account first, fallback to accounts[0]
  const getDefaultAccountId = () => {
    if (!accounts?.length) return undefined;
    const defaultAcc = accounts.find((acc) => acc.isDefault);
    return defaultAcc ? defaultAcc.id : accounts[0].id;
  };

  const [selectedAccountId, setSelectedAccountId] = useState(getDefaultAccountId);
  const [prevAccounts, setPrevAccounts] = useState(accounts);

  // Sync when accounts prop updates from server revalidation
  if (accounts !== prevAccounts) {
    setPrevAccounts(accounts);
    const defaultAcc = accounts?.find((acc) => acc.isDefault);
    if (defaultAcc && defaultAcc.id !== selectedAccountId) {
      setSelectedAccountId(defaultAcc.id);
    }
  }

  // Also listen for instant default account changes
  useEffect(() => {
    const handleExternalDefaultChange = (e) => {
      const newDefaultId = e.detail;
      if (newDefaultId) {
        setSelectedAccountId(newDefaultId);
      }
    };
    window.addEventListener("fintrack:default-account-changed", handleExternalDefaultChange);
    return () => {
      window.removeEventListener("fintrack:default-account-changed", handleExternalDefaultChange);
    };
  }, []);

  const accountTransactions = transactions.filter(
    (t) => t.accountId === selectedAccountId
  );

  // Get recent transactions (last 5)
  const recentTransactions = [...accountTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Calculate expense breakdown for current month
  const currentDate = new Date();
  const currentMonthExpenses = accountTransactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      t.type === "EXPENSE" &&
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Group expenses by category
  const expensesByCategory = currentMonthExpenses.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += transaction.amount;
    return acc;
  }, {});

  // Format data for pie chart
  const pieChartData = Object.entries(expensesByCategory).map(
    ([category, amount]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1).replace("-", " "),
      value: amount,
    })
  );

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Recent Transactions Card */}
      <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold tracking-tight">
                Recent Transactions
              </CardTitle>
              {selectedAccount?.isDefault && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest activities on {selectedAccount?.name || "this account"}
            </p>
          </div>

          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue>
                {selectedAccount?.name || "Select account"}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} {account.isDefault ? "(Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No recent transactions</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transactions will appear here once logged
                </p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {transaction.description || "Untitled Transaction"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), "PP")}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex items-center text-sm font-semibold",
                      transaction.type === "EXPENSE"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {transaction.type === "EXPENSE" ? (
                      <ArrowDownRight className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                    )}
                    {transaction.type === "EXPENSE" ? "-" : "+"}₹
                    {transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown Card */}
      <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Monthly Expense Breakdown
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Distribution by category for current month ({selectedAccount?.name || "Account"})
          </p>
        </CardHeader>

        <CardContent className="pt-2 pb-4">
          {pieChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <PieIcon className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">No expenses this month</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Spendings in this month will generate breakdown charts
              </p>
            </div>
          ) : (
            <div className="w-full min-w-0 h-[280px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Spent"]}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--foreground)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
