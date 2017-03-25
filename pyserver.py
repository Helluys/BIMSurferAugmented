from BaseHTTPServer import BaseHTTPRequestHandler
from os import curdir, sep
from urlparse import urlparse, parse_qs
from urllib import quote_plus
import json
import cv2

class GetHandler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        return

    def do_GET(self):
        path = urlparse(self.path).path
        try:
            if path.endswith('.html') or path.endswith('.css') or path.endswith('.js') :
                #self.path has /test.html
                f = open(curdir + sep + path)
                
                #send code 200 response
                self.send_response(200)

                #send header first
                self.send_header('Content-type','text-html')
                self.end_headers()

                #send file content to client
                self.wfile.write(f.read())
                f.close()

            else :
                # unauthorized files : "i'm a teapot"
                self.send_response(418)
                self.end_headers()

        except IOError:
            self.send_error(404,'File Not Found: %s' % path)

        return

    def do_HEAD(self):
        self._set_headers()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/match_points" :
            self.data_string = self.rfile.read(int(self.headers['Content-Length']))
            data = json.loads(self.data_string)
            # data now holds a dictionnary with the JSON data in it
            
            # OpenCV work goes here

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps([[0, 0, 0], [100, 0, 0], [0, 100, 0]]))

        else :
            # unauthorized files : "i'm a teapot"
            self.send_response(418)
            self.end_headers()

        return

if __name__ == '__main__':
    from BaseHTTPServer import HTTPServer
    server = HTTPServer(('localhost', 8080), GetHandler)
    print 'Starting server at http://localhost:8080'
server.serve_forever()