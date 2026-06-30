"use client";

import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics/track-client";

/** Client component mỏng: gửi `page_view` đúng 1 lần khi mount. Không render gì. */
export function BioTracker({ profileId }: { profileId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackPageView(profileId);
  }, [profileId]);

  return null;
}
