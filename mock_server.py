import sys
import json
import logging
from http.server import HTTPServer, SimpleHTTPRequestHandler

logging.basicConfig(level=logging.INFO)

# Mock in-memory DB
DB = {}

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode('utf-8'))
            action = payload.get('action')

            global DB
            result = {}

            if action == 'setup':
                data = payload.get('data', {})
                for k, v in data.items():
                    DB[k] = v
                result = {'status': 'success', 'message': 'Setup complet.'}
            elif action == 'save':
                data = payload.get('data', {})
                for k, v in data.items():
                    DB[k] = v
                result = {'status': 'success', 'message': 'Sauvegardé.'}
            elif action == 'load':
                result = DB
            elif action == 'emergencyAccess':
                logging.info(f"EMERGENCY ACCESS triggered for {payload.get('section')} by {payload.get('name')}")
                result = {'status': 'success', 'message': 'Alerte envoyée.'}
            else:
                result = {'status': 'error', 'message': 'Action inconnue.'}

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            return

        super().do_POST()

if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, CustomHandler)
    logging.info(f'Mock server running on port {port}...')
    httpd.serve_forever()
