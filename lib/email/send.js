import { resend } from "@/lib/resend";

export async function sendEmailDirect(payload) {
   return resend.emails.send(payload);
}