import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/accounts";
import { BarLoader } from "react-spinners";
import { TransactionTable } from "../_components/transaction-table";
import { notFound } from "next/navigation";
import { AccountChart } from "../_components/account-chart";
import { Button } from "@/components/ui/button";
import { Download, Wallet } from "lucide-react";

export default async function AccountPage({ params }) {
  const { id } = await params;

  const accountData = await getAccountWithTransactions(id);

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;
  const numBalance = parseFloat(account.balance) || 0;

  return (
    <div className="space-y-8 px-4 sm:px-6 max-w-7xl mx-auto pb-12">
      {/* Account Header Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground capitalize">
              {account.name}
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
              {account.type} Account {account.isDefault && "• Default"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-col sm:items-end justify-between items-center gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
          <div className="sm:text-right">
            <span className="text-xs text-muted-foreground font-medium block">
              Current Balance
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              ₹{numBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {account._count.transactions} Total Transactions
            </p>
          </div>

          <a href={`/api/transactions/export?accountId=${account.id}`} download>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-8 border-border/70 hover:bg-muted/50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Chart Section */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#4f46e5" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transactions Table */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#4f46e5" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
