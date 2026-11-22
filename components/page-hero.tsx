import { T } from "@/components/public-language";
type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="jws-page-hero px-6 py-20 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground"><T text={eyebrow} /></p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl"><T text={title} /></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted"><T text={description} /></p>
      </div>
    </section>
  );
}
