import { NextResponse } from "next/server";
import { startDownloadJob } from "@/lib/yt-dlp";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, format, quality, title, thumbnail } = body;

    if (!url || !format || !quality) {
      return NextResponse.json({ error: "Eksik parametreler." }, { status: 400 });
    }

    const jobId = randomUUID().substring(0, 8);
    const mediaFormat = format === "mp3" ? "mp3" : "mp4";

    const job = startDownloadJob(
      jobId,
      url,
      mediaFormat,
      quality,
      title || "Medya Dosyası",
      thumbnail || ""
    );

    return NextResponse.json(job);
  } catch (error: any) {
    console.error("Download route error:", error);
    return NextResponse.json({ error: "İndirme başlatılamadı." }, { status: 500 });
  }
}
