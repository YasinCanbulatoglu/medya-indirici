import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Target URL required" }, { status: 400 });
  }

  try {
    const headers = new Headers();
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    if (
      targetUrl.includes("popcornvakti") ||
      targetUrl.includes("ydf") ||
      targetUrl.includes("yabancidizi") ||
      targetUrl.includes("83283335") ||
      targetUrl.includes("lile18") ||
      targetUrl.includes("sheila")
    ) {
      headers.set("Referer", "https://yabancidizi.news/");
      headers.set("Origin", "https://yabancidizi.news");
    }

    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Proxy fetch failed (${response.status}): ${response.statusText || "Forbidden"}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";

    // Read ArrayBuffer ONCE
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if M3U8 text playlist
    if (
      targetUrl.includes(".m3u8") ||
      targetUrl.includes("sheila") ||
      targetUrl.includes("/q/") ||
      contentType.includes("mpegurl") ||
      contentType.includes("m3u8")
    ) {
      const text = buffer.toString("utf-8");

      if (text.startsWith("#EXTM3U") || text.includes("#EXT-X-STREAM-INF") || text.includes("#EXTINF")) {
        const baseUrl = new URL(targetUrl);

        // Get request host header (e.g., localhost:3000 or 192.168.1.X:3000) instead of 0.0.0.0
        const hostHeader = req.headers.get("host") || "localhost:3000";
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const appOrigin = `${protocol}://${hostHeader}`;

        const rewrittenM3u8 = text.replace(
          /^(https?:\/\/[^\s]+|[\/\w.-]+\.m3u8[^\s]*|[\/\w.-]+\.ts[^\s]*|[\/\w.-]+\.png[^\s]*|q\/\d+)/gm,
          (match) => {
            if (match.startsWith("#")) return match;
            let absoluteUrl = match;
            if (!match.startsWith("http")) {
              absoluteUrl = new URL(match, baseUrl.href).href;
            }
            return `${appOrigin}/api/stream-proxy?url=${encodeURIComponent(absoluteUrl)}`;
          }
        );

        return new NextResponse(rewrittenM3u8, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          },
        });
      }
    }

    // Binary Video / TS Segment Data
    let streamContentType = "video/mp2t";
    if (targetUrl.endsWith(".mp4")) streamContentType = "video/mp4";
    else if (targetUrl.endsWith(".webm")) streamContentType = "video/webm";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": streamContentType,
        "Content-Length": buffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    console.error("Stream proxy error:", err);
    return NextResponse.json({ error: "Failed to proxy stream" }, { status: 500 });
  }
}
