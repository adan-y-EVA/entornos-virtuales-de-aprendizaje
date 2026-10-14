import { deleteSession } from "../../../../lib/auth";
import { ok } from "@/src/lib/api-response";

export async function POST() {
  await deleteSession();
  return ok(null);
}
