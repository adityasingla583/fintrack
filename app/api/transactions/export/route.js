import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { format } from "date-fns";

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

    // Helper to format date safely and cleanly for spreadsheets
    const formatDateForCsv = (dateVal) => {
      if (!dateVal) return "";
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "";
        return format(d, "yyyy-MM-dd");
      } catch (e) {
        return "";
      }
    };

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
      formatDateForCsv(tx.date),
      `"${(tx.description || "").replace(/"/g, '""')}"`,
      `"${tx.category}"`,
      `"${tx.type}"`,
      tx.amount.toNumber().toFixed(2),
      `"${(tx.account?.name || "").replace(/"/g, '""')}"`,
      `"${tx.isRecurring ? "Yes" : "No"}"`,
      `"${tx.status}"`,
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel and spreadsheet apps reliably open with proper encoding and date detection
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const filename = `FinTrack_Transactions_${todayStr}.csv`;

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
