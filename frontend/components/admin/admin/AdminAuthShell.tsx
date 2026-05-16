import type { ReactNode } from "react";

export default function AdminAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F2] text-[#1b1b1b]">
      {children}
    </div>
  );
}
