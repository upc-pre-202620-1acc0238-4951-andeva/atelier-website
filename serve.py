import http.server, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8100

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
socketserver.TCPServer(('', PORT), H).serve_forever()
