import { NextResponse } from "next/server";
import { analyzeMediaUrl } from "@/lib/yt-dlp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Geçerli bir URL giriniz." }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    try {
      new URL(trimmedUrl);
    } catch {
      return NextResponse.json(
        { error: "Geçersiz URL formatı. Lütfen http:// veya https:// ile başlayan bir bağlantı girin." },
        { status: 400 }
      );
    }

    const metadata = await analyzeMediaUrl(trimmedUrl);
    return NextResponse.json(metadata);
  } catch (error: any) {
    console.error("Analyze error:", error);
    const msg = error.message || "";
    
    return NextResponse.json(
      {
        error: msg.includes("💡 İpucu")
          ? msg
          : "Bu bağlantıdan doğrudan medya çekilemedi. Film/Dizi sitelerinde bölüm izleme sayfasını açıp video oynatıcı bağlantısını (örn. Youtube/Vidoza/Vidmoly/OK.ru) veya oynatıcıya sağ tıklayıp video adresini kopyalayabilirsiniz.",
      },
      { status: 500 }
    );
  }
}
