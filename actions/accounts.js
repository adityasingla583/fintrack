"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/* ---------------- HELPERS ---------------- */

async function getCurrentUserOrThrow() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return user;
}

const serializeNumericFields = (obj) => {
  const serialized = { ...obj };

  if (obj.balance !== undefined && obj.balance !== null) {
    serialized.balance = obj.balance.toNumber();
  }

  if (obj.amount !== undefined && obj.amount !== null) {
    serialized.amount = obj.amount.toNumber();
  }

  return serialized;
};

/* ---------------- UPDATE DEFAULT ACCOUNT ---------------- */

export async function updateDefaultAccount(accountId) {
  try {
    if (!accountId) throw new Error("Invalid account id");

    const user = await getCurrentUserOrThrow();

    const targetAccount = await db.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!targetAccount) throw new Error("Account not found");

    const account = await db.$transaction(async (tx) => {
      await tx.account.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      return tx.account.update({
        where: { id: accountId },
        data: { isDefault: true },
      });
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeNumericFields(account),
    };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

/* ---------------- GET ACCOUNT WITH TRANSACTIONS ---------------- */

export async function getAccountWithTransactions(accountId) {
  try {
    if (!accountId) return null;

    const user = await getCurrentUserOrThrow();

    const account = await db.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
      include: {
        transactions: {
          orderBy: {
            date: "desc",
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!account) return null;

    return {
      ...serializeNumericFields(account),
      transactions: account.transactions.map(serializeNumericFields),
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
}

/* ---------------- BULK DELETE ---------------- */

export async function bulkDeleteTransactions(transactionIds) {
  try {
    if (!transactionIds?.length) {
      throw new Error("No transactions provided");
    }

    const user = await getCurrentUserOrThrow();

    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    const accountBalanceChanges = transactions.reduce((acc, tx) => {
      const amount = tx.amount.toNumber();

      const change =
        tx.type === "EXPENSE"
          ? amount
          : -amount;

      acc[tx.accountId] = (acc[tx.accountId] || 0) + change;

      return acc;
    }, {});

    const budgetChanges = transactions.reduce((acc, tx) => {
      const amount = tx.amount.toNumber();

      const change =
        tx.type === "EXPENSE"
          ? amount      // deleting expense → budget increment
          : -amount;    // deleting income → budget decrement

      acc[tx.accountId] = (acc[tx.accountId] || 0) + change;

      return acc;
    }, {});

    await db.$transaction(async (trx) => {

      await trx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      /* ⭐ ACCOUNT BALANCE UPDATE */
      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        await trx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }

    });

    revalidatePath("/dashboard");

    return { success: true };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function getAccountBudgetStats(accountId) {

  if (!accountId) {
    return {
      budget: 0,
      monthlySpend: 0,
      yearlySpend: 0
    };
  }

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId }
  });

  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const monthly = await db.transaction.aggregate({
    where: {
      userId: user.id,
      accountId,
      type: "EXPENSE",
      date: { gte: startOfMonth }
    },
    _sum: { amount: true }
  });

  const yearly = await db.transaction.aggregate({
    where: {
      userId: user.id,
      accountId,
      type: "EXPENSE",
      date: { gte: startOfYear }
    },
    _sum: { amount: true }
  });

  const budget = await db.budget.findUnique({
    where: { accountId }
  });

  return {
    budget: budget?.amount?.toNumber() || 0,
    monthlySpend: monthly._sum.amount?.toNumber() || 0,
    yearlySpend: yearly._sum.amount?.toNumber() || 0,
  };
}