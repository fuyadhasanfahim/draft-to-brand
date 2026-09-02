import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { AdSlot } from "./ad-slot";

// Each renderer destructures `node` purely to keep react-markdown's hast node
// from being spread onto a real DOM element.
/* eslint-disable @typescript-eslint/no-unused-vars */
const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h2
      className="text-display mt-12 mb-4 text-2xl font-medium tracking-tight sm:text-3xl"
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      className="text-display mt-12 mb-4 text-2xl font-medium tracking-tight sm:text-3xl"
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="mt-8 mb-3 text-lg font-semibold" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="my-5 leading-relaxed text-foreground/90" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a
      className="text-[color:var(--color-primary-text)] underline underline-offset-2 transition-opacity hover:opacity-80"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ node, ...props }) => (
    <ul className="my-5 list-disc space-y-2 pl-6 text-foreground/90" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol
      className="my-5 list-decimal space-y-2 pl-6 text-foreground/90"
      {...props}
    />
  ),
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="my-6 border-l-2 border-[color:var(--color-primary)]/40 pl-4 text-muted italic"
      {...props}
    />
  ),
  pre: ({ node, ...props }) => (
    <pre
      className="my-6 overflow-x-auto rounded-2xl bg-foreground/5 p-4 font-mono text-sm [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  code: ({ node, ...props }) => (
    <code
      className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-[0.9em]"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-border" />,
  img: ({ node, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="my-6 w-full rounded-2xl" {...props} alt={props.alt ?? ""} />
  ),
  table: ({ node, ...props }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th
      className="border border-border bg-surface px-3 py-2 text-left font-medium"
      {...props}
    />
  ),
  td: ({ node, ...props }) => (
    <td className="border border-border px-3 py-2" {...props} />
  ),
};
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Renders post markdown, dropping an <AdSlot/> wherever a lone `[[ad]]` line
 * sits. `[[ad:adsense]]` / `[[ad:adsterra]]` force a specific network; a plain
 * `[[ad]]` uses the configured default.
 */
export function BlogContent({ content }: { content: string }) {
  // A single capturing group means split() interleaves the captured network
  // (or undefined) between the text segments.
  const parts = content.split(
    /^[ \t]*\[\[ad(?::(adsense|adsterra))?\]\][ \t]*$/m,
  );

  return (
    <div className="text-[1.05rem]">
      {parts.map((part, index) => {
        if (index % 2 === 1) return null; // odd entries are captured networks
        const network = parts[index + 1] as
          | "adsense"
          | "adsterra"
          | undefined;
        const hasAdAfter = index + 1 < parts.length;

        return (
          <div key={index}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {part}
            </ReactMarkdown>
            {hasAdAfter && <AdSlot network={network} />}
          </div>
        );
      })}
    </div>
  );
}
