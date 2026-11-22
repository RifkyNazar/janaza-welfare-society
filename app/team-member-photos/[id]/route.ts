import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const value = (await params).id;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) return new Response(null, { status: 404 });
  const member = await prisma.operationalTeamMember.findUnique({ where: { id: Number(value) }, select: { photo: true } });
  if (!member) return new Response(null, { status: 404 });
  return new Response(member.photo, { headers: { "Content-Type": "image/webp", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
