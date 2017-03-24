// image manager class

function ImageManager() {
	// {id : {name, source, image, tablink, tab, selectoroption, imagePoints, modelPoints, plane}}
	var imageDictionary = {};
	// {name : id}
	var imageIDs = {};
	var pickingPoints = false;
	var lastID = 0;

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
	    button.className += " tablinks";
	    button.onclick = function() { imageManager.opentab(imgID); };
	    button.innerHTML = imgName;
	    tabselector.appendChild(button);

	 	imageDictionary[imgID] = {name: imgName, source: null, image: null, tablink: button, tab: tabcontent, selectoroption: option, imagePoints: [], modelPoints: []};
		imageIDs[imgName] = imgID;
	 	this.opentab(imgID);
	};

	this.getCurrentImageID = function() {
		var imageID = document.getElementById("imageselector").value;
		return imageID;
	}

	this.getCurrentImageName = function() {
		var imageID = document.getElementById("imageselector").value;
		return imageDictionary[imageID].name;
	}

	this.getCurrentImage = function() {
		var imageID = document.getElementById("imageselector").value;
		return imageDictionary[imageID];
	}

	this.deleteImage = function() {
		var image = this.getCurrentImage();

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
		delete imageIDs[imageDictionary[id].name];
		imageIDs[newName] = id;
		imageDictionary[id].name = newName;
		imageDictionary[id].tablink.innerHTML = newName;
		imageDictionary[id].selectoroption.text = newName;

		this.updateImageManager();
	};

	this.updateImageManager = function() {
		var selectedimagename = this.getCurrentImageName();
		if(selectedimagename != null) {
			var selectedimage = imageDictionary[imageIDs[selectedimagename]];

			document.getElementById("imageProperties").style.visibility = "visible";
			document.getElementById("imageRenamer").value = selectedimagename;
			document.getElementById("imageBrowser").value = ''; // setting a value is insecure operation

			if(selectedimage.image === null) {
				document.getElementById("togglePickPoint").style.visibility = "hidden";
			} else {
				document.getElementById("togglePickPoint").style.visibility = "visible";
			}
			var table = document.getElementById("pointtable");
			var i, tableHTML = "";
			for(i = 0; i < selectedimage.imagePoints.length; i++)
				tableHTML += this.createPointTable(i, selectedimage.imagePoints[i], selectedimage.modelPoints[i]);

			table.innerHTML = tableHTML;
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
			imageManager.renameImage(imageID, selectedimage.source);

			var tab = selectedimage.tab;				
			var canvas = tab.children[0];
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
	    };
	};

	this.createPointTable = function(pointID, imagePoint, modelPoint) {
		return 	"<tr><td class='imagenumber' rowspan='2' onclick='imageManager.removePoint(" + pointID + ")'>" + pointID + "</td><td>image</td>" +
					"<td><label for='point" + pointID + "ix'>x </label><input id='point" + pointID + "ix' type='number' value='" + imagePoint[0] + "' step='0.01' /></td>" + 
					"<td><label for='point" + pointID + "iy'>y </label><input id='point" + pointID + "iy' type='number' value='" + imagePoint[1] + "' step='0.01' /></td>" +
					"<td></td>" +
				"</tr><tr><td>model</td>" +
					"<td><label for='point" + pointID + "mx'>x </label><input id='point" + pointID + "mx' type='number' value='" + modelPoint[0] + "' step='0.01' /></td>" +
					"<td><label for='point" + pointID + "my'>y </label><input id='point" + pointID + "my' type='number' value='" + modelPoint[1] + "' step='0.01' /></td>" +
					"<td><label for='point" + pointID + "mz'>z </label><input id='point" + pointID + "mz' type='number' value='" + modelPoint[2] + "' step='0.01' /></td>" +
				"</tr><tr class='separator'><td></td><td></td><td></td><td></td><td></td></tr>";
	};

	this.opentab = function(imageID) {
	    var i, tabcontent, tablinks;

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
	    if(imageID >= 0) {
	    	document.getElementById("imageselector").value = imageID;
	    	this.updateImageManager();
		}

		if(pickingPoints)
			this.togglePickPoint();
	};

	this.togglePickPoint = function() {
		pickingPoints = !pickingPoints;
		var image = this.getCurrentImage();
	    var canvas = image.tab.children[0];

		if(pickingPoints) {
			document.getElementById("togglePickPoint").innerHTML = "Stop picking";
			canvas.style.cursor = "crosshair";
		} else {
			document.getElementById("togglePickPoint").innerHTML = "Pick points";
			canvas.style.cursor = "default";
		}
	};

	this.imageclicked = function(event) {
		if(pickingPoints) {
			var image = this.getCurrentImage();
		    var canvas = image.tab.children[0];
		    var rect = canvas.getBoundingClientRect();
		    var x = Math.floor(event.offsetX * image.image.width / rect.width);
		    var y = Math.floor(event.offsetY * image.image.height / rect.height);

		    image.imagePoints.push([x, y]);
		 	image.modelPoints.push([0, 0, 0]);
		 	this.updateImageManager();
		 }
	};

	this.removePoint = function(pointID) {
		var image = this.getCurrentImage();
		image.imagePoints.splice(pointID, 1);
		image.modelPoints.splice(pointID, 1);
		this.updateImageManager();
	}
};