import { LinkButton } from "./link-button";
import type { PublicLink } from "./types";

export function LinkList({ profileId, links }: { profileId: string; links: PublicLink[] }) {
  if (!links.length) return null;

  return (
    <nav aria-label="Liên kết" className="flex flex-col gap-3">
      {links.map((link) => (
        <LinkButton key={link.id} profileId={profileId} link={link} />
      ))}
    </nav>
  );
}
