"""Verify or rebuild Mindbranch's 152 photographs from art.js itself.

art.js has always called itself a generated file, but the scripts it named did
not exist anywhere in the workspace, so the set could not be checked and could
not be recovered if a file were lost. This is that script.

It is DETERMINISTIC: art.js already records the exact Commons File: page for
every slot, so nothing here searches, ranks, or can pick a different picture.
The curation those 152 images went through (four rounds, a contact sheet, the
never-people rule) is preserved in art.js and this script only re-executes it.

    py refetch_photos.py                 verify - no downloads, nothing written
    py refetch_photos.py --refetch       redownload and reinstall every image
    py refetch_photos.py --refetch --only mde_core ocd_obs
    py refetch_photos.py --refetch --apply    also rewrite art.js's metadata

Verify checks three things per slot: the Commons file still exists, the local
.webp is on disk, and its real pixel size matches the w/h recorded in art.js.
That last one matters - those numbers are what reserve space in the page, so
drift there is a layout jump nobody would trace back to here.

Refetch is resumable (photowork/state.json). Per Knowledge/image.md: paced at
1.5 s and batched 50 titles per API call (rate-limiting-is-the-real-enemy-on-bulk-fetches - Wikimedia IP-blocks after
~80 rapid hits), descriptive User-Agent (use-a-descriptive-user-agent-for-wikimedia), shrink-only resize that
never crops (resize-with-the-shrink-only-suffix-and-never-crop), and the extension read from the downloaded bytes rather
than from the URL (save-a-download-under-the-extension-in-its-own-bytes).
"""
import argparse
import json
import pathlib
import re
import subprocess
import sys
import urllib.parse

PROJ = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(PROJ.parents[2] / "Pipelines" / "_lib"))
from commons import CommonsClient, ext_value, looks_like_image, strip_tags  # noqa: E402

ART = PROJ / "art.js"
PHOTOS_DIR = PROJ / "photos"
WORK = PROJ / "photowork"
UA = "Mindbranch/1.0 (question header photographs; hosbosmos@gmail.com)"

# One entry per line in art.js, and the two fields needed to refetch carry no
# escapes: the file stem is a slug and the Commons URL is percent-encoded.
ENTRY_RE = re.compile(
    r"^\s*'(?P<key>[a-z0-9_]+)':\s*\{\s*f:\s*'(?P<f>[a-z0-9-]+)'"
    r".*?\bw:\s*(?P<w>\d+),\s*h:\s*(?P<h>\d+)"
    r".*?\bp:\s*'(?P<p>[^']+)'\s*\},?\s*$"
)
MAGIC = [(b"\xff\xd8\xff", ".jpg"), (b"\x89PNG\r\n\x1a\n", ".png"), (b"GIF8", ".gif")]


def sniff(blob):
    """The extension the bytes actually are. Commons' URLs lie both ways."""
    for sig, ext in MAGIC:
        if blob.startswith(sig):
            return ext
    if blob[:4] == b"RIFF" and blob[8:12] == b"WEBP":
        return ".webp"
    return None


def tidy_artist(raw):
    """extmetadata Artist is HTML with links; reduce it to a plain name."""
    name = re.sub(r"\s+", " ", strip_tags(raw or "")).strip()
    name = re.sub(r"^(User:|talk\b)", "", name, flags=re.I).strip()
    return name[:80] or "Unknown"


def read_entries():
    """Every slot in art.js, in file order."""
    entries = []
    for line in ART.read_text(encoding="utf-8").splitlines():
        m = ENTRY_RE.match(line)
        if m:
            entries.append({
                "key": m["key"], "f": m["f"],
                "w": int(m["w"]), "h": int(m["h"]),
                "page": m["p"], "title": title_from_page(m["p"]),
            })
    return entries


def title_from_page(url):
    """`.../wiki/File:A%20B.jpg` -> `File:A B.jpg`, the exact API title."""
    tail = url.rsplit("/wiki/", 1)[-1]
    return urllib.parse.unquote(tail).replace("_", " ")


def identify(path):
    out = subprocess.run(["magick", "identify", "-format", "%w %h", str(path)],
                         capture_output=True, text=True, check=True).stdout.split()
    return int(out[0]), int(out[1])


def commons_info(client, titles):
    """imageinfo for up to 50 titles in ONE call, keyed by normalised title."""
    data = client.api_json({
        "action": "query", "format": "json", "titles": "|".join(titles),
        "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": "1600",
    }, use_cache=False)
    query = data.get("query") or {}
    # `normalized` maps what we asked for to what Commons calls it.
    alias = {n["to"]: n["from"] for n in query.get("normalized", [])}
    found = {}
    for page in (query.get("pages") or {}).values():
        name = page.get("title", "")
        asked = alias.get(name, name)
        found[asked] = page.get("imageinfo", [None])[0] if "imageinfo" in page else None
    return found


