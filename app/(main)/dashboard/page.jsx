import { Suspense } from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import DashboardOverview from "./_components/transaction-overview";
import { getAccountBudgetStats } from "@/actions/accounts";

export default async function DashboardPage() {
  const [accounts, transaction] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  const transactions = await getDashboardData(defaultAccount?.id);
  const stats = await getAccountBudgetStats(defaultAccount?.id);

  return (
    <div className="space-y-8">
      {/* Budget Progress */}
      {defaultAccount && (
        <BudgetProgress
        accountId={defaultAccount.id}
        budget={budgetData?.remainingBudget || 0}
        monthlySpend={stats?.monthlySpend || 0}
        yearlySpend={stats?.yearlySpend || 0}
      />
      )}

      {/* Dashboard Overview */}
      <Suspense fallback={<div>Loading overview...</div>}>
      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />
      </Suspense>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
}