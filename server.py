#!/usr/bin/env python3
"""
TontiTrust Local Development & Demo Server
PRD Reference: TT-PRD-TSD-001 v1.0
Zero-dependency HTTP server with proper MIME types for ES6 modules.
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = int(os.environ.get("PORT", 3000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class TontiTrustHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS for demo and development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key, X-Request-Id')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        # Ensure correct JS MIME type for ES modules
        if path.endswith('.js') or path.endswith('.mjs'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.yaml') or path.endswith('.yml'):
            return 'text/yaml'
        return super().guess_type(path)

def run():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), TontiTrustHTTPHandler) as httpd:
        print(f"================================================================")
        print(f"  TONTITRUST - Démo & MVP Pilote (Fintech Tontines)")
        print(f"  Serveur démarré sur : http://localhost:{PORT}")
        print(f"  Documentation API   : http://localhost:{PORT}/docs/openapi.yaml")
        print(f"================================================================")
        print("  Appuyez sur Ctrl+C pour arrêter le serveur.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt du serveur TontiTrust.")
            sys.exit(0)

if __name__ == "__main__":
    run()
