import { getPool } from "@/lib/db/pool";
import { checkDatabase } from "@/lib/db/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await checkDatabase(getPool());
    return Response.json(status, { status: status.ok ? 200 : 503 });
  } catch (err) {
    console.error("DB health check failed", err);
    return Response.json({ ok: false, error: "database unreachable" }, { status: 503 });
  }
}
