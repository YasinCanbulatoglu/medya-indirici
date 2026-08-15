import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";
import puppeteer from "puppeteer";

const execAsync = promisify(exec);

export const DOWNLOAD_DIR = path.join(os.tmpdir(), "medya-downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

export function getYtDlpPath(): string {
  const localPath = path.join(os.homedir(), ".local", "bin", "yt-dlp");
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  return "yt-dlp";
}

export interface VideoFormat {
  id: string;
  label: string;
  ext: string;
  quality: string;
  filesizeApprox?: number;
  isAudioOnly?: boolean;
}

export interface MediaMetadata {
  url: string;
  streamUrl?: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationFormatted: string;
  uploader: string;
  extractor: string;
  formats: VideoFormat[];
  defaultVideoFormats: { quality: string; label: string }[];
  defaultAudioFormats: { quality: string; label: string }[];
}

export interface DownloadJob {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  format: "mp3" | "mp4";
  quality: string;
  progress: number;
  status: "starting" | "downloading" | "converting" | "completed" | "error";
  speed?: string;
  eta?: string;
  downloadUrl?: string;
  filename?: string;
  filesize?: string;
  error?: string;
  createdAt: number;
}

// In-memory active download jobs
export const activeJobs = new Map<string, DownloadJob>();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function getActiveJob(id: string): DownloadJob | undefined {
  return activeJobs.get(id);
}

export function getAllActiveJobs(): DownloadJob[] {
  return Array.from(activeJobs.values());
}

export function getHistory(): DownloadJob[] {
  const historyFile = path.join(DOWNLOAD_DIR, "history.json");
  try {
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    }
  } catch (e) {
    console.error("Read history error:", e);
  }
  return [];
}

