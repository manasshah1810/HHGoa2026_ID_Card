import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { THEMES, type Theme } from "@/lib/themes";
import { generateBuilderTitle, nextBuilderTitle } from "@/lib/titles";
import { Download, Instagram, Linkedin, RefreshCw } from "lucide-react";
import { Lanyard } from "@/components/Lanyard";
import { createTeam, joinTeamByCode, regenerateInviteCode } from "@/lib/teams.functions";
import { createProfile } from "@/lib/profiles.functions";
import { LIMITS, sanitize, validateField } from "@/lib/validation";



import studioLogo from "@/assets/2-47 logo.svg";
import hhWordmark from "@/assets/hh-goa-wordmark.png.png";
import studioLogo247 from "@/assets/2-47 logo.svg";
import {
  downloadCanvas,
  loadImage,
  renderCard,
  renderPFP,
  type PhotoTransform,
} from "@/lib/render";
import { detectFace, type FaceBox } from "@/lib/face";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HH Goa 2026 — Builder Identity Generator" },
      {
        name: "description",
        content:
          "Upload your photo, become a Hacker House Goa 2026 builder. Get all 7 Goa designs at once — download or post any of them on X with #FrameInGoa.",
      },
      { property: "og:title", content: "HH Goa 2026 — Builder Identity Generator" },
      {
        property: "og:description",
        content: "Upload yourself → become a Hacker House Goa builder → pick your vibe → post it.",
      },
    ],
  }),
  component: Generator,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "builder";

const normalizeCode = (s: string) =>
  s
    .trim()
    .toUpperCase()
    .replace(/.*[/?&]TEAM=/i, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);


type Mode = "card" | "pfp";
type TeamMode = "none" | "create" | "join";

