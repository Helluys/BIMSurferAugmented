var address = QueryString.address;
var token = QueryString.token;
var imageManager = null;

// Loads a model from BIMServer, builds an explorer tree UI.
// Clicking on a tree node fits the view to its scene object.
loadScripts(address + "/apps/bimserverjavascriptapi/js/", [
     "bimserverclient.js",
     "model.js",
     "bimserverapiwebsocket.js",
     "bimserverapipromise.js",
     "geometry.js",
     "ifc2x3tc1.js",
     "ifc4.js",
     "translations_en.js",
], function(){
    require(["bimsurfer/src/BimSurfer","bimsurfer/src/StaticTreeRenderer","bimsurfer/src/MetaDataRenderer","bimsurfer/lib/domReady!","js/ImageManager"],
        function (BimSurfer, StaticTreeRenderer, MetaDataRenderer) {

			imageManager = new ImageManager();
            
            var bimSurfer = new BimSurfer({
                domNode: "viewerContainer"
            });
            
            bimSurfer.on("loading-finished", function(){
            	document.getElementById("status").innerHTML = "Loading finished";
                var domNode = document.getElementById("typeSelector");
                domNode.innerHTML = "";
                bimSurfer.getTypes().forEach(function(ifc_type) {
                    var on = ifc_type.visible;
                    var d = document.createElement("div");
                    var t = document.createTextNode(ifc_type.name);
                    var setClass = function() {
                        d.className = "fa fa-eye " + ["inactive", "active"][on*1];
                    };
                    setClass();
                    d.appendChild(t);
                    domNode.appendChild(d);
                    d.onclick = function() {
                        on = !on;
                        setClass();
                        bimSurfer.setVisibility({types:[ifc_type.name], visible:on});
                    };
                });
            });
            bimSurfer.on("loading-started", function(){
            	document.getElementById("status").innerHTML = "Loading...";
            });
            
            // Lets us play with the Surfer in the console
            window.bimSurfer = bimSurfer;

            // Load a model from BIMServer
            bimSurfer.load({
                bimserver: address,
                token: token,
                poid: QueryString.poid,
                roid: QueryString.roid,
                schema: "ifc2x3tc1" // < TODO: Deduce automatically
            }).then(function (model) {
                model.getTree().then(function (tree) {
                
                    // Build a tree view of the elements in the model. The fact that it
                    // is 'static' refers to the fact that all branches are loaded and
                    // rendered immediately.
                    var domtree = new StaticTreeRenderer({
                        domNode: 'treeContainer'
                    });
                    domtree.addModel({name: "", id:QueryString.roid, tree:tree});
                    domtree.build();
                    
                    bimSurfer.on("selection-changed", function(selected) {
                        domtree.setSelected(selected, domtree.SELECT_EXCLUSIVE);
                    });
                    
                    domtree.on("click", function (oid, selected) {
                        // Clicking an explorer node fits the view to its object and selects
                        if (selected.length) {
                            bimSurfer.viewFit({
                                ids: selected,
                                animate: true
                            });
                        }
                        bimSurfer.setSelection({
                            ids:selected,
                            clear:true,
                            selected:true
                        });
                    });
                });
            });
        });
	});
