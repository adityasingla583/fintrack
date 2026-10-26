import { inngest } from "./client";
import { db } from "@/lib/prisma";
import { sendEmailDirect } from "@/lib/email/send";
import React from "react";
import { render } from "@react-email/render";
import EmailTemplate from "@/emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================================================================
   1. Recurring Transactions Execution (Cron: Daily at midnight)
   ========================================================================= */
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-due-recurring-transactions",
      async () => {
        return db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              { nextRecurringDate: { lte: new Date() } },
            ],
          },
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            category: true,
            userId: true,
            accountId: true,
            recurringInterval: true,
            nextRecurringDate: true,
          },
        });
      }
    );

    if (!recurringTransactions.length) {
      return { message: "No recurring transactions due" };
    }

    const events = recurringTransactions.map((tx) => ({
      name: "transaction.recurring.process",
      data: {
        transactionId: tx.id,
        userId: tx.userId,
      },
    }));

    await step.sendEvent("emit-recurring-tx-events", events);

    return { triggered: recurringTransactions.length };
  }
);

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    const { transactionId, userId } = event.data;

    await step.run("create-next-transaction-instance", async () => {
      const txn = await db.transaction.findFirst({
        where: { id: transactionId, userId },
      });

      if (!txn) return { skipped: true, reason: "Transaction not found" };

      const isDue =
        !txn.nextRecurringDate || new Date(txn.nextRecurringDate) <= new Date();
      if (!isDue) return { skipped: true, reason: "Not due yet" };

      const amountNumber = txn.amount.toNumber();

      await db.$transaction(async (tx) => {
        // 1. Create the new transaction instance
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
          },
        });

        // 2. Update account balance
        await tx.account.update({
          where: { id: txn.accountId },
          data: {
            balance: {
              increment: txn.type === "EXPENSE" ? -amountNumber : amountNumber,
            },
          },
        });

        // 3. Advance nextRecurringDate and mark lastProcessed
        await tx.transaction.update({
          where: { id: txn.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              txn.recurringInterval
            ),
          },
        });
      });

      return { success: true };
    });
  }
);

/* =========================================================================
   2. Budget Alerts Check (Cron: Every 6 hours)
   ========================================================================= */
export const checkBudgetAlerts = inngest.createFunction(
  {
    id: "check-budget-alerts",
    name: "Check Budget Alerts",
  },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-active-budgets", async () => {
      return db.budget.findMany({
        include: {
          account: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      await step.run(`check-budget-${budget.id}`, async () => {
        const budgetAmount = Number(budget.amount);
        if (!budgetAmount || budgetAmount <= 0) return;

        const defaultAccount = budget.account;
        if (!defaultAccount || !defaultAccount.user?.email) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Don't spam if an alert was already sent in the current month
        if (
          budget.lastAlertSent &&
          new Date(budget.lastAlertSent) >= startOfMonth
        ) {
          return;
        }

        // Calculate current month's expenses
        const expenses = await db.transaction.aggregate({
          where: {
            userId: defaultAccount.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: { gte: startOfMonth },
          },
          _sum: { amount: true },
        });

        const totalExpenses = expenses._sum.amount
          ? expenses._sum.amount.toNumber()
          : 0;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        // Alert threshold: 80% or higher
        if (percentageUsed >= 80) {
          const html = await render(
            React.createElement(EmailTemplate, {
              username: defaultAccount.user.name || "FinTrack User",
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount,
                totalExpenses,
                accountName: defaultAccount.name,
              },
            })
          );

          await sendEmailDirect({
            from: "FinTrack <onboarding@resend.dev>",
            to: defaultAccount.user.email,
            subject: `⚠️ Budget Alert: You have used ${percentageUsed.toFixed(0)}% of your monthly budget`,
            html,
          });

          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }

    return { checked: budgets.length };
  }
);

/* =========================================================================
   3. Monthly Financial Reports (Cron: 1st of every month at midnight)
   ========================================================================= */
export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return db.user.findMany({
        select: { id: true, email: true, name: true },
      });
    });

    const now = new Date();
    // Prior month calculation
    const priorMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfPriorMonth = new Date(
      priorMonthDate.getFullYear(),
      priorMonthDate.getMonth(),
      1
    );
    const endOfPriorMonth = new Date(
      priorMonthDate.getFullYear(),
      priorMonthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const monthLabel = priorMonthDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    for (const user of users) {
      if (!user.email) continue;

      await step.run(`generate-report-${user.id}`, async () => {
        const transactions = await db.transaction.findMany({
          where: {
            userId: user.id,
            date: {
              gte: startOfPriorMonth,
              lte: endOfPriorMonth,
            },
          },
        });

        if (!transactions.length) return { skipped: true };

        const stats = transactions.reduce(
          (acc, t) => {
            const amount = t.amount.toNumber();
            if (t.type === "EXPENSE") {
              acc.totalExpenses += amount;
              acc.byCategory[t.category] =
                (acc.byCategory[t.category] || 0) + amount;
            } else {
              acc.totalIncome += amount;
            }
            return acc;
          },
          { totalExpenses: 0, totalIncome: 0, byCategory: {} }
        );

        let insights = [];
        try {
          insights = await generateFinancialInsights(stats, monthLabel);
        } catch (err) {
          console.error("AI Insight Error:", err);
          insights = [
            "Keep up healthy saving habits this month.",
            "Review frequent expense categories to find savings opportunities.",
          ];
        }

        const html = await render(
          React.createElement(EmailTemplate, {
            username: user.name || "FinTrack User",
            type: "monthly-report",
            data: {
              stats,
              month: monthLabel,
              insights,
            },
          })
        );

        await sendEmailDirect({
          from: "FinTrack <onboarding@resend.dev>",
          to: user.email,
          subject: `📊 Your Monthly Financial Report - ${monthLabel}`,
          html,
        });
      });
    }

    return { processed: users.length };
  }
);

/* =========================================================================
   Helpers
   ========================================================================= */
function calculateNextRecurringDate(start, interval) {
  const d = new Date(start);

  if (interval === "DAILY") d.setDate(d.getDate() + 1);
  if (interval === "WEEKLY") d.setDate(d.getDate() + 7);
  if (interval === "MONTHLY") d.setMonth(d.getMonth() + 1);
  if (interval === "YEARLY") d.setFullYear(d.getFullYear() + 1);

  return d;
}

async function generateFinancialInsights(stats, month) {
  if (!process.env.GEMINI_API_KEY) {
    return [
      "Review your highest category spending to optimize your budget.",
      "Consider allocating a portion of your net balance into savings.",
    ];
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `
    Analyze this financial data and provide 3 concise, highly actionable insights.
    Financial Data for ${month}:
    - Total Income: ₹${stats.totalIncome}
    - Total Expenses: ₹${stats.totalExpenses}
    - Net Savings: ₹${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([cat, amt]) => `${cat}: ₹${amt}`)
      .join(", ")}

    Return ONLY a JSON array of 3 string items, e.g. ["Insight 1", "Insight 2", "Insight 3"].
  `;

  const result = await model.generateContent(prompt);
  const text = (await result.response.text()).replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(text);
}
