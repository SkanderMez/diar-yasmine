import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface ExperienceCard {
  title: string;
  eyebrow: string;
  body: string;
  imageUrl: string;
  href?: string;
}

interface HomeExperiencesProps {
  experiences: ExperienceCard[];
}

interface CardProps {
  exp: ExperienceCard;
}

function Card({ exp }: CardProps) {
  const inner = (
    <>
      <Image
        src={exp.imageUrl}
        alt={exp.title}
        fill
        sizes="(max-width: 900px) 100vw, 33vw"
        className="object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.05]"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 40%, rgba(14,90,107,0.85) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 z-[1] p-6 text-ivory">
        <p
          className="eyebrow mb-2"
          style={{ color: "var(--color-turquoise-light)" }}
        >
          {exp.eyebrow}
        </p>
        <h3 className="mb-2 font-heading text-2xl text-ivory sm:text-[1.75rem]">
          {exp.title}
        </h3>
        <p className="text-[0.92rem] text-ivory/85">{exp.body}</p>
      </div>
    </>
  );

  const baseCls =
    "group relative block h-[360px] overflow-hidden rounded-[16px] md:h-full";

  if (exp.href) {
    return (
      <Link href={exp.href as "/padel"} className={`${baseCls} cursor-pointer`}>
        {inner}
      </Link>
    );
  }
  return <div className={baseCls}>{inner}</div>;
}

/**
 * Three-card editorial grid: 1.4fr / 1fr / 1fr at 580px tall.
 * Mobile stacks into a single column of 360px cards.
 */
export function HomeExperiences({ experiences }: HomeExperiencesProps) {
  return (
    <section className="bg-ivory">
      <div className="container-x-wide section-y">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-[680px]">
            <p className="eyebrow">Expériences</p>
            <h2 className="heading-display mt-3 text-4xl text-foreground sm:text-5xl">
              Au-delà du séjour
            </h2>
            <p className="mt-3 text-[1.05rem] text-charcoal-soft">
              Des moments à vivre, à votre rythme, juste à votre porte.
            </p>
          </div>
          <Link
            href="/padel"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[0.95rem] font-medium text-foreground transition-colors hover:bg-sand"
          >
            Tout voir
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
        </div>

        <div className="grid gap-5 md:h-[580px] md:grid-cols-[1.4fr_1fr_1fr]">
          {experiences.map((exp) => (
            <Card key={exp.title} exp={exp} />
          ))}
        </div>
      </div>
    </section>
  );
}
