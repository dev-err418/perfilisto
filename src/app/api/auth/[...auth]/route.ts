import { handleAuth } from "@/lib/auth/server.mjs";

export const dynamic = "force-dynamic";
export function GET(request: Request) { return handleAuth(request, process.env); }
export function POST(request: Request) { return handleAuth(request, process.env); }
