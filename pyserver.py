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
            # read input JSON
            self.data_string = self.rfile.read(int(self.headers['Content-Length']))
            data = json.loads(self.data_string)
            npImagePoints = np.array(data['imagePoints'])
            npModelPoints = np.array(data['modelPoints'])

            # append zeros to image points so they are 3D
            zeros = np.zeros((npImagePoints.shape[0], 1), dtype=npImagePoints.dtype)
            npImagePoints = np.insert(npImagePoints, [1], zeros, 1)

            # find pose
            try :
                success, T, inliers = cv2.estimateAffine3D(npImagePoints, npModelPoints)
            except :
                success = False
            
            if success :
                
                # append last line to transformation matrix (estimateAffine3D output is 3x4)
                l = np.array([[0, 0, 0, 1]])
                T = np.append(T, l, 0)

                # extract tvec, scale, raxis and rangle
                tvec = T[0:3,3]
                rotscale = T[0:3:1, 0:3:1]
                scale = np.array([np.linalg.norm(rotscale[:,0]), 1, np.linalg.norm(rotscale[:,2])])
                rot = np.array([rotscale[:,0]/scale[0], rotscale[:,1]/scale[1], rotscale[:,2]/scale[2]])
                rvec, Jac = cv2.Rodrigues(rot)
                raxis = rvec / np.linalg.norm(rvec)
                rangle = np.linalg.norm(rvec) * 360 / np.pi

                print tvec
                print raxis
                print rangle
                print scale

                # switch axes from OpenCV to WebGL systems
                tvec[0], tvec[1], tvec[2] = tvec[0], tvec[1], -tvec[2]
                raxis[0], raxis[1], raxis[2] = raxis[0], raxis[1], -raxis[2]
                #scale[0], scale[1], scale[2] = scale[2], scale[0], scale[1]
                
                # send JSON object response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True,
                                             'tvec' : tvec.tolist(),
                                             'raxis' : raxis.tolist(),
                                             'rangle' : rangle,
                                             'scale' : scale.tolist()}))
                
            else :
                # notify when solvePnP failed
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