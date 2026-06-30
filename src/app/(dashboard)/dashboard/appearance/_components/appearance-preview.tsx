"use client";

import { cn } from "@/lib/utils";
import { TemplatePreviewDetail } from "@/components/bio/template-visuals";
import { getBioTheme, resolveBioTemplate } from "@/components/bio/theme";

type AppearancePreviewProps = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  template: string;
  initial: string;
};

export function AppearancePreview({
  username,
  displayName,
  bio,
  avatarUrl,
  coverUrl,
  template,
  initial,
}: AppearancePreviewProps) {
  const resolvedTemplate = resolveBioTemplate(template);

  return (
    <div
      key={template}
      className={cn(
        "appearance-preview overflow-hidden rounded-xl border border-border bg-background text-foreground",
        getBioTheme("minimal"),
      )}
    >
      <TemplatePreviewDetail
        template={resolvedTemplate}
        data={{ username, displayName, bio, avatarUrl, coverUrl, initial }}
      />
    </div>
  );
}
