#!/usr/bin/env python3
"""
Simple HTTP Server with COOP/COEP headers for WebLLM
Usage: python server.py [port]
Default port: 8000
"""

import http.server
import socketserver
import sys
from functools import partial

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Required headers for SharedArrayBuffer and WebGPU
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'credentialless')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        super().end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("[%s] %s\n" %
                         (self.log_date_time_string(),
                          format % args))

def run_server(port=8000):
    handler = CORSRequestHandler

    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"╔════════════════════════════════════════════════════════╗")
        print(f"║  WebOS Québec - Serveur de développement              ║")
        print(f"╠════════════════════════════════════════════════════════╣")
        print(f"║  Port: {port:<47} ║")
        print(f"║  URL:  http://localhost:{port}/WOSQ.v4.wm.html{' ' * (23 - len(str(port)))}║")
        print(f"╠════════════════════════════════════════════════════════╣")
        print(f"║  Headers activés:                                      ║")
        print(f"║    ✓ Cross-Origin-Opener-Policy: same-origin          ║")
        print(f"║    ✓ Cross-Origin-Embedder-Policy: credentialless     ║")
        print(f"║    ✓ WebLLM/WebGPU supporté                            ║")
        print(f"╚════════════════════════════════════════════════════════╝")
        print(f"\nAppuyez sur Ctrl+C pour arrêter le serveur\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✓ Serveur arrêté")
            sys.exit(0)

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
