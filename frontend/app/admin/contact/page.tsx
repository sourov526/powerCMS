import { adminUi } from "@/app/admin/core/admin-ui";

export default function AdminContactPage() {
  return (
    <div className={adminUi.page}>
      <div className="space-y-3">
        <h1 className={adminUi.title}>Contact Form Disabled</h1>
        <p className={adminUi.subtitle}>Contact management has been removed from this project.</p>
      </div>
    </div>
  );
}
