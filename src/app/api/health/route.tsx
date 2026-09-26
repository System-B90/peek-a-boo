import { NextResponse } from "next/server";

// Unauthenticated by design (container healthcheck, load balancer probe), so
// the body carries nothing but liveness. Deliberately does not touch Hive:
// peek-a-boo itself is serving even when Hive is down, and the container must
// not be restarted for a dependency outage.
export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json(
        { status: "ok" },
        { headers: { "Cache-Control": "no-store" } },
    );
}
