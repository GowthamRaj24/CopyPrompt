"use client";

import { ChevronDownIcon, HelpCircleIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface HomepageFaqItem {
  question: string;
  answer: string;
}

interface HomepageFaqSectionProps {
  faqs: readonly HomepageFaqItem[];
}

/**
 * FAQ block with scroll-triggered header + staggered accordion reveals.
 */
export function HomepageFaqSection({ faqs }: HomepageFaqSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`faq-section border-t border-border/40 bg-card/30 ${inView ? "faq-section--in" : ""}`}
      aria-labelledby="homepage-faq-title"
    >
      <div className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
        <header className="faq-header mb-6 md:mb-7">
          <p className="faq-header-item eyebrow mb-1.5 inline-flex items-center gap-1.5">
            <HelpCircleIcon
              className="faq-icon-pulse size-3 text-primary"
              strokeWidth={2}
              aria-hidden
            />
            Frequently asked
          </p>
          <h2
            id="homepage-faq-title"
            className="faq-header-item text-[1.375rem] font-bold leading-tight tracking-[-0.03em] md:text-[1.75rem]"
          >
            Questions, answered
          </h2>
          <p className="faq-header-item mt-1 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
            The short version. For everything else, drop a note via{" "}
            <Link
              href="/submit"
              className="link-underline font-medium text-foreground transition-colors hover:text-primary"
            >
              Submit
            </Link>
            .
          </p>
        </header>

        <div className="faq-panel mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card/60 shadow-soft">
          <div className="divide-y divide-border/60">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                className="faq-item group/faq"
                style={{ "--faq-i": index } as React.CSSProperties}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-muted/30 sm:px-6">
                  <span className="text-[14px] font-semibold tracking-[-0.005em] text-foreground transition-colors duration-200 group-open/faq:text-primary sm:text-[15px]">
                    {faq.question}
                  </span>
                  <span className="faq-chevron grid size-7 shrink-0 place-items-center rounded-lg border border-border/50 bg-muted/20 text-muted-foreground transition-[transform,background-color,border-color,color] duration-300 group-open/faq:border-primary/30 group-open/faq:bg-primary/10 group-open/faq:text-primary">
                    <ChevronDownIcon className="size-4" aria-hidden />
                  </span>
                </summary>
                <div className="faq-answer-grid px-5 sm:px-6">
                  <div className="faq-answer-inner overflow-hidden">
                    <p className="pb-4 text-[13.5px] leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        <p className="faq-footer mt-6 text-center text-[12px] text-muted-foreground/70">
          Have another question?{" "}
          <Link
            href="/submit"
            className="link-underline font-medium text-foreground transition-colors hover:text-primary"
          >
            Tell us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