async function deepScrapeMediaStream(
  pageUrl: string
): Promise<{ streamUrl: string; pageTitle?: string; ogImage?: string } | null> {
  let browser;
  try {
    console.log(`[Puppeteer] Deep scraping page & poster image: ${pageUrl}`);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    let foundStreamUrl: string | null = null;

    page.on("request", (req) => {
      const u = req.url();
      const isStaticAsset =
        u.endsWith(".png") ||
        u.endsWith(".jpg") ||
        u.endsWith(".jpeg") ||
        u.endsWith(".svg") ||
        u.endsWith(".css") ||
        u.endsWith(".js") ||
        u.includes("analytics") ||
        u.includes("google") ||
        u.includes("facebook") ||
        u.includes("favicons");

      if (!isStaticAsset && !foundStreamUrl) {
        if (
          u.includes(".m3u8") ||
          u.includes(".mp4") ||
          u.includes("/sheila") ||
          (u.includes("/embed/") && (u.includes("popcorn") || u.includes("vidmoly") || u.includes("vidoza")))
        ) {
          console.log(`[Puppeteer] Intercepted network video stream: ${u}`);
          foundStreamUrl = u;
        }
      }
    });

    try {
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise((r) => setTimeout(r, 3500));
    } catch (navErr) {
      console.log("Puppeteer navigation timed out, continuing stream extraction...");
    }

    const pageTitle = await page.title();

    // Scrape cover poster image
    const ogImage = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:image"], meta[name="twitter:image"]');
      if (og) return og.getAttribute("content") || undefined;

      const posterImg = document.querySelector(
        ".series-profile-thumb, img[src*='uploads/series'], .bg-cover-bg img, img[src*='poster'], img[src*='cover']"
      );
      if (posterImg) return posterImg.getAttribute("src") || undefined;

      return undefined;
    });

    let resolvedOgImage = ogImage;
    if (resolvedOgImage && !resolvedOgImage.startsWith("http")) {
      try {
        resolvedOgImage = new URL(resolvedOgImage, pageUrl).href;
      } catch (e) {
        // Keep original
      }
    }

    if (foundStreamUrl) {
      await browser.close();
      return { streamUrl: foundStreamUrl, pageTitle, ogImage: resolvedOgImage };
    }

    // Inspect frames & DOM if network interception didn't catch it
    const frames = page.frames();
    for (const frame of frames) {
      try {
        const frameHtml = await frame.content();
        const m3u8Match =
          frameHtml.match(/file:\s*["']([^"']+\.m3u8[^"']*|[^"']+\/sheila[^"']*|[^"']+\/embed\/[^"']+)["']/i) ||
          frameHtml.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i) ||
          frameHtml.match(/(https?:\/\/[^"'\s]+\.(?:mp4|webm)[^"'\s]*)/i);

        if (m3u8Match && m3u8Match[1]) {
          const matchUrl = m3u8Match[1];
          const isInvalidAsset =
            matchUrl.endsWith(".webmanifest") ||
            matchUrl.endsWith(".json") ||
            matchUrl.endsWith(".png") ||
            matchUrl.endsWith(".jpg") ||
            matchUrl.endsWith(".css") ||
            matchUrl.endsWith(".js") ||
            matchUrl.endsWith(".ico");

          if (!isInvalidAsset) {
            foundStreamUrl = matchUrl;
            console.log(`[Puppeteer] Extracted stream from frame regex: ${foundStreamUrl}`);
            break;
          }
        }
      } catch (e) {
        // Ignore cross-origin frame read errors
      }
    }

    if (!foundStreamUrl) {
      // DOM Scanning for video player iframes, links, and data-attributes
      const domPlayerUrl = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll("iframe[src]"));
        for (const iframe of iframes) {
          const src = iframe.getAttribute("src") || "";
          if (
            src.includes("embed") ||
            src.includes("player") ||
            src.includes("popcorn") ||
            src.includes("vidmoly") ||
            src.includes("vidoza") ||
            src.includes("ok.ru") ||
            src.includes("sibnet") ||
            src.includes("dood") ||
            src.includes("stream")
          ) {
            return src;
          }
        }

        const videoSrc = document.querySelector("video src, video[src], source[src]");
        if (videoSrc) {
          return videoSrc.getAttribute("src") || undefined;
        }

        const dataElem = document.querySelector(
          "[data-src*='http'], [data-video*='http'], [data-url*='http'], [data-stream*='http']"
        );
        if (dataElem) {
          return (
            dataElem.getAttribute("data-src") ||
            dataElem.getAttribute("data-video") ||
            dataElem.getAttribute("data-url") ||
            dataElem.getAttribute("data-stream") ||
            undefined
          );
        }

        return undefined;
      });

      if (domPlayerUrl) {
        let resolvedDomUrl = domPlayerUrl;
        if (resolvedDomUrl.startsWith("//")) {
          resolvedDomUrl = "https:" + resolvedDomUrl;
        } else if (!resolvedDomUrl.startsWith("http")) {
          try {
            resolvedDomUrl = new URL(resolvedDomUrl, pageUrl).href;
          } catch (e) {}
        }
        foundStreamUrl = resolvedDomUrl;
        console.log(`[Puppeteer] Extracted player URL from DOM scan: ${foundStreamUrl}`);
      }
    }

    await browser.close();
    if (foundStreamUrl) {
      return { streamUrl: foundStreamUrl, pageTitle, ogImage: resolvedOgImage };
    }
    return null;
  } catch (err) {
    console.error("Puppeteer deep scrape error:", err);
    if (browser) await browser.close();
    return null;
  }
}

