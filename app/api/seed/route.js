import { seedTransactions } from "@/actions/seed";

export async function GET() {
    const result = await seedTransactions({
   userId: "52382237-7736-4655-91ed-fc2b820c1d24",
   accountId: "0dd90950-cc23-474f-8c04-6e6641b4addc"
});
    return Response.json(result)
}