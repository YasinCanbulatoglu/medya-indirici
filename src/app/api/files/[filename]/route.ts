import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { DOWNLOAD_DIR } from "@/lib/yt-dlp";

export async function GET(
  req: Request,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  const decodedFilename = decodeURIComponent(filename);
  const filePath = path.join(DOWNLOAD_DIR, path.basename(decodedFilename));

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let contentType = "application/octet-stream";
  if (ext === ".mp3") contentType = "audio/mpeg";
  else if (ext === ".mp4") contentType = "video/mp4";
  else if (ext === ".webm") contentType = "video/webm";
  else if (ext === ".m4a") contentType = "audio/mp4";

  const { searchParams } = new URL(req.url);
  const isInline = searchParams.get("inline") === "true";

  const fileStream = fs.createReadStream(filePath);
  
  // Convert Node ReadStream to Web ReadableStream
  const readableWebStream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(chunk));
      fileStream.on("end", () => controller.close());
      fileStream.on("error", (err) => controller.error(err));
    },
  });

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Length": stat.size.toString(),
    "Accept-Ranges": "bytes",
  });

  if (!isInline) {
    // Force download with readable file name
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(decodedFilename)}"`
    );
  } else {
    headers.set("Content-Disposition", "inline");
  }

  return new NextResponse(readableWebStream, {
    status: 200,
    headers,
  });
}