export async function analyzeMediaUrl(url: string): Promise<MediaMetadata> {
  const lowerUrl = url.toLowerCase();

  if (
    (lowerUrl.includes("onlyfans.com") || lowerUrl.includes("fansly.com") || lowerUrl.includes("patreon.com")) &&
    !lowerUrl.includes(".mp4") &&
    !lowerUrl.includes(".m3u8")
  ) {
    throw new Error(
      "🔒 OnlyFans / Fansly profil sayfaları korumalıdır.\n" +
        "💡 İpucu: Sayfadaki videoya sağ tıklayıp 'Video/Medya Adresini Kopyala' diyerek kopyaladığınız doğrudan .mp4 veya .m3u8 adresini buraya yapıştırın."
    );
  }

  const ytDlp = getYtDlpPath();

  let targetUrl = url;
  let rawStdout = "";
  let extractedTitle: string | null = null;
  let extractedOgImage: string | null = null;

  // Attempt 1: Direct yt-dlp run
  try {
    const cmd = `"${ytDlp}" -J --no-warnings --no-playlist --extractor-args "youtube:player_client=android,web" --user-agent "${USER_AGENT}" --referer "${url}" "${url}"`;
    const { stdout } = await execAsync(cmd, { maxBuffer: 15 * 1024 * 1024 });
    rawStdout = stdout;
  } catch (directErr: any) {
      console.log(`Direct yt-dlp failed for ${url}, initiating Headless Chrome Deep Scraper...`);

      const scraped = await deepScrapeMediaStream(url);

      if (scraped && scraped.streamUrl) {
        targetUrl = scraped.streamUrl;
        extractedTitle = scraped.pageTitle || null;
        extractedOgImage = scraped.ogImage || null;

        try {
          console.log(`Running yt-dlp on Puppeteer extracted stream: ${targetUrl}`);
          const cmd = `"${ytDlp}" -J --no-warnings --no-playlist --user-agent "${USER_AGENT}" --referer "${url}" "${targetUrl}"`;
          const { stdout } = await execAsync(cmd, { maxBuffer: 15 * 1024 * 1024 });
          rawStdout = stdout;
        } catch (scrapedErr: any) {
          console.error("yt-dlp failed on extracted stream:", scrapedErr);
          throw new Error("Gömülü video akışı çözümlendi ancak indirilebilir format oluşturulamadı.");
        }
      } else {
        if (lowerUrl.includes("onlyfans.com") || lowerUrl.includes("fansly.com") || lowerUrl.includes("patreon.com")) {
          throw new Error(
            "🔒 OnlyFans / Fansly hesabı korumalıdır.\n" +
              "💡 İpucu: Sayfadaki videoya sağ tıklayıp 'Video/Medya Adresini Kopyala' diyerek kopyaladığınız adresi buraya yapıştırın."
          );
        }

        throw new Error(
          "Bu web sayfasında doğrudan indirilebilir video tespit edilemedi.\n" +
            "💡 İpucu: Eğer bu bir dizi/film izleme sitesi ise, lütfen doğrudan video oynatıcı ekranındaki bölüme/videoya sağ tıklayıp 'Video Adresini Kopyala' seçeneğini kullanın veya vidoza/vidmoly/youtube oynatıcı bağlantısını yapıştırın."
        );
      }
    }

  const rawData = JSON.parse(rawStdout);

  const duration = rawData.duration || 0;
  const extractor = (rawData.extractor || rawData.extractor_key || "Web").toLowerCase();

  let title = rawData.title || extractedTitle || "Medya Dosyası";
  if (title === "sheila" && extractedTitle) {
    title = extractedTitle.split("|")[0].replace("İzle", "").trim();
  }

  let thumbnail = rawData.thumbnail || rawData.thumbnails?.[rawData.thumbnails.length - 1]?.url || "";
  if (!thumbnail || thumbnail.length < 5) {
    if (extractedOgImage) {
      thumbnail = extractedOgImage;
    }
  }

  const uploader = rawData.uploader || rawData.channel || rawData.uploader_id || "Bilinmiyor";

  const defaultVideoFormats = [
    { quality: "best", label: "✨ En Yüksek Kalite (Otomatik)" },
    { quality: "1080", label: "🎬 1080p Full HD" },
    { quality: "720", label: "📱 720p HD (Mobil İdeal)" },
    { quality: "480", label: "⚡ 480p SD (Hızlı İndirme)" },
    { quality: "360", label: "💾 360p Düşük Boyut" },
  ];

  const defaultAudioFormats = [
    { quality: "320", label: "🎵 320 kbps (HQ Stüdyo Kalitesi - MP3)" },
    { quality: "256", label: "🎧 256 kbps (Yüksek Kalite - MP3)" },
    { quality: "192", label: "🔊 192 kbps (Standart Kalite - MP3)" },
    { quality: "128", label: "⚡ 128 kbps (Ekonomik - MP3)" },
  ];

  const directStreamUrl = rawData.url || rawData.manifest_url || targetUrl;

  return {
    url: targetUrl,
    streamUrl: directStreamUrl,
    title,
    thumbnail,
    duration,
    durationFormatted: formatSeconds(duration),
    uploader,
    extractor,
    formats: [],
    defaultVideoFormats,
    defaultAudioFormats,
  };
}

