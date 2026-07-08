import { auth } from "@/lib/auth";
import { exportUserData } from "@/lib/services/account-service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await exportUserData(session.user.id);
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="steadel-export.json"',
    },
  });
}
