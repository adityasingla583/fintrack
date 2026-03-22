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

    await db.$transaction(async (trx) => {
      await trx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        await trx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        revalidatePath(`/account/${accountId}`);
      }
    });

    revalidatePath("/dashboard");

    return { success: true };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}