export function startDownloadJob(
  jobId: string,
  url: string,
  mediaFormat: "mp3" | "mp4",
  quality: string,
  title: string,
  thumbnail: string
): DownloadJob {
  const job: DownloadJob = {
    id: jobId,
    url,
    title,
    thumbnail,
    format: mediaFormat,
    quality,
    progress: 0,
    status: "starting",
    createdAt: Date.now(),
  };

  activeJobs.set(jobId, job);

  runYtDlpDownload(job).catch((err) => {
    console.error(`Download job ${jobId} failed:`, err);
    job.status = "error";
    job.error = err.message || "İndirme sırasında hata oluştu.";
    activeJobs.set(jobId, { ...job });
  });

  return job;
}

async function runYtDlpDownload(job: DownloadJob) {
  const ytDlp = getYtDlpPath();
  const safeFilename = `${job.id}_${Date.now()}`;
  const outputTemplate = path.join(DOWNLOAD_DIR, `${safeFilename}.%(ext)s`);

  const args: string[] = [
    "--no-playlist",
    "--no-warnings",
    "--newline",
    "--extractor-args",
    "youtube:player_client=android,web",
    "--user-agent",
    USER_AGENT,
    "--referer",
    job.url,
    "-o",
    outputTemplate,
  ];

  if (job.format === "mp3") {
    args.push("-x", "--audio-format", "mp3");
    if (job.quality === "320") {
      args.push("--audio-quality", "0");
    } else if (job.quality === "256") {
      args.push("--audio-quality", "1");
    } else if (job.quality === "192") {
      args.push("--audio-quality", "2");
    } else {
      args.push("--audio-quality", "5");
    }
  } else {
    args.push("-f", "b/bestvideo+bestaudio/best");
  }

  args.push(job.url);

  console.log(`[yt-dlp] Running download command with Chrome cookies: ${ytDlp} ${args.join(" ")}`);
  const child = spawn(ytDlp, args);

  job.status = "downloading";
  activeJobs.set(job.id, { ...job });

  child.stdout.on("data", (data: Buffer) => {
    const str = data.toString();

    const percentMatch = str.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      job.progress = parseFloat(percentMatch[1]);
    }

    const speedMatch = str.match(/at\s+([0-9.]+[KiMG]?i?B\/s)/);
    if (speedMatch) {
      job.speed = speedMatch[1];
    }

    const etaMatch = str.match(/ETA\s+([0-9:]+)/);
    if (etaMatch) {
      job.eta = etaMatch[1];
    }

    if (str.includes("Extracting URL") || str.includes("[ExtractAudio]")) {
      job.status = "converting";
    }

    activeJobs.set(job.id, { ...job });
  });

  child.stderr.on("data", (data: Buffer) => {
    console.error(`[yt-dlp stderr] ${data.toString()}`);
  });

  return new Promise<void>((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        let downloadedFile = "";
        try {
          const files = fs.readdirSync(DOWNLOAD_DIR);
          const matched = files.find((f) => f.startsWith(safeFilename));
          if (matched) {
            downloadedFile = matched;
          }
        } catch (e) {
          console.error("Read dir error:", e);
        }

        if (downloadedFile) {
          const fullPath = path.join(DOWNLOAD_DIR, downloadedFile);
          const stats = fs.statSync(fullPath);

          job.status = "completed";
          job.progress = 100;
          job.filename = downloadedFile;
          job.downloadUrl = `/api/files/${encodeURIComponent(downloadedFile)}`;
          job.filesize = formatBytes(stats.size);
          activeJobs.set(job.id, { ...job });

          saveToHistory(job);
          resolve();
        } else {
          job.status = "error";
          job.error = "Dosya indirildi fakat diskte bulunamadı.";
          activeJobs.set(job.id, { ...job });
          reject(new Error("Downloaded file not found on disk"));
        }
      } else {
        job.status = "error";
        job.error = `İndirme işlemi ${code} kodu ile başarısız oldu.`;
        activeJobs.set(job.id, { ...job });
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
}

function saveToHistory(job: DownloadJob) {
  const historyFile = path.join(DOWNLOAD_DIR, "history.json");
  let history: DownloadJob[] = [];

  try {
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    }
  } catch (e) {
    console.error("Read history file error:", e);
  }

  history = [job, ...history.filter((item) => item.id !== job.id)].slice(0, 100);

  try {
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (e) {
    console.error("Save history file error:", e);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatSeconds(sec: number): string {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m > 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
