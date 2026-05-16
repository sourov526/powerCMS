import { adminUi } from "@/app/admin/core/admin-ui";
import StartAdminTourButton from "@/app/admin/guide/components/StartAdminTourButton";

export const dynamic = "force-dynamic";

const postsWorkflowItems = [
  "Create a draft post from the Posts section.",
  "Review content and metadata before publishing.",
  "Publish when approved and archive outdated posts.",
];

const coreAreasItems = [
  "Dashboard: quick status and summaries.",
  "Posts: create, edit, publish, and archive.",
  "Categories: organize post taxonomy.",
  "Users: manage accounts and roles.",
];

const notificationsItems = [
  "Check the top-right bell icon for updates.",
  "Open each notification to review details.",
  "Mark notifications as read after review.",
];

const seoItems = [
  "Use clear, unique titles and slugs.",
  "Write concise descriptions for discoverability.",
  "Keep content structure consistent.",
];

const tipsItems = [
  "Save work frequently while editing.",
  "Use the admin tour for onboarding.",
  "Keep roles and permissions minimal and clear.",
];

export default function AdminGuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Admin Guide</h1>
          <p className={adminUi.subtitle}>Overview and best practices for daily admin tasks.</p>
        </div>
        <StartAdminTourButton />
      </div>

      <section className={`${adminUi.card} ${adminUi.cardBody}`}>
        <h2 className={adminUi.sectionTitle}>Getting Started</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use this guide to understand the main sections of the admin panel and typical editing workflows.
        </p>
      </section>

      <section className={`${adminUi.card} ${adminUi.cardBody}`}>
        <h2 className={adminUi.sectionTitle}>Posts Workflow</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {postsWorkflowItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={`${adminUi.card} ${adminUi.cardBody}`}>
        <h2 className={adminUi.sectionTitle}>Core Areas</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {coreAreasItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={`${adminUi.card} ${adminUi.cardBody}`}>
        <h2 className={adminUi.sectionTitle}>Notifications</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {notificationsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={`${adminUi.card} ${adminUi.cardBody}`}>
        <h2 className={adminUi.sectionTitle}>SEO Basics</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {seoItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={`${adminUi.card} ${adminUi.cardBody}`}>
        <h2 className={adminUi.sectionTitle}>Tips</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {tipsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
