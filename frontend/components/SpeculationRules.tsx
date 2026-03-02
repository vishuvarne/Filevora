"use client";

import Script from "next/script";

/**
 * SpeculationRules — lightweight prefetch (NOT prerender) on hover.
 * 
 * We use "prefetch" instead of "prerender" because prerendering
 * triggers full RSC payload fetches for each matched link, which
 * overwhelms Next.js's navigation system when there are 60+ tool cards.
 * 
 * Prefetch only fetches the HTML shell, which is much lighter and
 * still provides near-instant navigation feel.
 */
export function SpeculationRules() {
  return (
    <script
      type="speculationrules"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          prefetch: [
            {
              source: "document",
              where: {
                and: [
                  { href_matches: "/tools/*" },
                  { not: { href_matches: "/api/*" } },
                  { not: { href_matches: "/_next/*" } }
                ]
              },
              eagerness: "moderate"
            }
          ]
        })
      }}
    />
  );
}
