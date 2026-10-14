# -*- coding: utf-8 -*-
"""Servidor local para probar el sitio (con soporte de Range, necesario para videos que avanzan con el scroll).

Uso:  python _build/serve.py      → http://127.0.0.1:8765
"""
import os, re, http.server, socketserver

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", "8765"))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=ROOT, **kw)

    def send_head(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path): return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        size = os.path.getsize(path)
        start = int(m.group(1)) if m and m.group(1) else 0
        end = int(m.group(2)) if m and m.group(2) else size - 1
        end = min(end, size - 1)
        if start > end: self.send_error(416); return None
        f = open(path, "rb"); f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, src, dst):
        rem = getattr(self, "_remaining", None)
        if rem is None: return super().copyfile(src, dst)
        while rem > 0:
            chunk = src.read(min(64 * 1024, rem))
            if not chunk: break
            dst.write(chunk); rem -= len(chunk)
        self._remaining = None

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store")   # always show the latest changes
        super().end_headers()

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    # On Windows "reuse" lets two servers share the port and serve stale pages; never allow it there
    daemon_threads = True; allow_reuse_address = os.name != "nt"; request_queue_size = 128

if __name__ == "__main__":
    print(f"http://127.0.0.1:{PORT}")
    Server(("127.0.0.1", PORT), Handler).serve_forever()
