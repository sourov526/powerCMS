export const runtime = "nodejs";
import { getSessionUser } from "@/lib/auth/auth-server";
import { listRecruitEntries } from "@/lib/services/recruit-entries";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "superuser") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const entries = await listRecruitEntries();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("recruit_entries");
  sheet.columns = [
    { header: "id", key: "id" },
    { header: "name", key: "name" },
    { header: "furigana", key: "furigana" },
    { header: "gender", key: "gender" },
    { header: "birthdate", key: "birthdate" },
    { header: "email", key: "email" },
    { header: "phone", key: "phone" },
    { header: "postalCode", key: "postalCode" },
    { header: "address", key: "address" },
    { header: "apartment", key: "apartment" },
    { header: "resumeMediaId", key: "resumeMediaId" },
    { header: "workHistoryMediaId", key: "workHistoryMediaId" },
    { header: "notes", key: "notes" },
    // { header: "locale", key: "locale" },
    { header: "status", key: "status" },
    { header: "createdAt", key: "createdAt" },
    { header: "updatedAt", key: "updatedAt" },
  ];

  entries.forEach((entry) => {
    sheet.addRow({
      id: entry.id,
      name: entry.name,
      furigana: entry.furigana,
      gender: entry.gender,
      birthdate: entry.birthdate,
      email: entry.email,
      phone: entry.phone,
      postalCode: entry.postalCode,
      address: entry.address,
      apartment: entry.apartment ?? "",
      resumeMediaId: entry.resumeMediaId ?? "",
      workHistoryMediaId: entry.workHistoryMediaId ?? "",
      notes: entry.notes ?? "",
      // locale: entry.locale ?? "",
      status: entry.status,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=recruit-entries.xlsx",
    },
  });
}