function Generator() {
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<Mode>("card");
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [kick, setKick] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((delta: number) => {
    if (!delta) return;
    setDir(delta > 0 ? 1 : -1);
    setIndex((i) => (i + delta + THEMES.length) % THEMES.length);
    setKick(true);
    window.setTimeout(() => setKick(false), 1100);
  }, []);

  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [transform, setTransform] = useState<PhotoTransform>({ zoom: 1, x: 0, y: 0 });
  const [face, setFace] = useState<FaceBox | null>(null);
  const [autoFrame, setAutoFrame] = useState(true);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [teamMode, setTeamMode] = useState<TeamMode>("none");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [joinedTeam, setJoinedTeam] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamSlug, setTeamSlug] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorToken, setCreatorToken] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState<"code" | "link" | null>(null);

  const inviteLink = useMemo(
    () => (typeof window === "undefined" || !inviteCode ? "" : `${window.location.origin}/?team=${inviteCode}`),
    [inviteCode],
  );


  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = normalizeCode(new URLSearchParams(window.location.search).get("team") ?? "");
    if (fromUrl) {
      setTeamMode("join");
      setTeamCode(fromUrl);
    }
  }, []);

  const copy = async (text: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCodeCopied(which);
      window.setTimeout(() => setCodeCopied(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const [slug, setSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const isMobile =
    typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const [bgs, setBgs] = useState<Record<string, HTMLImageElement>>({});
  const [qr, setQr] = useState<HTMLImageElement | null>(null);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const hd = true;
  const [titleInput, setTitleInput] = useState("");
  const [spin, setSpin] = useState(0);
  const [rolling, setRolling] = useState(false);
  const titleQueue = useRef<string[]>([]);

  const rollTitle = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setSpin((n) => n + 1);
    window.setTimeout(() => {
      setTitleInput((cur) => {
        const { title, queue } = nextBuilderTitle(titleQueue.current, cur);
        titleQueue.current = queue;
        return sanitize.title(title);
      });
      setRolling(false);
    }, 420);
  }, [rolling]);

  const builderTitle = titleInput.trim() || generateBuilderTitle("", name);

  const profileUrl = useMemo(() => {
    if (typeof window === "undefined" || !slug) return "";
    return `${window.location.origin}/b/${slug}`;
  }, [slug]);

  // QR points at the builder page and carries the team invite so a scan can join the crew.
  const qrUrl = useMemo(
    () => (profileUrl ? `${profileUrl}${inviteCode ? `?team=${inviteCode}` : ""}` : ""),
    [profileUrl, inviteCode],
  );


  useEffect(() => {
    let alive = true;
    Promise.all(THEMES.map((t) => loadImage(t.src).then((img) => [t.id, img] as const))).then(
      (pairs) => alive && setBgs(Object.fromEntries(pairs)),
    );
    loadImage(studioLogo).then((img) => alive && setLogo(img));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!qrUrl) return;
    let alive = true;
    QRCode.toDataURL(qrUrl, { margin: 0, width: 512, color: { dark: "#071c12", light: "#F7F3E7" } })
      .then(loadImage)
      .then((img) => alive && setQr(img));
    return () => {
      alive = false;
    };
  }, [qrUrl]);




  const drawAll = useCallback(() => {
    THEMES.forEach((t) => {
      const canvas = canvasRefs.current[t.id];
      const bg = bgs[t.id];
      if (!canvas || !bg) return;
      if (mode === "pfp") {
        renderPFP(canvas, t, bg, photo, transform, { name, handle }, logo, autoFrame ? face : null);
      } else {
        renderCard(
          canvas,
          t,
          bg,
          photo,
          transform,
          {
            name,
            handle,
            stack: "",
            title: builderTitle,
            team: joinedTeam,
            profileUrl,
          },
          qr,
          logo,
          autoFrame ? face : null,
          1,
        );
      }
    });
  }, [bgs, mode, photo, transform, name, handle, builderTitle, joinedTeam, profileUrl, qr, logo, face, autoFrame]);

  useEffect(() => {
    if (step !== 2) return;
    drawAll();
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(drawAll);
    }
  }, [step, drawAll]);

  /** Offscreen re-render at higher resolution for crisp downloads. */
  const renderHiRes = useCallback(
    (t: Theme, factor: number) => {
      const bg = bgs[t.id];
      if (!bg) return null;
      const c = document.createElement("canvas");
      if (mode === "pfp") {
        renderPFP(c, t, bg, photo, transform, { name, handle }, logo, autoFrame ? face : null, 1080 * factor);
      } else {
        renderCard(
          c,
          t,
          bg,
          photo,
          transform,
          { name, handle, stack: "", title: builderTitle, team: joinedTeam, profileUrl },
          qr,
          logo,
          autoFrame ? face : null,
          factor,
        );
      }
      return c;
    },
    [bgs, mode, photo, transform, name, handle, builderTitle, joinedTeam, profileUrl, qr, logo, face, autoFrame],
  );

  const downloadTheme = useCallback(
    (t: Theme) => {
      const factor = hd ? (mode === "pfp" ? 2 : 3) : 1;
      const c = factor > 1 ? renderHiRes(t, factor) : canvasRefs.current[t.id];
      if (c) downloadCanvas(c, `hh-goa-${t.id}-${mode}${hd ? "-hd" : ""}.png`);
    },
    [hd, mode, renderHiRes],
  );

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    setPhoto(img);
    setPhotoUrl(url);
    setTransform({ zoom: 1, x: 0, y: 0 });
    setFace(null);
    detectFace(img).then(setFace);
  };

  const submit = async () => {
    setError(null);
    const fieldError =
      validateField("name", name, true) ??
      validateField("handle", handle) ??
      validateField("title", titleInput) ??
      (teamMode === "create" ? validateField("team", teamName, true) : null);
    if (fieldError) return setError(fieldError);

    if (!photo) return setError("Upload a photo to continue.");
    setSaving(true);
    try {
      let teamId: string | null = null;
      let teamLabel = "";
      let code = "";

      if (teamMode === "join" && teamCode.trim()) {
        const entered = normalizeCode(teamCode);
        if (!entered) throw new Error("Enter the invite code your teammate shared.");
        const found = await joinTeamByCode({ data: { code: entered } });
        teamId = found.id;
        teamLabel = found.name;
        setTeamSlug(found.slug);
        code = found.code;
        setIsCreator(false);
      } else if (teamMode === "create" && teamName.trim()) {
        const created = await createTeam({ data: { name: teamName.trim() } });
        teamId = created.id;
        teamLabel = created.name;
        setTeamSlug(created.slug);
        code = created.code;
        setCreatorToken(created.creatorToken);
        setIsCreator(true);
      }
      setTeamId(teamId);

      setInviteCode(code);

      const { slug: newSlug } = await createProfile({
        data: {
          name: name.trim(),
          xHandle: handle,
          github,
          linkedin,
          builderTitle,
          inviteCode: code ?? undefined,
        },
      });
      setSlug(newSlug);
      setJoinedTeam(teamLabel);
      setStep(2);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const captionFor = (t: Theme) =>
    `Just became a Hacker House Goa 2026 builder — ${t.name} vibe 🌴💛 #FrameInGoa #HackerHouseGoa${
      profileUrl ? `\n${profileUrl}` : ""
    }`;

  const canvasFile = async (t: Theme) => {
    const canvas = (hd ? renderHiRes(t, mode === "pfp" ? 2 : 3) : null) ?? canvasRefs.current[t.id];
    if (!canvas) return null;
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return null;
    return new File([blob], `hh-goa-${t.id}-${mode}.png`, { type: "image/png" });
  };

  const tryNativeShare = async (t: Theme) => {
    try {
      const file = await canvasFile(t);
      if (!file) return false;
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (!nav.canShare?.({ files: [file] })) return false;
      await navigator.share({ files: [file], text: captionFor(t) });
      return true;
    } catch {
      return false;
    }
  };

  const saveAndCopy = async (t: Theme) => {
    downloadTheme(t);
    try {
      await navigator.clipboard.writeText(captionFor(t));
      return true;
    } catch {
      return false;
    }
  };

  const openApp = (appUrl: string, webUrl: string) => {
    if (isMobile) {
      window.location.href = appUrl;
      window.setTimeout(() => window.open(webUrl, "_blank", "noopener"), 1200);
    } else {
      window.open(webUrl, "_blank", "noopener");
    }
  };

  const shareOnX = (t: Theme) => {
    const text = encodeURIComponent(
      `Just became a Hacker House Goa 2026 builder — ${t.name} vibe 🌴💛\n#FrameInGoa #HackerHouseGoa`,
    );
    const url = profileUrl ? `&url=${encodeURIComponent(profileUrl)}` : "";
    window.open(`https://twitter.com/intent/tweet?text=${text}${url}`, "_blank", "noopener");
  };

  const shareOnLinkedIn = async (t: Theme) => {
    if (await tryNativeShare(t)) return;
    const copied = await saveAndCopy(t);
    setShareNote(
      `Card downloaded${copied ? " and caption copied" : ""} — attach it in the LinkedIn post window.`,
    );
    const target = profileUrl || (typeof window !== "undefined" ? window.location.origin : "");
    openApp(
      "linkedin://shareArticle",
      target
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(target)}`
        : "https://www.linkedin.com/feed/",
    );
  };

  const shareOnInstagram = async (t: Theme) => {
    if (await tryNativeShare(t)) return;
    const copied = await saveAndCopy(t);
    setShareNote(
      `Card saved${copied ? " and caption copied" : ""} — open Instagram and post it from your gallery.`,
    );
    openApp("instagram://library", "https://www.instagram.com/");
  };


  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-primary/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <img
            src={hhWordmark}
            alt="Hacker House Goa 2026"
            className="h-8 w-auto sm:h-10"
          />
          <div className="flex items-center gap-3">
            <span className="font-display hidden text-[12px] uppercase tracking-[0.25em] text-muted-foreground sm:block">
              #FrameInGoa 2026
            </span>
            <span className="flex items-center gap-2 border-l border-border pl-3">
              <img src={studioLogo247} alt="2:47 PM Studio" className="h-7 w-auto" />
            </span>
          </div>
        </div>
      </header>

      {step === 1 ? (
        <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
          <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">Step 1 of 2</p>
          <h1 className="font-display mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.01em] sm:text-7xl">
            Build your <span className="text-primary">HH Goa</span> identity
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Upload yourself, drop your handles, and we'll turn you into all seven Goa builder
            personalities at once.
          </p>

          <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 sm:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-sm border-2 border-dashed border-primary/50 bg-secondary/50 text-center text-sm text-muted-foreground transition-colors hover:border-primary">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Your upload"
                    className="h-full w-full object-cover"
                    style={{
                      transform: `translate(${transform.x * 100}%, ${transform.y * 100}%) scale(${transform.zoom})`,
                    }}
                  />
                ) : (
                  <span className="px-6">
                    <span className="font-display block text-4xl">＋</span>
                    Upload your photo
                  </span>
                )}
              </label>
              {photo && (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setAutoFrame((v) => !v)}
                    className={`font-display flex w-full items-center justify-between rounded-sm border-2 px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${autoFrame ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                  >
                    Face auto-crop
                    <span>{autoFrame ? "ON" : "OFF"}</span>
                  </button>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {face ? "Subject locked — sliders fine-tune it" : "Finding your face…"}
                  </p>
                  <Slider label="Zoom" min={0.6} max={3} step={0.01} value={transform.zoom} onChange={(v) => setTransform((t) => ({ ...t, zoom: v }))} />
                  <Slider label="Horizontal" min={-0.5} max={0.5} step={0.005} value={transform.x} onChange={(v) => setTransform((t) => ({ ...t, x: v }))} />
                  <Slider label="Vertical" min={-0.5} max={0.5} step={0.005} value={transform.y} onChange={(v) => setTransform((t) => ({ ...t, y: v }))} />
                  <button
                    type="button"
                    onClick={() => setTransform({ zoom: 1, x: 0, y: 0 })}
                    className="font-display text-[10px] uppercase tracking-widest text-muted-foreground underline hover:text-primary"
                  >
                    Reset framing
                  </button>
                </div>
              )}


            </div>

            <div className="space-y-4">
              <Field
                label="Builder name"
                value={name}
                onChange={(v) => setName(sanitize.name(v))}
                placeholder="Manas Shah"
                maxLength={LIMITS.name}
                error={validateField("name", name)}
              />
              <Field
                label="X handle"
                value={handle}
                onChange={(v) => setHandle(sanitize.handle(v))}
                placeholder="manasshah"
                prefix="@"
                maxLength={LIMITS.handle}
                error={validateField("handle", handle)}
              />
              <Field
                label="Builder title"
                value={titleInput}
                onChange={(v) => setTitleInput(sanitize.title(v))}
                placeholder="AI Engineer"
                maxLength={LIMITS.title}
                error={validateField("title", titleInput)}
                busy={rolling}
                action={
                  <button
                    type="button"
                    onClick={rollTitle}
                    disabled={rolling}
                    aria-label="Give me a random builder title"
                    aria-busy={rolling}
                    title="Random builder title"
                    className="ml-2 shrink-0 rounded-full border-2 border-border p-1.5 text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:border-accent disabled:text-accent"
                  >
                    <RefreshCw
                      key={spin}
                      className={`h-4 w-4 ${rolling ? "[animation:hh-spin-once_0.45s_cubic-bezier(0.4,0,0.2,1)_2]" : "[animation:hh-spin-once_0.5s_ease-out]"}`}
                      strokeWidth={2.5}
                    />
                  </button>
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="LinkedIn (optional)" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/you" />
                <Field label="GitHub (optional)" value={github} onChange={setGithub} placeholder="github.com/you" />
              </div>

              <div>
                <span className="font-display mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Team (optional)
                </span>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["none", "Solo builder"],
                      ["create", "Create a team"],
                      ["join", "Join with code"],
                    ] as [TeamMode, string][]
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setTeamMode(v)}
                      className={`font-display rounded-sm border-2 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                        teamMode === v
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {teamMode === "create" && (
                  <div className="mt-3">
                    <Field
                      label="Team name"
                      value={teamName}
                      onChange={(v) => setTeamName(sanitize.team(v))}
                      placeholder="Neural Pirates"
                      maxLength={LIMITS.team}
                      error={validateField("team", teamName)}
                    />

                  </div>
                )}
                {teamMode === "join" && (
                  <div className="mt-3">
                    <Field
                      label="Invite code or link"
                      value={teamCode}
                      onChange={(v) => setTeamCode(normalizeCode(v))}
                      placeholder="7K2QX9MP"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={submit}
                disabled={saving}
                className="font-display w-full rounded-sm bg-primary px-6 py-4 text-base font-extrabold uppercase tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {saving ? "Cooking…" : "Continue →"}
              </button>
              {error && <p className="text-sm text-accent">{error}</p>}
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
          <div className="text-center sm:text-left">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-accent sm:text-xs">
              Step 2 of 2
            </p>
            <h1 className="font-display mt-2 text-4xl font-black uppercase leading-[0.9] tracking-[-0.01em] sm:text-6xl">
              Choose your <span className="text-primary">vibe</span>
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:mx-0">
              Swipe or tap through the seven Goa builder designs.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 sm:justify-start">
            <div className="inline-flex rounded-sm border-2 border-border">
              {(["card", "pfp"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`font-display px-4 py-2 text-xs font-bold uppercase tracking-wide sm:text-sm ${
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {m === "card" ? "ID Card" : "PFP"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="font-display text-xs font-bold uppercase tracking-wide text-muted-foreground underline underline-offset-4 hover:text-foreground sm:text-sm"
            >
              Edit details
            </button>
          </div>

          {/* Lanyard + card stage */}
          <div
            className="relative mx-auto mt-2 w-full max-w-[380px] select-none sm:max-w-[440px]"
            onTouchStart={(e) => {
              touchX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchX.current;
              const end = e.changedTouches[0]?.clientX ?? null;
              touchX.current = null;
              if (start == null || end == null) return;
              const d = end - start;
              if (Math.abs(d) > 45) go(d < 0 ? 1 : -1);
            }}
          >
            {/* fabric lanyard + clasp */}
            <div className="relative z-10 overflow-hidden" style={{ marginBottom: "-22px" }}>
              <Lanyard kick={kick} />
            </div>


            <div
              className={`relative ${kick ? "hh-kick" : "hh-hang"}`}
              style={{ perspective: "1200px" }}
            >
              {THEMES.map((t, i) => (
                <div
                  key={t.id}
                  className={`${i === index ? `relative ${dir > 0 ? "hh-in-right" : "hh-in-left"}` : "pointer-events-none absolute inset-0 opacity-0"}`}
                  aria-hidden={i !== index}
                >
                  <div className="relative">
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[t.id] = el;
                      }}
                      className="block h-auto w-full rounded-md border-2 border-border bg-secondary shadow-[0_40px_70px_-40px_rgba(0,0,0,0.95)]"
                    />
                  </div>
                </div>

              ))}
            </div>
          </div>

          {/* pager */}
          <div className="mx-auto mt-6 flex w-full max-w-[380px] items-center justify-between gap-3 rounded-full border-2 border-border bg-secondary/40 px-3 py-2 sm:max-w-[440px]">
            <button
              onClick={() => go(-1)}
              aria-label="Previous design"
              className="font-display rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
            >
              ← Prev
            </button>
            <div className="text-center">
              <p className="font-display text-sm font-black tracking-[0.2em]">
                {String(index + 1).padStart(2, "0")} / {String(THEMES.length).padStart(2, "0")}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {THEMES[index]!.name}
              </p>
            </div>
            <button
              onClick={() => go(1)}
              aria-label="Next design"
              className="font-display rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
            >
              Next →
            </button>
          </div>

          <div className="mx-auto mt-3 flex w-full max-w-[380px] justify-center gap-1.5 sm:max-w-[440px]">
            {THEMES.map((t, i) => (
              <button
                key={t.id}
                aria-label={`Go to design ${i + 1}`}
                onClick={() => go(i - index)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>




          <div className="mx-auto mt-5 w-full max-w-[380px] space-y-2 sm:max-w-[440px]">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => downloadTheme(THEMES[index]!)}
                aria-label="Download"
                title="Download"
                className="flex items-center justify-center rounded-sm bg-primary px-2 py-4 text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Download className="h-5 w-5" strokeWidth={2.4} />
              </button>
              <button
                onClick={() => shareOnX(THEMES[index]!)}
                aria-label="Share on X"
                title="Share on X"
                className="flex items-center justify-center rounded-sm border-2 border-border px-2 py-4 transition-colors hover:border-accent hover:text-accent"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.9l-4.7-6.14L5.4 22H2.14l8.02-9.17L1.5 2h7.07l4.25 5.62L18.244 2Zm-1.14 18h1.8L7.02 3.9H5.09L17.104 20Z" />
                </svg>
              </button>
              <button
                onClick={() => shareOnInstagram(THEMES[index]!)}
                aria-label="Share on Instagram"
                title="Share on Instagram"
                className="flex items-center justify-center rounded-sm border-2 border-border px-2 py-4 transition-colors hover:border-accent hover:text-accent"
              >
                <Instagram className="h-5 w-5" strokeWidth={2.2} />
              </button>
              <button
                onClick={() => shareOnLinkedIn(THEMES[index]!)}
                aria-label="Share on LinkedIn"
                title="Share on LinkedIn"
                className="flex items-center justify-center rounded-sm border-2 border-border px-2 py-4 transition-colors hover:border-accent hover:text-accent"
              >
                <Linkedin className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            {shareNote && (
              <p className="pt-1 text-center text-xs text-muted-foreground">{shareNote}</p>
            )}
          </div>

          {inviteCode && (
            <div className="mx-auto mt-6 w-full max-w-[380px] rounded-md border-2 border-border bg-secondary/30 p-4 sm:max-w-[440px]">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                {joinedTeam ? `Team ${joinedTeam}` : "Your team"} — invite code
              </p>
              <p className="font-display mt-2 select-all text-3xl font-black tracking-[0.3em] text-primary">
                {inviteCode}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Share this with your teammates — it's also baked into the QR on your card.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => copy(inviteCode, "code")}
                  className="font-display rounded-sm border-2 border-border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors hover:border-accent hover:text-accent"
                >
                  {codeCopied === "code" ? "Copied!" : "Copy code"}
                </button>
                <button
                  onClick={() => copy(inviteLink, "link")}
                  className="font-display rounded-sm border-2 border-border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors hover:border-accent hover:text-accent"
                >
                  {codeCopied === "link" ? "Copied!" : "Copy link"}
                </button>
              </div>
              <button
                onClick={async () => {
                  const text = `Join my Hacker House Goa 2026 crew${joinedTeam ? ` "${joinedTeam}"` : ""} — invite code ${inviteCode}\n${inviteLink}`;
                  try {
                    if (navigator.share) {
                      await navigator.share({ text });
                      return;
                    }
                  } catch {
                    /* fall through */
                  }
                  copy(text, "link");
                }}
                className="font-display mt-2 w-full rounded-sm bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground"
              >
                Share invite
              </button>
              {isCreator && teamId && creatorToken && (
                <>
                  <button
                    onClick={async () => {
                      setInviteError(null);
                      setRegenerating(true);
                      try {
                        const next = await regenerateInviteCode({
                          data: { teamId, creatorToken },
                        });
                        setInviteCode(next.code);
                      } catch (e) {
                        setInviteError(
                          e instanceof Error ? e.message : "Could not refresh the invite code.",
                        );
                      } finally {
                        setRegenerating(false);
                      }
                    }}
                    disabled={regenerating}
                    className="font-display mt-2 w-full rounded-sm border-2 border-accent px-3 py-2 text-xs font-bold uppercase tracking-wide text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                  >
                    {regenerating ? "Refreshing…" : "Regenerate code / link"}
                  </button>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Regenerating kills the old code and link instantly. Re-download your card so the
                    QR carries the new invite.
                  </p>
                </>
              )}
              {inviteError && <p className="mt-2 text-xs text-accent">{inviteError}</p>}
            </div>
          )}


          {slug && (
            <p className="mx-auto mt-8 max-w-[440px] break-words text-center text-xs text-muted-foreground">
              Your builder page:{" "}
              <Link to="/b/$slug" params={{ slug }} search={{ team: "" }} className="text-primary underline underline-offset-4">
                {profileUrl}
              </Link>
            </p>
          )}
        </section>
      )}

    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  error,
  prefix,
  action,
  busy,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string | null;
  prefix?: string;
  action?: ReactNode;
  busy?: boolean;
}) {
  const near = maxLength ? value.length >= maxLength * 0.8 : false;
  return (
    <label className="block">
      <span className="font-display mb-1.5 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="min-w-0 truncate">{label}</span>
        {maxLength && (
          <span
            className={`shrink-0 tabular-nums tracking-normal ${
              error ? "text-destructive" : near ? "text-primary" : "text-muted-foreground/70"
            }`}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </span>
      <span
        className={`flex items-center rounded-sm border-2 bg-secondary/40 px-4 focus-within:border-primary ${
          error ? "border-destructive" : "border-border"
        }`}
      >
        {prefix && <span className="mr-1 text-sm text-muted-foreground">{prefix}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={!!error}
          className={`w-full min-w-0 bg-transparent py-3 text-sm outline-none transition-all duration-200 ${
            busy ? "opacity-40 blur-[1px]" : "opacity-100"
          }`}
        />
        {action}
      </span>
      {error && <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}


function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="block">
      <span className="font-display mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[oklch(0.9_0.19_100)]"
      />
    </label>
  );
}

