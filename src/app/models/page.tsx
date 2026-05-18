import { CpuIcon, ImageIcon, MessageSquareIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbListJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { getIndexableModels } from "@/server/services/model-catalog.service";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI models",
  description:
    "Browse free copy-paste prompts by AI model — ChatGPT, Claude, Midjourney, Flux, Gemini, DALL-E and more.",
  alternates: { canonical: "/models" },
  openGraph: {
    title: "Free AI prompts by model",
    description:
      "Find prompts for every major AI tool — image and text models.",
    url: "/models",
  },
};

export default async function ModelsIndexPage() {
  const models = await getIndexableModels();
  const imageModels = models.filter((m) => m.type === "image");
  const textModels = models.filter((m) => m.type === "text");

  const jsonLd = [
    breadcrumbListJsonLd([
      { name: "Home", url: "/" },
      { name: "Models", url: "/models" },
    ]),
    itemListJsonLd(
      models.map((m) => ({
        name: `${m.name} prompts`,
        url: `/models/${m.slug}`,
      })),
      {
        name: "AI models on My Copyprompt",
        description: "Browse prompts by AI model.",
      },
    ),
  ];

  return (
    <section className="relative">
      <JsonLd data={jsonLd} />
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2">Browse by tool</p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary md:size-12">
              <CpuIcon className="size-4 md:size-5" strokeWidth={2} />
            </span>
            AI models
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] text-muted-foreground md:text-[15px]">
            Every prompt is labeled for the model it was built for. Pick your
            tool and start copying.
          </p>
        </header>

        {models.length === 0 ? (
          <p className="text-center text-[13px] text-muted-foreground">
            No models with published prompts yet.
          </p>
        ) : (
          <div className="space-y-12">
            {imageModels.length > 0 && (
              <ModelGroup
                title="Image models"
                icon={<ImageIcon className="size-3" />}
                models={imageModels}
              />
            )}
            {textModels.length > 0 && (
              <ModelGroup
                title="Text models"
                icon={<MessageSquareIcon className="size-3" />}
                models={textModels}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ModelGroup({
  title,
  icon,
  models,
}: {
  title: string;
  icon: React.ReactNode;
  models: Array<{
    slug: string;
    name: string;
    promptCount: number;
  }>;
}) {
  return (
    <section>
      <h2 className="eyebrow mb-4 inline-flex items-center gap-1.5">
        {icon}
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-2.5 lg:grid-cols-4">
        {models.map((m) => (
          <Link
            key={m.slug}
            href={`/models/${m.slug}`}
            className="lift group flex h-11 items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/60 px-3.5 text-[13px] font-medium transition-all hover:border-primary/30 hover:bg-card"
          >
            <span className="line-clamp-1 text-foreground transition-colors group-hover:text-primary">
              {m.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
              {m.promptCount}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
