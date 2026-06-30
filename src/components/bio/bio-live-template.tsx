"use client";

import { useEffect, useRef, useState } from "react";

import { BioTemplate } from "./bio-template";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  PublicBanner,
  PublicLink,
  PublicPinnedProduct,
  PublicProduct,
  PublicProductCategory,
  PublicProfile,
  PublicProfilePayload,
} from "./types";

type LiveTemplateProps = {
  username: string;
  profile: PublicProfile;
  links: PublicLink[];
  banners: PublicBanner[];
  categories: PublicProductCategory[];
  pinned: PublicPinnedProduct[];
  products: PublicProduct[];
};

const REFETCH_DEBOUNCE_MS = 350;

/** Client wrapper: giữ SSR ban đầu, đồng bộ realtime qua Supabase postgres_changes + RPC. */
export function BioLiveTemplate({
  username,
  profile,
  links,
  banners,
  categories,
  pinned,
  products,
}: LiveTemplateProps) {
  const [state, setState] = useState({
    profile,
    links,
    banners,
    categories,
    pinned,
    products,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setState({ profile, links, banners, categories, pinned, products });
  }, [profile, links, banners, categories, pinned, products]);

  useEffect(() => {
    const supabase = createPublicClient();
    const profileId = profile.id;

    const refetch = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const { data, error } = await supabase.rpc("get_public_profile", {
          p_username: username,
        });
        if (error || !data?.profile) return;

        const payload = data as PublicProfilePayload;
        setState({
          profile: payload.profile,
          links: payload.links,
          banners: payload.banners ?? [],
          categories: payload.categories ?? [],
          pinned: payload.pinned,
          products: payload.products,
        });
      }, REFETCH_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`bio:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `profile_id=eq.${profileId}`,
        },
        refetch,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
          filter: `profile_id=eq.${profileId}`,
        },
        refetch,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_categories",
          filter: `profile_id=eq.${profileId}`,
        },
        refetch,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profile_banners",
          filter: `profile_id=eq.${profileId}`,
        },
        refetch,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profileId}`,
        },
        refetch,
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [username, profile.id]);

  return (
    <BioTemplate
      profile={state.profile}
      links={state.links}
      banners={state.banners}
      categories={state.categories}
      pinned={state.pinned}
      products={state.products}
    />
  );
}
