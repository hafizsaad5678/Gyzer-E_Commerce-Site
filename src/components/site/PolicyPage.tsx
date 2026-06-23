import { SiteLayout } from "@/components/site/SiteLayout";

export function PolicyPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <SiteLayout>
      <article className="container-page py-12 md:py-20 max-w-3xl prose-policy">
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
          Policy
        </div>
        <h1 className="text-display text-4xl md:text-5xl mb-3">{title}</h1>
        {subtitle && <p className="text-muted-foreground mb-10">{subtitle}</p>}
        <div className="space-y-6 text-[15px] leading-relaxed text-foreground/85 [&_h2]:text-display [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_ul]:space-y-1.5">
          {children}
        </div>
      </article>
    </SiteLayout>
  );
}
