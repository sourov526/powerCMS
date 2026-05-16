"use client";

import { useRouter } from "@/navigation";

export default function StartAdminTourButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        window.sessionStorage.setItem("admin-tour", "1");
        router.push("/admin?tour=1");
      }}
      className="rounded-full border border-primary bg-primary px-5 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
    >
      Start tour
    </button>
  );
}
