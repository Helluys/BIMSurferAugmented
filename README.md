# BIMSurferAugmented

Web interface/server that allows displaying images on top of a 3D model loaded from IFC BIMServer.
Built on BIMSurfer and OpenCV Python.

# How to use
Launch the python server pyserver.py
Open localhost:8080/index.html in a web browser and connect to a BIMServer and open a project (you may use a localhost server)
Make sure to have OpenCV python installed

You should see the 3D view of the IFC project you opened. Click "Add image", and browse to an image file.
Pick points on the image by clicking the button and then specific spots on the image.
Go back to the model tab and pick the corresponding 3d points.

Click the "insert image" button to see your image matched on the 3d model (WIP)

WARNING : this is an experimental system. The server is not secure and should be used for testing purposes only!
