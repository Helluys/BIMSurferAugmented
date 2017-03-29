// image manager class

define(function () {
	ImageManager = function() {
		// {id : {name, source, url, image, tablink, tab, selectoroption, imagePoints, modelPoints, plane}}
		var imageDictionary = {};
		var pickingPoints = false;
		var lastID = 0;
		var currentPoint = -1;
		var currentTab = -1;
		var modelSpheres = [];
		var planes = {}

		// add an empty image and update UI accordingly (image manager and tab selector)
		this.addEmptyImage = function() {
			lastID++;
			var imgID = lastID;
		    var imgName = "Image " + imgID;

		    // add an option in the image selector
		    imageselector = document.getElementById("imageselector");
		    var option = document.createElement("option");
		    option.setAttribute("value", imgID);
		    option.text = imgName;
		    imageselector.add(option);

		    // add an actual tab and open it
		    contentwrapper = document.getElementById("contentwrapper");
		    var tabcontent = document.createElement("div");
		    tabcontent.id = "tab_" + imgID;
		    tabcontent.className += " tabcontent";
		 	tabcontent.innerHTML = "<canvas class='imagedisplay' onclick='imageManager.imageclicked(event)'></canvas>";
		 	contentwrapper.appendChild(tabcontent);

			// add a tab button
		    tabselector = document.getElementById("tabselector");
		    var button = document.createElement("button");
		    button.id = "tablink_" + imgID;
		    button.className += " tablinks";
		    button.onclick = function() { imageManager.opentab(imgID); };
		    button.innerHTML = imgName;
		    tabselector.appendChild(button);

		 	imageDictionary[imgID] = {name: imgName, source: null, image: null, tablink: button, tab: tabcontent, selectoroption: option, imagePoints: [], modelPoints: []};
		 	this.opentab(imgID);
		};

		this.getCurrentImageID = function() {
			var imageID = document.getElementById("imageselector").value;
			return imageID !== "null" ? imageID : -1;
		}

		this.getCurrentImageName = function() {
			var imageID = document.getElementById("imageselector").value;
			return imageID !== "null" ? imageDictionary[imageID].name : null;
		}

		this.getCurrentImage = function() {
			var imageID = document.getElementById("imageselector").value;
			return imageID !== "null" ? imageDictionary[imageID] : null;
		}

		this.deleteImage = function() {
			var imageID = this.getCurrentImageID();
			var image = imageDictionary[imageID];

			// remove option in the image selector
		    imageselector = document.getElementById("imageselector");
		    imageselector.remove(imageselector.selectedIndex);

		    // remove the tab
		    image.tab.parentElement.removeChild(image.tab);

		    // remove the tab button
		    image.tablink.parentElement.removeChild(image.tablink);

		    delete image;
		    this.opentab(-1);
		}

		this.nameChanged = function(newName) {
			this.renameImage(document.getElementById("imageselector").value, newName);
		};

		this.renameImage = function(id, newName) {
			if(!imageDictionary.hasOwnProperty(id)) {
				console.error("No image has the id " + id);
				return;
			}

			// update dictionary
			imageDictionary[id].name = newName;
			imageDictionary[id].tablink.innerHTML = newName;
			imageDictionary[id].selectoroption.text = newName;

			this.updateImageManager();
		};

		this.imageChanged = function() {
			var imageID = this.getCurrentImageID();
			if(currentTab >= 0)
				this.opentab(imageID);
		}

		this.updateImageManager = function() {
			var selectedimagename = this.getCurrentImageName();
			if(selectedimagename != null) {
				var selectedimage = this.getCurrentImage();

				document.getElementById("imageProperties").style.visibility = "visible";
				document.getElementById("imageRenamer").value = selectedimagename;
				document.getElementById("imageBrowser").value = ''; // setting a value is insecure operation

				document.getElementById("imageThumbnail").style.display = selectedimage.image === null ? "none" : "initial";
				document.getElementById("imageThumbnail").setAttribute("src", selectedimage.url);

				document.getElementById("togglePickPoint").style.display = selectedimage.image === null ? "none" : "initial";
				document.getElementById("togglePickPoint").disabled = (currentTab == -1 && selectedimage.imagePoints.length == 0) ? true : false;
				document.getElementById("pickPointWarning").style.display = (currentTab == -1 && selectedimage.imagePoints.length == 0) ? "initial" : "none";

				var table = document.getElementById("pointtable");
				var i, tableHTML = "";
				for(i = 0; i < selectedimage.imagePoints.length; i++)
					tableHTML += this.createPointTable(selectedimage, i, selectedimage.imagePoints[i], selectedimage.modelPoints[i]);
				table.innerHTML = tableHTML;

				document.getElementById("insertImageButton").style.display = selectedimage.image === null ? "none" : "initial";
				document.getElementById("insertImageButton").disabled = selectedimage.imagePoints.length >= 4 ? false : true;
				document.getElementById("insertImageWarning").style.display = (selectedimage.image === null || selectedimage.imagePoints.length >= 4) ? "none" : "initial";
	            
	            if(selectedimage.image != null) {
		            var thumbnail = document.getElementById("imageThumbnail");
		            thumbnail.height = thumbnail.width * selectedimage.image.height / selectedimage.image.width;
		            thumbnail.style.backgroundImage = 'url("' + selectedimage.url + '")';
		            drawPoints(selectedimage);
		        }
			}
			else {
				document.getElementById("imageProperties").style.visibility = "hidden";
			}
		};

		this.fileChanged = function(evt) {
		    var URL = window.webkitURL || window.URL;
		    var url = URL.createObjectURL(evt.target.files[0]);
		    var img = new Image();
		    img.src = url;

		    img.onload = function() {
				var imageID = imageManager.getCurrentImageID();
				var selectedimage = imageDictionary[imageID];
				var selectedimagename = imageDictionary[imageID].name;
				selectedimage.source = evt.target.files[0].name;
				selectedimage.image = img;
				selectedimage.url = url;
				selectedimage.imagePoints = [];
				selectedimage.modelPoints = [];
				imageManager.renameImage(imageID, selectedimage.source);
				imageManager.updateImageManager();
				imageManager.updateModelSpheres();

				var tab = selectedimage.tab;
				var canvas = tab.children[0];
				canvas.width = img.width;
				canvas.height = img.height;
	            canvas.style.backgroundImage = 'url("' + url + '")'; 
	            canvas.style.backgroundSize = '100% 100%';
	            var thumbnail = document.getElementById("imageThumbnail");
	            thumbnail.style.backgroundImage = 'url("' + url + '")'; 
		    };
		};

		this.createPointTable = function(image, pointID, imagePoint, modelPoint) {
			return 	"<tr><td class='imagenumber' rowspan='2' onclick='imageManager.removePoint(" + pointID + ")'>" + pointID + "</td><td>image</td>" +
						"<td><label for='point" + pointID + "ix'>x </label><input id='point" + pointID + "ix' type='number' value='" + imagePoint[0] + "' min='0' max='" + image.image.width + "' step='any' onchange='imageManager.updatePoint(" + pointID + ")' /></td>" + 
						"<td><label for='point" + pointID + "iy'>y </label><input id='point" + pointID + "iy' type='number' value='" + imagePoint[1] + "' min='0' max='" + image.image.height + "' step='any' onchange='imageManager.updatePoint(" + pointID + ")' /></td>" +
						"<td></td>" +
					"</tr><tr><td>model</td>" +
						"<td><label for='point" + pointID + "mx'>x </label><input id='point" + pointID + "mx' type='number' value='" + modelPoint[0] + "' step='any' onchange='imageManager.updatePoint(" + pointID + ")' /></td>" +
						"<td><label for='point" + pointID + "my'>y </label><input id='point" + pointID + "my' type='number' value='" + modelPoint[1] + "' step='any' onchange='imageManager.updatePoint(" + pointID + ")' /></td>" +
						"<td><label for='point" + pointID + "mz'>z </label><input id='point" + pointID + "mz' type='number' value='" + modelPoint[2] + "' step='any' onchange='imageManager.updatePoint(" + pointID + ")' /></td>" +
					"</tr><tr class='separator'><td></td><td></td><td></td><td></td><td></td></tr>";
		};

		this.opentab = function(imageID) {
		    var i, tabcontent, tablinks;
		    currentTab = imageID < 0 ? -1 : imageID;

		    // Get all elements with class="tabcontent" and hide them
		    tabcontent = document.getElementsByClassName("tabcontent");
		    for (i = 0; i < tabcontent.length; i++) {
		        tabcontent[i].style.display = "none";
		    }

		    // Get all elements with class="tablinks" and remove the class "active"
		    tablinks = document.getElementsByClassName("tablinks");
		    for (i = 0; i < tablinks.length; i++) {
	        	tablinks[i].className = tablinks[i].className.replace(" active", "");
		    }

		    // Show the current tab, and add an "active" class to the button that opened the tab
		    activetab = document.getElementById(imageID < 0 ? "tab_model" : "tab_" + imageID);
		    activetab.style.display = "block";
		    activetablink = document.getElementById(imageID < 0 ? "tablink_model" : "tablink_" + imageID);
		    activetablink.className += " active";
		    if(imageID >= 0) {
		    	document.getElementById("imageselector").value = imageID;
			}

			togglePickPoint = false;
	    	
	    	this.updateImageManager();
	    	this.updateModelSpheres();
			if(pickingPoints)
				this.togglePickPoint();
		};

		this.togglePickPoint = function() {
			pickingPoints = !pickingPoints;
			var image = this.getCurrentImage();
			if(image === null)
				return;

			var button = document.getElementById("togglePickPoint");
			if(currentTab < 0) {
				var viewer = document.getElementById("viewerContainer");
				if(pickingPoints) {
					button.innerHTML = "Stop picking";
					button.style.backgroundColor = "rgb(255, 120, 120)";
					currentPoint = 0;
					bimSurfer.startPickPoint({callback: imageManager.modelPointPicked});
					viewer.style.cursor = "crosshair";
				} else {
					button.innerHTML = "Pick points";
					button.style.backgroundColor = "";
					currentPoint = -1;
					bimSurfer.stopPickPoint();
					viewer.style.cursor = "default";
				}
			} else {
			    var canvas = image.tab.children[0];
				if(pickingPoints) {
					button.innerHTML = "Stop picking";
					button.style.backgroundColor = "rgb(255, 120, 120)";
					canvas.style.cursor = "crosshair";
				} else {
					button.innerHTML = "Pick points";
					button.style.backgroundColor = "";
					canvas.style.cursor = "default";
				}
			}
		};

		this.imageclicked = function(event) {
			if(pickingPoints) {
				var image = this.getCurrentImage();
			    var canvas = image.tab.children[0];

			    var rect = canvas.getBoundingClientRect();
			    var x = event.offsetX * image.image.width / rect.width;
			    var y = event.offsetY * image.image.height / rect.height;

			    image.imagePoints.push([x, y]);
			 	image.modelPoints.push([0, 0, 0]);

			 	this.updateImageManager();
			    this.drawPoints(image);
			 }
		};

		this.removePoint = function(pointID) {
			var image = this.getCurrentImage();

			image.imagePoints.splice(pointID, 1);
			image.modelPoints.splice(pointID, 1);
			this.updateImageManager();
		    this.drawPoints(image);
			this.updateModelSpheres();
		};

		this.updatePoint = function(pointID) {
			var suffixes = ['ix', 'iy', 'mx', 'my', 'mz'];
			var image = this.getCurrentImage();
			var i;
			for(i = 0; i < suffixes.length; i++) {
				var input = document.getElementById('point' + pointID + suffixes[i]);
				if(i < 2) {
					image.imagePoints[pointID][i] = Number(input.value);
				} else {
					image.modelPoints[pointID][i-2] = Number(input.value);
				}
			}
		    this.drawPoints(image);
		    this.updateModelSpheres();
		};

		this.drawPoints = function(image) {
			var canvas = image.tab.children[0];
			drawPointsCanvas(canvas, image);
			drawPointsCanvas(document.getElementById("imageThumbnail"), image);
		};

		this.drawPointsCanvas = function(canvas, image) {
		    var imagePoints = image.imagePoints;
		    var ctx = canvas.getContext("2d");
		    var rect = canvas.getBoundingClientRect();
		    ctx.clearRect(0, 0, canvas.width, canvas.height);

		    var crossSize = image.image.width / 100;

		    ctx.font = 3*crossSize + "px Arial";
		    ctx.strokeStyle = "rgb(255, 255, 255)";
		    ctx.fillStyle = "rgb(255, 255, 255)";

		    ctx.beginPath();
		    var i;
		    for(i = 0; i < imagePoints.length; i++) {
		    	var x = imagePoints[i][0] * canvas.width / image.image.width;
		    	var y = imagePoints[i][1] * canvas.height / image.image.height;

		    	ctx.moveTo(x - crossSize, y);
		    	ctx.lineTo(x + crossSize, y);
		    	ctx.moveTo(x, y - crossSize);
		    	ctx.lineTo(x, y + crossSize);
		    	var offX = x < 9*crossSize ? crossSize : -3*crossSize;
		    	var offY = y < 9*crossSize ? 3*crossSize : -crossSize;
		    	ctx.fillText(i, x + offX, y + offY);
		    }
		    ctx.stroke();
		};

		this.modelPointPicked = function(modelPoint) {
			// using imageManager instead of this as it is used as a callback
			var modelPoints = imageManager.getCurrentImage().modelPoints;
			modelPoints[currentPoint] = [modelPoint[0], modelPoint[1], modelPoint[2]]; // avoid referencing
			currentPoint++;
			if(currentPoint == modelPoints.length) {
				imageManager.togglePickPoint();
			}
			imageManager.updateModelSpheres();
			imageManager.updateImageManager();
		}

		this.updateModelSpheres = function() {
			var modelPoints = imageManager.getCurrentImage().modelPoints;
			var i;
			for(i = 0; i < modelSpheres.length; i++) {
				modelSpheres[i].destroy();
			}
			modelSpheres.length = 0;

			for(i = 0; i < modelPoints.length; i++) {
				modelSpheres[i] = bimSurfer.createMarkedPoint({center: [modelPoints[i][0], modelPoints[i][1], modelPoints[i][2]], size: 1, mark: i});
			}
		}

		this.insertImage = function() {
			var image = this.getCurrentImage();

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var response = JSON.parse(this.responseText);

					document.getElementById("waitingHomography").style.display = "none";
					if(response.success) {
						if(image in planes) {
							planes[image].destroy();
						}
						planes[image] = bimSurfer.createPlane({size: [image.image.width, image.image.height], center: response.tvec, rotAxis: response.raxis, rotAngle: response.rangle, scale: response.scale});
						bimSurfer.setTexture({object: planes[image], texture: image.url});
					}
					else {
						document.getElementById("homographyFailure").style.display = "inherit";
					}
				}
			};

			var camera = bimSurfer.getCamera();
			var ratio = image.image.width / image.image.height;
			xhttp.open("POST", "/match_points", true);
			xhttp.setRequestHeader("Content-Type", "application/json");
			var data = JSON.stringify({imagePoints: image.imagePoints, modelPoints: image.modelPoints, cameraIntrinsics: [[camera.fovy * ratio, 0, 0], [0, camera.fovy, 0], [0, 0, 1]]});
			xhttp.send(data);
			document.getElementById("waitingHomography").style.display = "inherit";
			document.getElementById("homographyFailure").style.display = "none";
		};
	};

	return ImageManager();
});