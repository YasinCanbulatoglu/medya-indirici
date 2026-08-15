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
      targetUrl.includes("yabancidizi")
    ) {
      headers.set("Referer", "https://ydf.popcornvakti.net/");
    }

    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Proxy fetch failed (${response.status}): ${response.statusText || "Forbidden"}` },
        { status: response.status }
      );
    }

    let html = await response.text();

    // Inject base tag for relative assets
    const baseUrl = new URL(targetUrl).origin;
    const baseTag = `<base href="${baseUrl}/" target="_blank">`;

    // Strip ad scripts / popups safely without 's' regex flag
    html = html.replace(/<script[^>]*popunder[^>]*>[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<script[^>]*adsterra[^>]*>[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<script[^>]*betting[^>]*>[\s\S]*?<\/script>/gi, "");
    html = html.replace(/window\.open/g, "console.log");

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}`);
    } else {
      html = baseTag + html;
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("Embed proxy error:", err);
    return NextResponse.json({ error: "Failed to proxy embed" }, { status: 500 });
  }
}
