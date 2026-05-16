import Link from "next/link";

export default async function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5] bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-6 md:px-8 lg:px-20">
        <p className="text-sm text-[#5A5955]">© 2026 Power CMS Co., Ltd.</p>
        <Link href="/admin" className="text-sm font-semibold text-[#1F8A5A]">
          Admin Panel
        </Link>
      </div>
    </footer>
  );
}
