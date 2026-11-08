#!/usr/bin/env python3
"""
Zero-dependency static server for the birthday-four snapshot (Python 3.7+).

    python3 server.py          -> http://localhost:3000
    PORT=8080 python3 server.py
    python3 server.py 8080

Emulates the two things the real Vercel deployment provides:
    /_next/image?url=/ref/girl1.jpg&w=256&q=75  ->  ./ref/girl1.jpg
    /api/time                                   ->  {"now": <epoch ms>}
"""
import json
import os
import posixpath
import time
import urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):  # keep the console quiet-ish
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # --- Next.js image optimizer emulation ---
        if path == "/_next/image":
            q = urllib.parse.parse_qs(parsed.query)
            target = (q.get("url") or [""])[0]
            target = posixpath.normpath("/" + target.lstrip("/"))
            local = os.path.join(ROOT, target.lstrip("/"))
            if os.path.isfile(local):
                ctype = self.guess_type(local)
                with open(local, "rb") as fh:
                    data = fh.read()
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                self.send_error(404, "image not found")
            return

        # --- countdown clock ---
        if path == "/api/time":
            body = json.dumps({"now": int(time.time() * 1000)}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".mjs": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".ico": "image/x-icon",
            ".mp3": "audio/mpeg",
            ".mp4": "video/mp4",
            ".woff2": "font/woff2",
            ".woff": "font/woff",
            ".otf": "font/otf",
            ".ttf": "font/ttf",
        }.get(ext, "application/octet-stream")


def main(port=3000):
    srv = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"\n  🎂  birthday-four snapshot running")
    print(f"      http://localhost:{port}\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    import sys

    p = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 3000))
    main(p)
