import Link from "next/link";

export default function AdminAuthHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e1dfdc] bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-4 md:px-6">
        <span className="text-sm font-semibold text-[#252422]">Admin</span>
        <Link href="/" className="text-sm font-semibold text-[#1F8A5A]">
          Back to Home
        </Link>
      </div>
    </header>
  );
}
