type ServiceCardProps = {
  title: string;
  description: string;
};

export function ServiceCard({ title, description }: ServiceCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-white p-7 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3 leading-7 text-muted">{description}</p>
    </article>
  );
}
