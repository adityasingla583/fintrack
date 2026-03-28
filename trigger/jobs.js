import { task, schedules, queue } from "@trigger.dev/sdk";
import { tasks } from "@trigger.dev/sdk";
import { db } from "@/lib/prisma";
import { sendEmailDirect } from "@/lib/email/send";
import React from "react";
import { render } from "@react-email/render";
import EmailTemplate from "@/emails/template";

/* =========================
   1. Budget Alerts (CRON)
========================= */
export const triggerBudgetAlerts = schedules.task({
  id: "trigger-budget-alerts",
  cron: "0 */6 * * *",

  run: async () => {
    const budgets = await db.budget.findMany({
      select: { id: true },
    });

    if (!budgets.length) return { triggered: 0 };

    await tasks.batchTrigger("budget-alert-check", budgets.map((b) => ({
      payload: { budgetId: b.id },
    })));

    return { triggered: budgets.length };
  },
});

/* =========================
   2. Recurring Transactions (CRON)
========================= */
export const triggerRecurringTransactions = schedules.task({
  id: "trigger-recurring-transactions",
  cron: "0 0 * * *",

  run: async () => {
    const txns = await db.transaction.findMany({
      where: {
        isRecurring: true,
        status: "COMPLETED",
        OR: [
          { lastProcessed: null },
          { nextRecurringDate: { lte: new Date() } },
        ],
      },
      select: { id: true, userId: true },
    });

    if (!txns.length) return { triggered: 0 };

    await tasks.batchTrigger(
      "process-recurring-transaction",
      txns.map((t) => ({
        payload: {
          transactionId: t.id,
          userId: t.userId,
        },
      }))
    );

    return { triggered: txns.length };
  },
});

/* =========================
   3. Process Recurring Transaction (TASK)
========================= */
const recurringQueue = queue({
  name: "recurring-transaction-queue",
  concurrencyLimit: 10,
});

export const processRecurringTransaction = task({
  id: "process-recurring-transaction",
  queue: recurringQueue,

  run: async (payload) => {
    const { transactionId, userId } = payload;

    const txn = await db.transaction.findFirst({
      where: { id: transactionId, userId },
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
          isRecurring: false,
        },
      });

      await tx.account.update({
        where: { id: txn.accountId },
        data: {
          balance: {
            increment: txn.type === "EXPENSE" ? -amt : amt,
          },
        },
      });

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

    return { processed: true };
  },
});

/* =========================
   4. Monthly Reports (CRON)
========================= */
export const generateMonthlyReports = schedules.task({
  id: "generate-monthly-reports",
  cron: "0 0 1 * *",

  run: async () => {
    console.log("🚀 Monthly report job started");

    const users = [
      {
        id: "test-user-1",
        email: "a@gmail.com",
        name: "user1",
      },
    ];

    for (const user of users) {
      if (!user.email) continue;

      const html = await render(
        React.createElement(EmailTemplate, {
          username: user.name,
          type: "monthly-report",
          data: {
            stats: {
              totalIncome: 50000,
              totalExpenses: 30000,
              byCategory: {
                Food: 5000,
                Rent: 15000,
              },
            },
            month: "March 2026",
            insights: ["Good savings", "Reduce food expenses"],
          },
        })
      );

      const response = await sendEmailDirect({
        from: "FinTrack <onboarding@resend.dev>",
        to: user.email,
        subject: "Monthly Report",
        html,
      });

      console.log("✅ Email sent:", response);
    }

    return { processed: users.length };
  },
});

/* =========================
   Helpers
========================= */
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
    if (t.type === "EXPENSE") {
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
