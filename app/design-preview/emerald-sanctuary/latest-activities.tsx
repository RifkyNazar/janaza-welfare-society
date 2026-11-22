import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import { publicOperationImages, publicOperationSelect, type PublicOperation } from "@/lib/public-operations";
import { previewCopy } from "./preview-copy";
import { ArrowIcon } from "./preview-icon";
import styles from "./sanctuary.module.css";

type PreviewOperation = Omit<PublicOperation, "photos">;

function ActivityImage({ operation, locale }: { operation: PreviewOperation; locale: Locale }) {
  const photo = publicOperationImages({ photos: [], media: operation.media })[0];
  return photo ? <Image unoptimized src={photo.src} alt={photo.altText} fill loading="lazy" sizes="(min-width: 1280px) 384px, 30vw" /> : <div className={styles.activityPlaceholder}><span aria-hidden="true">✧</span><span>{previewCopy(locale).noPhoto}</span></div>;
}

export async function LatestActivities({ locale = "en" }: { locale?: Locale }) {
  const t = previewCopy(locale);
  const date = new Intl.DateTimeFormat(locale === "ta" ? "ta-LK" : "en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  let operations: PreviewOperation[] = [];
  let unavailable = false;
  try {
    operations = await prisma.operation.findMany({ where: { isPublished: true }, orderBy: [{ operationDate: "desc" }, { id: "desc" }], take: 3, select: { ...publicOperationSelect, photos: false } });
  } catch { unavailable = true; }
  return <section id="latest-activities" className={styles.activities} aria-labelledby="activities-title">
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>{t.latest}</p><h2 id="activities-title">{t.activityTitle}</h2></div><Link className={styles.textLink} href="/operations">{t.allActivities} <ArrowIcon /></Link></div>
    {operations.length ? <div className={styles.activityGrid}>
      {operations.map(operation => <article className={styles.activityTile} key={operation.id}>
        <Link href={`/operations/${operation.id}`} aria-label={operation.title}>
          <div className={styles.activityThumb}><ActivityImage operation={operation} locale={locale} /></div>
          <div className={styles.activityTileCopy}><time dateTime={operation.operationDate.toISOString()}>{date.format(operation.operationDate)}</time><h3>{operation.title}</h3></div>
        </Link>
      </article>)}
    </div> : <div className={styles.activityEmpty}><h3>{unavailable ? t.unavailable : t.emptyTitle}</h3><p>{unavailable ? t.retry : t.emptyText}</p></div>}
  </section>;
}
