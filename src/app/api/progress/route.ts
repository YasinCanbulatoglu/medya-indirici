import { NextResponse } from "next/server";
import { activeJobs } from "@/lib/yt-dlp";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Job ID gereklidir." }, { status: 400 });
  }

  const job = activeJobs.get(id);

  if (!job) {
    return NextResponse.json({ error: "İndirme görevi bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(job);
}
