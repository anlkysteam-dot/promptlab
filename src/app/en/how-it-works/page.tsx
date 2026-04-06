import type { Metadata } from "next";
import Link from "next/link";
import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How it works — PromptLab",
  description:
    "Step-by-step guide to the Lab, expert mode, targets, credits, and Discover — PromptLab.",
};

const sections = [
  { id: "overview", label: "Overview" },
  { id: "flow", label: "Basic flow" },
  { id: "auth", label: "Sign-in & profile" },
  { id: "modes", label: "Universal vs expert" },
  { id: "target", label: "Target (which tool?)" },
  { id: "quality", label: "Quality & language" },
  { id: "lab", label: "Lab options" },
  { id: "starters", label: "Quick starters" },
  { id: "projects", label: "Video projects" },
  { id: "generate", label: "Generate & after" },
  { id: "credits", label: "Credits" },
  { id: "discover", label: "Discover" },
  { id: "more", label: "More" },
] as const;

export default function EnHowItWorksPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link href="/en" className="text-sm text-[var(--accent)] hover:underline">
        ← Home (Lab)
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text)]">How it works</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        PromptLab turns your plain-language request into a structured prompt for the AI target you pick. This page explains
        what each part of the screen does and what to do in order.
      </p>

      <nav
        aria-label="Table of contents"
        className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">On this page</p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-[var(--accent)] hover:underline">
                {i + 1}. {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12 text-sm leading-relaxed text-[var(--muted)]">
        <section id="overview" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">1. Overview</h2>
          <p className="mt-3">
            The home page is the <strong className="text-[var(--text)]">Lab</strong>: a header with (when signed in) a{" "}
            <strong className="text-[var(--text)]">credit chip</strong> and profile link, a large intent box in the middle,
            and the generated text plus links below. PromptLab does not run commands inside Midjourney, ChatGPT, etc. — it gives
            you <strong className="text-[var(--text)]">text to copy and paste</strong>.
          </p>
        </section>

        <section id="flow" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">2. Basic flow</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              <strong className="text-[var(--text)]">Describe what you want</strong> in the main text area (e.g. a launch
              email in a friendly tone).
            </li>
            <li>
              Optionally enable <strong className="text-[var(--text)]">expert mode</strong> and pick a{" "}
              <strong className="text-[var(--text)]">target</strong> (e.g. Midjourney, ChatGPT).
            </li>
            <li>
              Set <strong className="text-[var(--text)]">quality</strong> (Normal / Advanced) and output{" "}
              <strong className="text-[var(--text)]">language</strong>; for image/video targets, pick a{" "}
              <strong className="text-[var(--text)]">media preset</strong> when relevant.
            </li>
            <li>
              Click <strong className="text-[var(--text)]">Generate professional prompt</strong> (or submit the form). The
              result appears in the output panel.
            </li>
            <li>
              <strong className="text-[var(--text)]">Copy</strong> the text or use <strong className="text-[var(--text)]">Open in ChatGPT</strong>{" "}
              to copy and jump to ChatGPT in a new tab.
            </li>
          </ol>
        </section>

        <section id="auth" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">3. Sign-in & profile</h2>
          <p className="mt-3">
            You can use the Lab without signing in; usage is limited by an anonymous daily quota. After{" "}
            <strong className="text-[var(--text)]">sign-in</strong>,{" "}
            <Link href="/en/profile" className="text-[var(--accent)] underline hover:no-underline">
              Profile
            </Link>{" "}
            shows usage and <strong className="text-[var(--text)]">credit history</strong>. The chip in the header shows
            remaining daily quota and purchased bonus credits (if any).
          </p>
        </section>

        <section id="modes" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">4. Universal vs expert mode</h2>
          <p className="mt-3">
            <strong className="text-[var(--text)]">Universal (default):</strong> No explicit target — smart Role–Task–Format
            style optimization for general tasks.
          </p>
          <p className="mt-3">
            <strong className="text-[var(--text)]">Expert mode:</strong> Choose a specific tool so the system prompt matches
            that ecosystem. Extra optional fields (topic, tone, audience) help steer the output.
          </p>
        </section>

        <section id="target" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">5. Target (which tool?)</h2>
          <p className="mt-3">
            The <strong className="text-[var(--text)]">target</strong> adjusts wording and structure for chat, image, or video
            models. It only affects <strong className="text-[var(--text)]">text generation</strong> inside PromptLab — we do
            not open accounts or run jobs in external apps for you.
          </p>
        </section>

        <section id="quality" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">6. Quality, language & media preset</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[var(--text)]">Normal / Advanced:</strong> Advanced asks for richer structure;{" "}
              <strong className="text-[var(--text)]">credit cost</strong> is higher (multiplier is larger on the free tier).
            </li>
            <li>
              <strong className="text-[var(--text)]">Output language:</strong> Locks final text to Turkish or English for
              text-first targets; media targets may add different language notes for model performance.
            </li>
            <li>
              <strong className="text-[var(--text)]">Media preset:</strong> For image/video targets, optional scene style
              (product shot, cinematic, etc.).
            </li>
          </ul>
        </section>

        <section id="lab" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">7. Lab options (optional)</h2>
          <p className="mt-3">
            The Lab block offers <strong className="text-[var(--text)]">format</strong>,{" "}
            <strong className="text-[var(--text)]">negative prompt</strong>, <strong className="text-[var(--text)]">flavor</strong>, and for
            Midjourney toggles to include <strong className="text-[var(--text)]">version / aspect-ratio hints</strong> in the
            text. With <strong className="text-[var(--text)]">Suggested parameters</strong>, we add informational hints aligned
            with the target — they are <strong className="text-[var(--text)]">not auto-pasted</strong> into other apps; you stay
            in control.
          </p>
        </section>

        <section id="starters" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">8. Quick starters</h2>
          <p className="mt-3">
            <strong className="text-[var(--text)]">Category chips</strong> and <strong className="text-[var(--text)]">starter buttons</strong>{" "}
            load a sample request and matching target. Clicking again may rotate another variant from the pool.{" "}
            <strong className="text-[var(--text)]">Give me a random example</strong> picks a random starter.
          </p>
        </section>

        <section id="projects" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">9. Video projects</h2>
          <p className="mt-3">
            With a video-oriented target and sign-in, you can create a <strong className="text-[var(--text)]">project</strong>{" "}
            and add scenes step by step. Generations can be stored in project context for continuity. The project sidebar only
            appears for the right target while signed in.
          </p>
        </section>

        <section id="generate" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">10. Generate & after</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Submitting sends your request to the server; on success the output panel fills. If you see an error, check the
              intent text and target.
            </li>
            <li>
              When signed in, a short <strong className="text-[var(--text)]">credit summary</strong> toast may appear (weight
              spent, daily/bonus left).
            </li>
            <li>
              <strong className="text-[var(--text)]">Copy</strong> copies to the clipboard; <strong className="text-[var(--text)]">Open in ChatGPT</strong>{" "}
              copies and opens ChatGPT in a new tab.
            </li>
          </ul>
        </section>

        <section id="credits" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">11. Credits</h2>
          <p className="mt-3">
            On the free plan you get a daily (Istanbul day) budget of{" "}
            <strong className="text-[var(--text)]">{FREE_DAILY_CREDIT_BUDGET}</strong> credits. Each successful generation spends
            a <strong className="text-[var(--text)]">weight</strong> that depends on Normal/Advanced and Premium. When the daily
            pool is exhausted, <strong className="text-[var(--text)]">purchased bonus credits</strong> are used. Premium has no
            daily cap; costs are still shown for transparency. See{" "}
            <Link href="/en/credits" className="text-[var(--accent)] underline hover:no-underline">
              Credits
            </Link>{" "}
            and{" "}
            <Link href="/pricing" className="text-[var(--accent)] underline hover:no-underline">
              Pricing
            </Link>
            . Profile lists <strong className="text-[var(--text)]">credit activity</strong>.
          </p>
        </section>

        <section id="discover" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">12. Discover</h2>
          <p className="mt-3">
            <Link href="/discover" className="text-[var(--accent)] underline hover:no-underline">
              Discover
            </Link>{" "}
            is where you can browse community shares (features may evolve). Sharing your own output from the Lab is optional.
          </p>
        </section>

        <section id="more" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">13. More</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <Link href="/en/faq" className="text-[var(--accent)] underline hover:no-underline">
                FAQ
              </Link>{" "}
              — short policy answers and common questions.
            </li>
            <li>
              <Link href="/hakkimizda" className="text-[var(--accent)] underline hover:no-underline">
                About
              </Link>
              ,{" "}
              <Link href="/gizlilik" className="text-[var(--accent)] underline hover:no-underline">
                Privacy
              </Link>
              ,{" "}
              <Link href="/hizmet-sartlari" className="text-[var(--accent)] underline hover:no-underline">
                Terms
              </Link>
              .
            </li>
            <li>
              On the Lab, press <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--text)]">?</kbd>{" "}
              for keyboard shortcuts (also mentioned on Profile).
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
