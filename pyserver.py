from BaseHTTPServer import BaseHTTPRequestHandler
from os import curdir, sep
from urlparse import urlparse, parse_qs
from urllib import quote_plus
import json
import cv2
import numpy as np

class GetHandler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        return

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/" :
            path = "/index.html"

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
            
            npImagePoints = np.array(data['imagePoints'])
            # append zeros to image points so they are 3D
            #zeros = np.zeros((npImagePoints.shape[0], 1), dtype=npImagePoints.dtype)
            #npImagePoints = np.append(npImagePoints, zeros, 1)

            npModelPoints = np.array(data['modelPoints'])
            
            npCameraIntrisics = np.array(data['cameraIntrinsics'])

            # find pose
            #try :
            success, rvec, tvec = cv2.solvePnP(npModelPoints, npImagePoints, npCameraIntrisics, np.array([]))
            if success :
                
                rangle = np.linalg.norm(rvec) * 360 / np.pi
                raxis = rvec / rangle
                print tvec
                print raxis
                print rangle
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'tvec' : tvec.tolist(), 'raxis' : raxis.tolist(), 'rangle' : rangle}))
                
            else :
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False}))
                
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