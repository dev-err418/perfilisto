export const dynamic = "force-dynamic";
export async function POST() {
  return Response.json(
    { error: "Use the public Perfilisto webhook endpoint." },
    { status: 404 },
  );
}
