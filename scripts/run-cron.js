require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function runAllCronJobs() {
  console.log("=========================================");
  console.log("🚀 STARTING MANUAL CRON JOB RUNNER");
  console.log("=========================================\n");

  /* ----------------------------------------------------
     1. Recurring Transactions Processing
  ---------------------------------------------------- */
  console.log("▶ [1/3] Checking Due Recurring Transactions...");
  const now = new Date();
  const dueRecurring = await prisma.transaction.findMany({
    where: {
      isRecurring: true,
      status: "COMPLETED",
      OR: [
        { lastProcessed: null },
        { nextRecurringDate: { lte: now } }
      ]
    },
    include: {
      account: true
    }
  });

  console.log(`Found ${dueRecurring.length} due recurring transaction(s).`);

  let processedCount = 0;
  for (const txn of dueRecurring) {
    try {
      const amt = txn.amount.toNumber();
      await prisma.$transaction(async (tx) => {
        // Create duplicate instance
        await tx.transaction.create({
          data: {
            type: txn.type,
            amount: txn.amount,
            description: `${txn.description || "Recurring Transaction"} (Auto)`,
            date: new Date(),
            category: txn.category,
            userId: txn.userId,
            accountId: txn.accountId,
            isRecurring: false,
          }
        });

        // Update account balance
        await tx.account.update({
          where: { id: txn.accountId },
          data: {
            balance: {
              increment: txn.type === "EXPENSE" ? -amt : amt
            }
          }
        });

        // Calculate next recurring date
        const nextDate = new Date(now);
        switch (txn.recurringInterval) {
          case "DAILY": nextDate.setDate(nextDate.getDate() + 1); break;
          case "WEEKLY": nextDate.setDate(nextDate.getDate() + 7); break;
          case "MONTHLY": nextDate.setMonth(nextDate.getMonth() + 1); break;
          case "YEARLY": nextDate.setFullYear(nextDate.getFullYear() + 1); break;
          default: nextDate.setMonth(nextDate.getMonth() + 1); break;
        }

        // Advance recurring txn
        await tx.transaction.update({
          where: { id: txn.id },
          data: {
            lastProcessed: now,
            nextRecurringDate: nextDate
          }
        });
      });
      processedCount++;
      console.log(`  ✓ Processed recurring transaction "${txn.description}" (₹${txn.amount})`);
    } catch (err) {
      console.error(`  ✗ Error processing transaction ${txn.id}:`, err.message);
    }
  }

  /* ----------------------------------------------------
     2. Budget Alerts Check
  ---------------------------------------------------- */
  console.log("\n▶ [2/3] Checking Active Budgets & Alert Thresholds (>=80%)...");
  const budgets = await prisma.budget.findMany({
    include: {
      account: {
        include: {
          user: true
        }
      }
    }
  });

  console.log(`Found ${budgets.length} budget configuration(s).`);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  for (const b of budgets) {
    const budgetAmount = Number(b.amount);
    if (!budgetAmount || budgetAmount <= 0) {
      console.log(`  - Account "${b.account?.name}": No budget set.`);
      continue;
    }

    const expensesAgg = await prisma.transaction.aggregate({
      where: {
        userId: b.account.userId,
        accountId: b.account.id,
        type: "EXPENSE",
        date: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    const totalExpenses = expensesAgg._sum.amount ? expensesAgg._sum.amount.toNumber() : 0;
    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    console.log(`  - Account "${b.account?.name}": Budget = ₹${budgetAmount}, Current Month Spent = ₹${totalExpenses} (${percentageUsed.toFixed(1)}%)`);

    if (percentageUsed >= 80) {
      console.log(`    ⚠️ Threshold reached (${percentageUsed.toFixed(1)}% >= 80%). Sending Budget Alert Email to ${b.account.user.email}...`);
      try {
        const emailRes = await resend.emails.send({
          from: "FinTrack <onboarding@resend.dev>",
          to: b.account.user.email,
          subject: `⚠️ Budget Alert: You have used ${percentageUsed.toFixed(0)}% of your monthly budget`,
          html: `
            <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 500px;">
              <h2 style="color: #f87171; margin-top: 0;">⚠️ Budget Threshold Alert</h2>
              <p>Hello ${b.account.user.name || "FinTrack User"},</p>
              <p>You have utilized <strong>${percentageUsed.toFixed(1)}%</strong> of your monthly allocated budget on your <strong>${b.account.name}</strong> account.</p>
              <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Budget Limit:</strong> ₹${budgetAmount.toLocaleString("en-IN")}</p>
                <p style="margin: 4px 0;"><strong>Spent So Far:</strong> ₹${totalExpenses.toLocaleString("en-IN")}</p>
                <p style="margin: 4px 0;"><strong>Remaining:</strong> ₹${(budgetAmount - totalExpenses).toLocaleString("en-IN")}</p>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} FinTrack Automated Notifications</p>
            </div>
          `
        });
        console.log(`    ✓ Budget alert email dispatched! ID: ${emailRes.data?.id || JSON.stringify(emailRes)}`);
        
        await prisma.budget.update({
          where: { id: b.id },
          data: { lastAlertSent: now }
        });
      } catch (emailErr) {
        console.error(`    ✗ Failed to send budget alert email:`, emailErr.message);
      }
    } else {
      console.log(`    ✓ Budget within safe limits (<80%).`);
    }
  }

  /* ----------------------------------------------------
     3. Monthly Reports Generation & AI Insights
  ---------------------------------------------------- */
  console.log("\n▶ [3/3] Generating Monthly Financial Reports & AI Insights...");
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} registered user(s).`);

  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  for (const user of users) {
    if (!user.email) continue;
    console.log(`  - Processing user: ${user.name || "User"} (${user.email})`);

    const userTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfMonth }
      }
    });

    const stats = userTransactions.reduce((acc, t) => {
      const amt = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        acc.totalExpenses += amt;
        acc.byCategory[t.category] = (acc.byCategory[t.category] || 0) + amt;
      } else {
        acc.totalIncome += amt;
      }
      return acc;
    }, { totalExpenses: 0, totalIncome: 0, byCategory: {} });

    console.log(`    Stats: Income: ₹${stats.totalIncome}, Expenses: ₹${stats.totalExpenses}, Transactions: ${userTransactions.length}`);

    console.log(`    Dispatched Monthly Report Email to ${user.email}...`);
    try {
      const emailRes = await resend.emails.send({
        from: "FinTrack <onboarding@resend.dev>",
        to: user.email,
        subject: `📊 Your Financial Report - ${monthLabel}`,
        html: `
          <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 500px;">
            <h2 style="color: #60a5fa; margin-top: 0;">📊 FinTrack Monthly Report</h2>
            <p>Hello ${user.name || "FinTrack User"},</p>
            <p>Here is your current financial summary for <strong>${monthLabel}</strong>:</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0; color: #34d399;"><strong>Total Income:</strong> ₹${stats.totalIncome.toLocaleString("en-IN")}</p>
              <p style="margin: 4px 0; color: #f87171;"><strong>Total Expenses:</strong> ₹${stats.totalExpenses.toLocaleString("en-IN")}</p>
              <p style="margin: 4px 0; color: #60a5fa;"><strong>Net Savings:</strong> ₹${(stats.totalIncome - stats.totalExpenses).toLocaleString("en-IN")}</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} FinTrack Automated Notifications</p>
          </div>
        `
      });
      console.log(`    ✓ Monthly report email dispatched! ID: ${emailRes.data?.id || JSON.stringify(emailRes)}`);
    } catch (e) {
      console.error(`    ✗ Failed to dispatch monthly report:`, e.message);
    }
  }

  console.log("\n=========================================");
  console.log("✅ ALL CRON JOBS EXECUTED SUCCESSFULLY");
  console.log("=========================================\n");
}

runAllCronJobs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
