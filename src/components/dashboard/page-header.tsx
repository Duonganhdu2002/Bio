export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          {eyebrow ? (
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">{action}</div> : null}
      </div>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-border via-border/50 to-transparent" />
    </div>
  );
}
