import { getLlmsGuide } from "@/lib/llms-guide";

export const dynamic = "force-static";

export function GET() {
  return new Response(`${getLlmsGuide().trim()}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
