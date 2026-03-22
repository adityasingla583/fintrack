import React from "react";
import { inngest } from "./client";
import { db } from "@/lib/prisma";
import { sendEmailDirect } from "@/lib/email/send";
import EmailTemplate from "@/emails/template";
import { id } from "date-fns/locale";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const triggerBudgetAlerts = inngest.createFunction(
  { id: "trigger-budget-alerts" },
  { cron: "0 */6 * * *" },
  async ({ step }) => {

    const budgets = await step.run("fetch-budgets", async () => {
      return db.budget.findMany({
        select: { id: true }
      });
    });

    if (!budgets.length) return { triggered: 0 };

    const events = budgets.map(budget => ({
      name: "budget.alert.check",
      data: { budgetId: budget.id }
    }));

    await inngest.send(events);

    return { triggered: budgets.length };
  }
);


export const checkBudgetAlert = inngest.createFunction(
  { id: "check-budget-alert-worker" },
  { event: "budget.alert.check" },
  async ({ event, step }) => {

    const budget = await step.run(
      `load-budget-${event.data.budgetId}`,
      async () => {
        return db.budget.findUnique({
          where: { id: event.data.budgetId },
          include: {
            user: {
              include: {
                accounts: {
                  where: { isDefault: true }
                }
              }
            }
          }
        });
      }
    );

    console.log("Printing : ", budget);

    if (!budget) return;

    const account = budget.user.accounts?.[0];
    if (!account) return;

    const compute = await step.run(
      `compute-budget-${budget.id}`,
      async () => {

        const now = new Date();

        const start = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
        );

        const end = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
        );

        const agg = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: account.id,
            type: "EXPENSE",
            date: { gte: start, lt: end }
          },
          _sum: { amount: true }
        });

        const total = agg._sum.amount?.toNumber() ?? 0;
        const limit = budget.amount?.toNumber() ?? 0;

        if (!limit) return { send: false };

        const percent = (total / limit) * 100;

        const shouldSend =
          percent >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(budget.lastAlertSent, now));

        return {
          send: shouldSend,
          percent: Number(percent.toFixed(2)),
          total,
          limit
        };
      }
    );

    if (!compute.send) return;

    await step.run(
      `send-budget-email-${budget.id}`,
      async () => {
        await sendEmailDirect({
          to: budget.user.email,
          subject: `Budget Alert - ${compute.percent}% Used`,
          react: React.createElement(EmailTemplate, {
            username: budget.user.name,
            type: "budget-alert",
            data: {
              percentageUsed: compute.percent,
              budgetAmount: compute.limit,
              totalExpenses: compute.total
            }
          })
        });
      }
    );

    await step.run(
      `update-budget-flag-${budget.id}`,
      async () => {
        await db.budget.update({
          where: { id: budget.id },
          data: { lastAlertSent: new Date() }
        });
      }
    );

    return { sent: true };
  }
);

export const triggerRecurringTransactions = inngest.createFunction(
  { id: "trigger-recurring-transactions" },
  { cron: "0 0 * * *" },
  async ({ step }) => {

    const txns = await step.run(
      "fetch-recurring",
      async () => {
        return db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              { nextRecurringDate: { lte: new Date() } }
            ]
          },
          select: { id: true, userId: true }
        });
      }
    );

    if (!txns.length) return { triggered: 0 };

    await inngest.send(
      txns.map(t => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: t.id,
          userId: t.userId
        }
      }))
    );

    return { triggered: txns.length };
  }
);

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId"
    }
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {

    await step.run(
      `process-txn-${event.data.transactionId}`,
      async () => {

        const txn = await db.transaction.findFirst({
          where: {
            id: event.data.transactionId,
            userId: event.data.userId
          }
        });

        if (!txn || !isTransactionDue(txn)) return;

        const amt = txn.amount.toNumber();

        await db.$transaction(async (tx) => {

          await tx.transaction.create({
            data: {
              type: txn.type,
              amount: txn.amount,
              description: `${txn.description} (Recurring)`,
              date: new Date(),
              category: txn.category,
              userId: txn.userId,
              accountId: txn.accountId,
              isRecurring: false
            }
          });

          await tx.account.update({
            where: { id: txn.accountId },
            data: {
              balance: {
                increment:
                  txn.type === "EXPENSE" ? -amt : amt
              }
            }
          });

          await tx.transaction.update({
            where: { id: txn.id },
            data: {
              lastProcessed: new Date(),
              nextRecurringDate:
                calculateNextRecurringDate(
                  new Date(),
                  txn.recurringInterval
                )
            }
          });

        });
      }
    );

    return { processed: true };
  }
);

function isNewMonth(last, now) {
  return (
    last.getUTCMonth() !== now.getUTCMonth() ||
    last.getUTCFullYear() !== now.getUTCFullYear()
  );
}

function isTransactionDue(txn) {
  return (
    !txn.nextRecurringDate ||
    txn.nextRecurringDate <= new Date()
  );
}

function calculateNextRecurringDate(start, interval) {
  const d = new Date(start);

  if (interval === "DAILY") d.setDate(d.getDate() + 1);
  if (interval === "WEEKLY") d.setDate(d.getDate() + 7);
  if (interval === "MONTHLY") d.setMonth(d.getMonth() + 1);
  if (interval === "YEARLY") d.setFullYear(d.getFullYear() + 1);

  return d;
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return db.user.findMany({
        include: {accounts: true},
      });
    });
    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        // Placeholder for report generation logic
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

        console.log(`Generating report for user: ${user.email}`);
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmailDirect({
          to: user.email,
          subject: `Your Financial Report for ${monthName}`,
          react: React.createElement(EmailTemplate, {
            username: user.name,
            type: "monthly-report",
            stats,
            month: monthName,
            insights
          })
        });
      });
    }
    return {processed: users.length};
  }
);

async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

const getMonthlyStats = async (userId, month) => {
  const start = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const end = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: start, lt: end }
    },
  });
  return transactions.reduce((stats, t) => {
    const amount = t.amount.toNumber();
    stats.totalExpenses += amount;
    if(t.type === "EXPENSE") {
      stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
    } else {
      stats.totalIncome += amount;
    }

  }, {
    totalExpenses: 0,
    totalIncome: 0,
    byCategory: {},
    transactionCount: transactions.length
  });
};
