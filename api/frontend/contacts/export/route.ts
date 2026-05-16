export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { listContacts } from "@/lib/services/contacts";
import ExcelJS from "exceljs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "superuser") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const contacts = await listContacts();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("contacts");
  sheet.columns = [
    { header: "id", key: "id" },
    { header: "companyName", key: "companyName" },
    { header: "homePage", key: "homePage" },
    { header: "name", key: "name" },
    { header: "department", key: "department" },
    { header: "contactNumber", key: "contactNumber" },
    { header: "email", key: "email" },
    { header: "schedule", key: "schedule" },
    { header: "message", key: "message" },
    { header: "utmTerm", key: "utmTerm" },
    { header: "kwid", key: "kwid" },
    { header: "ipAddress", key: "ipAddress" },
    { header: "userAgent", key: "userAgent" },
    { header: "deviceOs", key: "deviceOs" },
    { header: "locale", key: "locale" },
    { header: "privacyAgreed", key: "privacyAgreed" },
    { header: "createdAt", key: "createdAt" },
    { header: "mailStatus", key: "mailStatus" },
    { header: "mailToEmails", key: "mailToEmails" },
    { header: "mailSubject", key: "mailSubject" },
    { header: "mailMessageId", key: "mailMessageId" },
    { header: "mailError", key: "mailError" },
    { header: "mailCreatedAt", key: "mailCreatedAt" },
  ];

  contacts.forEach((contact) => {
    sheet.addRow({
      id: contact.id,
      companyName: contact.companyName,
      homePage: contact.homePage ?? "",
      name: contact.name,
      department: contact.department,
      contactNumber: contact.contactNumber,
      email: contact.email,
      schedule: contact.schedule,
      message: contact.message,
      utmTerm: contact.utmTerm ?? "",
      kwid: contact.kwid ?? "",
      ipAddress: contact.ipAddress ?? "",
      userAgent: contact.userAgent ?? "",
      deviceOs: contact.deviceOs ?? "",
      locale: contact.locale ?? "",
      privacyAgreed: contact.privacyAgreed ? 1 : 0,
      createdAt: contact.createdAt.toISOString(),
      mailStatus: contact.mailDelivery?.status ?? "",
      mailToEmails: contact.mailDelivery?.toEmails ?? "",
      mailSubject: contact.mailDelivery?.subject ?? "",
      mailMessageId: contact.mailDelivery?.messageId ?? "",
      mailError: contact.mailDelivery?.error ?? "",
      mailCreatedAt: contact.mailDelivery?.createdAt
        ? contact.mailDelivery.createdAt.toISOString()
        : "",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=contacts.xlsx",
    },
  });
}
