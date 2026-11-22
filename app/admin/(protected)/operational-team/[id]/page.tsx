import { T } from "@/components/public-language";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { OperationalMemberForm, DeleteOperationalMember } from "@/components/admin/operational-member-form";

export default async function EditOperationalMember({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const value = (await params).id;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) notFound();
  const member = await prisma.operationalTeamMember.findUnique({ where: { id: Number(value) }, select: { id: true, fullName: true, version: true } });
  if (!member) notFound();
  const editable = member;
  return <div className="mx-auto max-w-2xl"><Link href="/admin/operational-team" className="inline-flex min-h-11 items-center underline"><T text="Back to members" /></Link><h1 className="my-6 text-3xl font-semibold"><T text="Edit member" /></h1><OperationalMemberForm member={editable} /><div className="mt-6"><DeleteOperationalMember member={editable} /></div></div>;
}
