import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { createNotification } from "@/lib/services/notifications";

export type Contact = {
  id: number;
  companyName: string;
  homePage?: string | null;
  name: string;
  department: string;
  contactNumber: string;
  email: string;
  schedule: string;
  message: string;
  utmTerm?: string | null;
  kwid?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceOs?: string | null;
  locale?: string | null;
  privacyAgreed: boolean;
  createdAt: Date;
};

export type ContactWithMailDelivery = Contact & {
  mailDelivery?: {
    status: "sent" | "failed" | "skipped";
    toEmails?: string | null;
    subject?: string | null;
    messageId?: string | null;
    error?: string | null;
    createdAt: Date;
  } | null;
};

export async function createContact(input: {
  companyName: string;
  homePage?: string | null;
  name: string;
  department: string;
  contactNumber: string;
  email: string;
  schedule: string;
  message: string;
  utmTerm?: string | null;
  kwid?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceOs?: string | null;
  locale?: string | null;
  privacyAgreed: boolean;
  actorId?: number | null;
}) {
  await initCloudflareD1();
  const now = new Date();
  const insertRes = await db.execute(
    `INSERT INTO contacts
      (companyName, homePage, name, department, contactNumber, email, schedule, message, utmTerm, kwid, ipAddress, userAgent, deviceOs, locale, privacyAgreed, createdAt, createdBy, updatedBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.companyName,
      input.homePage ?? null,
      input.name,
      input.department,
      input.contactNumber,
      input.email,
      input.schedule,
      input.message,
      input.utmTerm ?? null,
      input.kwid ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
      input.deviceOs ?? null,
      input.locale ?? null,
      input.privacyAgreed ? 1 : 0,
      now,
      input.actorId ?? null,
      input.actorId ?? null,
    ],
  );

  const created = await db.queryOne<Contact>(
    `SELECT id,
            companyName,
            homePage,
            name,
            department,
            contactNumber,
            email,
            schedule,
            message,
            utmTerm,
            kwid,
            ipAddress,
            userAgent,
            deviceOs,
            locale,
            privacyAgreed,
            createdAt
     FROM contacts
     WHERE id = ?`,
    [insertRes.lastInsertId ?? 0],
  );

  await createNotification({
    type: "contact_entry",
    title: "New contact message",
    message: created ? `${created.name} • ${created.email}` : "New contact",
    link: "/admin/contact",
    recipientRole: "superuser",
    actorId: input.actorId ?? null,
  });

  if (!created) {
    throw new Error("Failed to create contact.");
  }

  return {
    ...created,
    createdAt: new Date(created.createdAt),
  };
}

export async function listContacts(): Promise<ContactWithMailDelivery[]> {
  await initCloudflareD1();

  const contacts = await db.query<Contact>(
    `SELECT contacts.id,
            contacts.companyName,
            contacts.homePage,
            contacts.name,
            contacts.department,
            contacts.contactNumber,
            contacts.email,
            contacts.schedule,
            contacts.message,
            contacts.utmTerm,
            contacts.kwid,
            contacts.ipAddress,
            contacts.userAgent,
            contacts.deviceOs,
            contacts.locale,
            contacts.privacyAgreed,
            contacts.createdAt
     FROM contacts
     ORDER BY contacts.createdAt DESC`,
  );

  return contacts.map((contact) => ({
    ...contact,
    createdAt: new Date(contact.createdAt),
    privacyAgreed: Boolean(contact.privacyAgreed),
    mailDelivery: null,
  }));
}

export async function deleteContactById(id: number) {
  await initCloudflareD1();
  await db.execute(`DELETE FROM contacts WHERE id = ?`, [id]);
}