def verify(entries):
    client = CommonsClient(UA, min_interval=1.5, cache_dir=WORK / "cache")
    problems = []

    for i in range(0, len(entries), 50):
        batch = entries[i:i + 50]
        print(f"  checking Commons {i + 1}-{i + len(batch)} of {len(entries)} ...")
        info = commons_info(client, [e["title"] for e in batch])
        for e in batch:
            if info.get(e["title"]) is None:
                problems.append(f"{e['key']}: Commons no longer has {e['title']}")

    for e in entries:
        local = PHOTOS_DIR / f"{e['f']}.webp"
        if not local.exists():
            problems.append(f"{e['key']}: photos/{e['f']}.webp is missing")
            continue
        w, h = identify(local)
        if (w, h) != (e["w"], e["h"]):
            problems.append(
                f"{e['key']}: photos/{e['f']}.webp is {w}x{h} but art.js says "
                f"{e['w']}x{e['h']} - the page will reserve the wrong space")

    stray = sorted(p.name for p in PHOTOS_DIR.glob("*.webp")
                   if p.stem not in {e["f"] for e in entries})
    for name in stray:
        problems.append(f"photos/{name} is on disk but no art.js entry points at it")

    return problems


def refetch(entries, apply_meta):
    WORK.mkdir(parents=True, exist_ok=True)
    state_path = WORK / "state.json"
    done = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}
    client = CommonsClient(UA, min_interval=1.5, cache_dir=WORK / "cache")

    for n, e in enumerate(entries, 1):
        if e["key"] in done:
            print(f"  [{n}/{len(entries)}] {e['key']}: already done this pass")
            continue
        info = commons_info(client, [e["title"]]).get(e["title"])
        if not info:
            print(f"  [{n}/{len(entries)}] {e['key']}: NOT FOUND  {e['title']}")
            continue

        blob = client.get_bytes(info.get("thumburl") or info["url"])
        if not looks_like_image(blob, min_bytes=10_000):
            print(f"  [{n}/{len(entries)}] {e['key']}: download was not an image")
            continue
        raw = WORK / f"raw_{e['f']}{sniff(blob) or '.jpg'}"
        raw.write_bytes(blob)

        final = PHOTOS_DIR / f"{e['f']}.webp"
        # `>` shrinks only and keeps the aspect ratio, so portrait stays
        # portrait. Never crop: an earlier build cropped this set to a fixed
        # ratio and cut the subject out of a third of the photographs.
        subprocess.run(["magick", str(raw), "-resize", "1200x760>",
                        "-quality", "82", "-strip", str(final)], check=True)
        w, h = identify(final)
        meta = info.get("extmetadata") or {}
        done[e["key"]] = {
            "f": e["f"], "w": w, "h": h,
            "t": (ext_value(meta, "ObjectName")
                  or e["title"][5:].rsplit(".", 1)[0]),
            "a": tidy_artist(ext_value(meta, "Artist")),
            "l": ext_value(meta, "LicenseShortName") or "",
            "p": e["page"],
        }
        state_path.write_text(json.dumps(done, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  [{n}/{len(entries)}] {e['key']}: {w}x{h}  "
              f"{final.stat().st_size // 1024} KB  {done[e['key']]['a']} "
              f"[{done[e['key']]['l']}]")

    print(f"\n{len(done)} of {len(entries)} slots installed -> {state_path}")
    if apply_meta:
        rewrite_art(done)
    else:
        print("art.js was NOT touched. Re-run with --apply to write the new "
              "sizes and credits into it.")


def rewrite_art(done):
    """Put the fetched w/h/t/a/l back into art.js, one line at a time.

    Line-level, never a wholesale regeneration: a slot that was skipped or that
    failed this pass must keep exactly the metadata it already had.
    """
    out, changed = [], 0
    for line in ART.read_text(encoding="utf-8").splitlines(keepends=True):
        m = ENTRY_RE.match(line)
        rec = done.get(m["key"]) if m else None
        if not rec:
            out.append(line)
            continue
        indent = line[:len(line) - len(line.lstrip())]
        tail = "," if line.rstrip().endswith(",") else ""
        new = (f"{indent}'{m['key']}': {{ f: '{rec['f']}', w: {rec['w']}, h: {rec['h']}, "
               f"t: {js_str(rec['t'])}, a: {js_str(rec['a'])}, l: {js_str(rec['l'])}, "
               f"p: '{rec['p']}' }}{tail}\n")
        changed += new != line
        out.append(new)
    ART.write_text("".join(out), encoding="utf-8")
    print(f"art.js rewritten - {changed} entry line(s) changed")


def js_str(value):
    return "'" + str(value).replace("\\", "\\\\").replace("'", "\\'") + "'"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--refetch", action="store_true",
                    help="redownload and reinstall the images (default: verify only)")
    ap.add_argument("--apply", action="store_true",
                    help="with --refetch, write the new sizes and credits into art.js")
    ap.add_argument("--only", nargs="+", metavar="KEY",
                    help="limit to these art.js keys")
    args = ap.parse_args()

    entries = read_entries()
    if not entries:
        print("ERROR: no entries parsed out of art.js - the PHOTOS format changed.")
        return 1
    if args.only:
        wanted = set(args.only)
        missing = wanted - {e["key"] for e in entries}
        if missing:
            print(f"ERROR: no such art.js key(s): {', '.join(sorted(missing))}")
            return 1
        entries = [e for e in entries if e["key"] in wanted]
    print(f"{len(entries)} slot(s) from art.js\n")

    if args.refetch:
        refetch(entries, args.apply)
        return 0

    problems = verify(entries)
    print()
    if problems:
        print("PROBLEMS:")
        for p in problems:
            print("  -", p)
        return 1
    print(f"All {len(entries)} photographs verified: on Commons, on disk, "
          "and the recorded pixel sizes are correct.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
