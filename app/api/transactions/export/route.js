import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const whereClause = {
      userId: user.id,
      ...(accountId ? { accountId } : {}),
    };

    const transactions = await db.transaction.findMany({
      where: whereClause,
      include: {
        account: {
          select: { name: true, type: true },
        },
      },
      orderBy: { date: "desc" },
    });

    // Generate CSV lines
    const headers = [
      "Transaction ID",
      "Date",
      "Description",
      "Category",
      "Type",
      "Amount",
      "Account Name",
      "Recurring",
      "Status",
    ];

    const rows = transactions.map((tx) => [
      `"${tx.id}"`,
      `"${new Date(tx.date).toISOString().split("T")[0]}"`,
      `"${(tx.description || "").replace(/"/g, '""')}"`,
      `"${tx.category}"`,
      `"${tx.type}"`,
      tx.amount.toNumber().toFixed(2),
      `"${(tx.account?.name || "").replace(/"/g, '""')}"`,
      `"${tx.isRecurring ? "Yes" : "No"}"`,
      `"${tx.status}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const filename = `FinTrack_Transactions_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export CSV Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
