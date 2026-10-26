import { Suspense } from "react";
import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import DashboardOverview from "./_components/transaction-overview";
import { getAccountBudgetStats } from "@/actions/accounts";

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          {accounts?.length > 0 &&
            accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
        </div>
      </div>
    </div>
  );
}
