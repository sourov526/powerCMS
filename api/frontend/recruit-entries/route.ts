export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createRecruitEntry } from "@/lib/services/recruit-entries";
import { storeUploadedFile } from "@/lib/services/media";

const MAX_LENGTHS = {
  name: 120,
  furigana: 120,
  birthdate: 40,
  email: 200,
  phone: 30,
  postalCode: 20,
  address: 300,
  apartment: 300,
  notes: 3000,
};

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : null;
}

function isPdfFile(file: File) {
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return mime === "application/pdf" || name.endsWith(".pdf");
}

async function storeEntryFile(file: File | null) {
  if (!file) return null;
  if (file.size <= 0) return null;
  if (!isPdfFile(file)) {
    throw new Error("file_type_invalid");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("file_too_large");
  }
  const media = await storeUploadedFile(file, null);
  return media.id;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const name = readText(formData, "name");
  const furigana = readText(formData, "furigana");
  const gender = readText(formData, "gender");
  const birthdate = readText(formData, "birthdate");
  const email = readText(formData, "email");
  const phone = readText(formData, "phone");
  const postalCode = readText(formData, "postalCode");
  const address = readText(formData, "address");
  const apartment = readText(formData, "apartment");
  const notes = readText(formData, "notes");
  const resume = readFile(formData, "resume");
  const workHistory = readFile(formData, "workHistory");

  if (!name || !furigana || !gender || !birthdate || !email || !phone || !postalCode || !address) {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }

  if (
    name.length > MAX_LENGTHS.name ||
    furigana.length > MAX_LENGTHS.furigana ||
    birthdate.length > MAX_LENGTHS.birthdate ||
    email.length > MAX_LENGTHS.email ||
    phone.length > MAX_LENGTHS.phone ||
    postalCode.length > MAX_LENGTHS.postalCode ||
    address.length > MAX_LENGTHS.address ||
    apartment.length > MAX_LENGTHS.apartment ||
    notes.length > MAX_LENGTHS.notes
  ) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  if (gender !== "male" && gender !== "female" && gender !== "na") {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "email_invalid" }, { status: 400 });
  }

  try {
    const resumeMediaId = await storeEntryFile(resume);
    const workHistoryMediaId = await storeEntryFile(workHistory);
    const created = await createRecruitEntry({
      name,
      furigana,
      gender,
      birthdate,
      email,
      phone,
      postalCode,
      address,
      apartment: apartment || null,
      resumeMediaId,
      workHistoryMediaId,
      notes: notes || null,
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "file_type_invalid") {
      return NextResponse.json({ error: "file_type_invalid" }, { status: 400 });
    }
    if (message === "file_too_large") {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }
    console.error("[recruit-entry] Failed to submit entry", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
