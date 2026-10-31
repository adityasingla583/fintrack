import { Suspense } from "react";
import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { BudgetProgress } from "./_components/budget-progress";
import { getCurrentBudget } from "@/actions/budget";
import DashboardOverview from "./_components/transaction-overview";
import { getAccountBudgetStats } from "@/actions/accounts";
import { AccountsGrid } from "./_components/accounts-grid";

export default async function DashboardPage() {
  const [accounts, defaultTransactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Get budget & stats for default account
  let budgetData = null;
  let stats = null;
  if (defaultAccount) {
    [budgetData, stats] = await Promise.all([
      getCurrentBudget(defaultAccount.id),
      getAccountBudgetStats(defaultAccount.id),
    ]);
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner / Budget Progress */}
      {defaultAccount && (
        <BudgetProgress
          accountId={defaultAccount.id}
          initialBudget={budgetData?.budget || 0}
          currentExpenses={stats?.monthlySpend || 0}
          yearlySpend={stats?.yearlySpend || 0}
        />
      )}

      {/* Dashboard Overview Charts & Recents */}
      <Suspense fallback={<div className="h-48 rounded-xl bg-muted/40 animate-pulse" />}>
        <DashboardOverview
          accounts={accounts || []}
          transactions={defaultTransactions || []}
        />
      </Suspense>

      {/* Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Your Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Manage your linked savings and checking accounts
            </p>
          </div>
        </div>

        <AccountsGrid accounts={accounts || []} />
      </div>
    </div>
  );
}
