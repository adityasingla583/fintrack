"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";

/* ---------------- CATEGORY CONFIG ---------------- */

const CATEGORIES = {
  INCOME: [
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

/* ---------------- HELPERS ---------------- */

function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category =
    categories[Math.floor(Math.random() * categories.length)];

  const amount = getRandomAmount(category.range[0], category.range[1]);

  return { category: category.name, amount };
}

/* ---------------- MAIN SEED ---------------- */

export async function seedTransactions({ userId, accountId}) {
  try {
    const transactions = [];

    // get current balance
    const account = await db.account.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error("Account not found");

    let totalBalance = Number(account.balance);

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);

      // ⭐ Monthly Salary (realistic)
      if (date.getDate() === 1) {
        const salary = getRandomAmount(5000, 8000);

        transactions.push({
          id: crypto.randomUUID(),
          type: "INCOME",
          amount: salary,
          description: "Monthly Salary",
          date,
          category: "salary",
          status: "COMPLETED",
          userId,
          accountId,
          createdAt: date,
          updatedAt: date,
        });

        totalBalance += salary;
      }

      // random daily transactions
      const transactionsPerDay = Math.floor(Math.random() * 2);

      for (let j = 0; j < transactionsPerDay; j++) {
        const type = Math.random() < 0.3 ? "INCOME" : "EXPENSE";

        const { category, amount } = getRandomCategory(type);

        transactions.push({
          id: crypto.randomUUID(),
          type,
          amount,
          description:
            type === "INCOME"
              ? `Received ${category}`
              : `Paid for ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId,
          accountId,
          createdAt: date,
          updatedAt: date,
        });

        totalBalance += type === "INCOME" ? amount : -amount;
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { accountId },
      });

      await tx.transaction.createMany({
        data: transactions,
      });

      await tx.account.update({
        where: { id: accountId },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Seeded ${transactions.length} transactions`,
      finalBalance: totalBalance.toFixed(2),
    };
  } catch (error) {
    console.error("Seed error:", error);
    return { success: false, error: error.message };
  }
}