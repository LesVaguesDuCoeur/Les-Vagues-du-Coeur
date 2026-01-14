import http.server
import socketserver
import threading
import time
import os

PORT = 8000
DIRECTORY = "netlify"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()

if __name__ == "__main__":
    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()
    while True:
        time.sleep(1)
