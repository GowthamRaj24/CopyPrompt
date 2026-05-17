import {
  ImageIcon,
  Link2Icon,
  LockIcon,
  MessageSquareIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Markdown } from "@/components/markdown/Markdown";
import { HeartButton } from "@/components/prompt/HeartButton";
import { formatRelativeTime } from "@/lib/format";
import { SITE_BRAND } from "@/lib/site-brand";
import { queueViewIncrement } from "@/server/lib/counter-batcher";
import { getPromptByShareToken } from "@/server/services/prompt.service";
import { CopyButton } from "@/app/prompt/[slug]/components/CopyButton";
import { ImageStack } from "@/app/prompt/[slug]/components/ImageStack";
import { ParametersList } from "@/app/prompt/[slug]/components/ParametersList";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const prompt = await getPromptByShareToken(token);
  if (!prompt) return { title: "Link not found" };

  return {
    title: prompt.title,
    description: `Private prompt on ${SITE_BRAND.displayName}. Open the link to view and copy.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: prompt.title,
      description: `Private prompt on ${SITE_BRAND.displayName}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: prompt.title,
      description: `Private prompt on ${SITE_BRAND.displayName}`,
    },
  };
}

export default async function SharedPromptPage({ params }: PageProps) {
  const { token } = await params;
  const prompt = await getPromptByShareToken(token);
  if (!prompt) notFound();

  after(() => {
    queueViewIncrement(prompt.id);
  });

  const isImage = prompt.model.type === "image";
  const usesPicsum = prompt.images.some((img) =>
    img.cdnUrl.includes("picsum.photos"),
  );

  return (
    <article className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
      />

      <div className="container relative mx-auto px-4 py-5 sm:px-6 md:py-8">
        <div className="reveal mb-5 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-[12px] text-muted-foreground">
          <LockIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">Private link.</span>{" "}
            Only people with this URL can view this prompt. It is not listed on{" "}
            {SITE_BRAND.displayName}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="reveal delay-1 lg:col-span-5">
            {isImage && prompt.images.length > 0 ? (
              <ImageStack
                images={prompt.images}
                title={prompt.title}
                unoptimized={usesPicsum}
              />
            ) : (
              <SharePromptCode text={prompt.promptText} />
            )}
          </div>

          <div className="reveal delay-2 lg:col-span-7">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {isImage ? (
                  <ImageIcon className="size-3" />
                ) : (
                  <MessageSquareIcon className="size-3" />
                )}
                {prompt.model.name}
              </span>
              <HeartButton
                promptId={prompt.id}
                className="press grid size-9 place-items-center rounded-lg border border-border/50 bg-card/60 text-muted-foreground transition-all hover:border-border hover:bg-card hover:text-foreground"
              />
            </div>

            <h1 className="mt-3 text-2xl font-bold leading-[1.08] tracking-[-0.035em] text-balance md:text-3xl">
              {prompt.title}
            </h1>

            <p className="mt-2.5 text-[11px] text-muted-foreground">
              Shared privately · {formatRelativeTime(prompt.createdAt)}
            </p>

            <p className="mt-4 text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {prompt.copyCount.toLocaleString()}
              </span>{" "}
              copies
            </p>

            <div className="mt-5">
              <CopyButton
                promptId={prompt.id}
                promptText={prompt.promptText}
                withParams={prompt.params}
              />
            </div>

            {prompt.tips && (
              <aside className="mt-5 rounded-lg border-l-2 border-primary/40 bg-card/30 px-3.5 py-2.5">
                <p className="eyebrow mb-1.5">Note</p>
                <Markdown content={prompt.tips} />
              </aside>
            )}

            <div className="my-6 h-px bg-border/40" />

            {isImage ? (
              <SharePromptCode text={prompt.promptText} maxHeight="400px" />
            ) : (
              prompt.expectedOutcome && (
                <div className="rounded-xl border border-border/50 bg-card/40 p-4 md:p-5">
                  <p className="eyebrow mb-2.5">Sample output</p>
                  <Markdown
                    content={prompt.expectedOutcome}
                    className="max-h-[400px] overflow-auto"
                  />
                </div>
              )
            )}

            {isImage && prompt.negativePrompt && (
              <details className="mt-2.5 rounded-lg border border-border/50 bg-card/30 px-3.5 py-2.5">
                <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground hover:text-foreground">
                  Negative prompt
                </summary>
                <pre className="mt-2.5 font-mono text-[11px] leading-[1.7] whitespace-pre-wrap text-muted-foreground">
                  {prompt.negativePrompt}
                </pre>
              </details>
            )}

            <div className="mt-5 rounded-xl border border-border/50 bg-card/30 p-4">
              <p className="eyebrow mb-2.5">Parameters</p>
              <ParametersList
                params={prompt.params}
                modelType={prompt.model.type}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-border/40 pt-5">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
              >
                <Link2Icon className="size-3.5" />
                Browse public prompts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SharePromptCode({
  text,
  maxHeight = "560px",
}: {
  text: string;
  maxHeight?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-primary/35 bg-card/60">
      <div className="border-b border-primary/20 bg-primary/[0.07] px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
        The Prompt
      </div>
      <pre
        className="m-0 overflow-auto p-4 font-mono text-[13px] leading-[1.75] whitespace-pre-wrap md:text-[14px]"
        style={{ maxHeight }}
      >
        {text}
      </pre>
    </div>
  );
}
