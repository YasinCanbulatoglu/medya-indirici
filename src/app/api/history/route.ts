import { NextResponse } from "next/server";
import { getHistory, DOWNLOAD_DIR } from "@/lib/yt-dlp";
import path from "path";
import fs from "fs";

export async function GET() {
  const history = getHistory();
  return NextResponse.json(history);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");

  if (filename) {
    // Delete single file
    const safeName = path.basename(filename);
    const filePath = path.join(DOWNLOAD_DIR, safeName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Error deleting file:", e);
      }
    }
  } else {
    // Clear all files
    try {
      const files = fs.readdirSync(DOWNLOAD_DIR);
      for (const f of files) {
        if (f !== "history.json") {
          fs.unlinkSync(path.join(DOWNLOAD_DIR, f));
        }
      }
      fs.writeFileSync(path.join(DOWNLOAD_DIR, "history.json"), "[]", "utf-8");
    } catch (e) {
      console.error("Error clearing downloads:", e);
    }
  }

  return NextResponse.json({ success: true });
}
