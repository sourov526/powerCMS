"use client";

import {
  buildGeeeNTagManagerBootstrap,
  getGeeeNTagManagerId,
} from "@/lib/geeen-tag-manager";

type GeeeNTagManagerProps = {
  id?: string | null;
};

export function GeeeNTagManagerScript({
  id = getGeeeNTagManagerId(),
}: GeeeNTagManagerProps) {
  if (!id) return null;

  return (
    <>
      {/* GeeeN Tag Manager */}
      <script
        id={`geeen-tag-manager-${id}`}
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: buildGeeeNTagManagerBootstrap(id),
        }}
      />
      {/* End GeeeN Tag Manager */}
    </>
  );
}
