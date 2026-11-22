import { T } from "@/components/public-language";
type ServiceCardProps = {
  title: string;
  description: string;
};

export function ServiceCard({ title, description }: ServiceCardProps) {
  return (
    <article className="jws-card jws-service-card rounded-2xl border border-border bg-white p-7 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground"><T text={title} /></h2>
      <p className="mt-3 leading-7 text-muted"><T text={description} /></p>
    </article>
  );
}
