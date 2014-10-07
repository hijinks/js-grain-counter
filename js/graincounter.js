function getImagePosition(event, panZoom, boxW, boxH, realDims){
    
    offsetX = event.offsetX; // Cursor position relative to SVG box
    offsetY = event.offsetY; //
 	
    currPaperPosition = panZoom.getCurrentPosition();
    currPaperZoom = panZoom.getCurrentZoom();
	
	decimalScaleFactor = (1 - currPaperZoom * 0.1);
	
	offsetXScaled = offsetX*decimalScaleFactor;
	offsetYScaled = offsetY*decimalScaleFactor;

	xCoord = Math.floor((currPaperPosition.x*1)+offsetXScaled);
	yCoord = Math.floor((currPaperPosition.y*1)+offsetYScaled);
	
	return [xCoord,yCoord]
}

var grainData = {};
var grainDraw = false;
var zoomAndPan = true;
var grainEdit = false;
var drawROI = false;
var roiBBox = false;
var rectDraw = false;
var currentPath = [];
var grains = new Array();
(function($){

   var GrainCounter = function(element)
   {
       var elem = $(element);
       var obj = this;
       
       this.filePath = false;
       this.drawPath = false;
       this.gPath = false;
       this.imageData = false;
	   this.currentGrain = false;
	   
       // Public method
       this.generateTools = function(imageData)
       {
       		var self = this;
			$(elem).html('<div class="row"><div class="col-md-7"><h2>Image</h2><div class="btn-group canvasTools"><button type="button" id="zoomAndPan" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-zoom-in"></span> View</button><button type="button" id="drawROI" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-edit"></span> Set ROI</button><button type="button" id="grainDrawer" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-pencil"></span> Grains</button><button type="button" id="grainEdit" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-info-sign"></span> Select</button></div><div id="gCanvas"></div><div id="mapControls"><a id="up" href="javascript:;"></a><a id="down" href="javascript:;"></a></div><div id="logInfo"><input placeholder="Name" class="form-control" id="log_name"><input placeholder="Pixels per mm" class="form-control" id="resolution"></div></div><div class="col-md-4"><h2>Info</h2><div id="imageData"><ul></ul></div><h2>Grain Projection</h2><div id="gProjection"></div><div id="grainControls" class="btn-group"><button type="button" class="btn btn-default" id="deleteGrain">Delete Grain</button></div><h2>Meta</h2><textarea class="form-control gMeta" rows="3"></textarea></div></div><div class="row"><div class="col-md-12"><div class="btn-group"><button type="button" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-star-empty"></span> New</button><button type="button" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-floppy-open"></span> Load</button><button id="save" type="button" class="btn btn-default btn-lg"><span class="glyphicon glyphicon-floppy-save"></span> Save</button></div></div><div class="progress progress-striped active"><div class="progress-bar" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 45%"><span class="sr-only">45% Complete</span></div></div>');
           	           	
           	container = $("#gCanvas");
      			
			//$('#imageData ul').append('<li><strong>Name: </strong>'+ defaultImgPath.split('/').reverse()[0] + '</li>');
			
			$('#grainControls').hide();
			
			dImg = new Image();
			dImg.src = imageData;
			dImg.onload = function(){
				dw = dImg.width;
				dh = dImg.height;			
			
				$('#imageData ul').append('<li><strong>Width: </strong>'+ dw + 'px</li>');
				$('#imageData ul').append('<li><strong>Height: </strong>'+ dh + 'px</li>');
				
				sf = dw/500;
				nheight = dh/sf;
			
			    var paper = Raphael('gCanvas', container.width(), nheight);
			    var projection = Raphael('gProjection', 300, 300);
			    var panZoom = paper.panzoom({ initialZoom: 6, initialPosition: { x: 120, y: 70} });
				var isHandling = false;
				
				var grainImage = paper.image(imageData,0,0,500,nheight);
				var gRect = paper.rect(0,0,500,nheight);
				var isHandling = false;
				
				$('#gProjection').grainprojection();
				self.gProjection = $('#gProjection').data('grainprojection');
				self.gProjection.setupProjection(projection, self);
				
			    panZoom.enable();
			    paper.safari();

	           	$('#zoomAndPan').click(function(){
	           		 panZoom.enable();
	           		 grainDraw = false;
	           		 zoomAndPan = true;
	           		 grainEdit = false;
	           		 drawROI = false;
	           		$('#gCanvas').css( 'cursor', 'default' );
	           	});
	
	           	$('#grainDrawer').click(function(event){
	           		 panZoom.disable();
	           		$('#gCanvas').css( 'cursor', 'crosshair' );
	           		 grainDraw = true;
	           		 zoomAndPan = false;
	           		 grainEdit = false;
	           		 drawROI = false;
	           	});

	           	$('#grainEdit').click(function(event){
	           		 panZoom.disable();
	           		$('#gCanvas').css( 'cursor', 'default' );
	           		 grainDraw = false;
	           		 zoomAndPan = false;
	           		 grainEdit = true;
	           		 drawROI = false;
	           	});

	           	$('#drawROI').click(function(event){
	           		 panZoom.disable();
	           		$('#gCanvas').css( 'cursor', 'crosshair' );
	           		 grainDraw = false;
	           		 zoomAndPan = false;
	           		 grainEdit = false;
	           		 drawROI = true;
	           	});
	           		           		           	
			    var attributes = {
			        fill: '#F1F1F1',
			        stroke: '#FFFFFF',
			        'stroke-width': 2,
			        'stroke-linejoin': 'round'
			    };
			
			    var arr = [];
			
			    var overlay = paper.rect(0, 0, dw, dh);
			    
			    overlay.attr({ fill: '#ffffff', 'fill-opacity': 0, "stroke-width": 0, stroke: '#ffffff' });
				
				$('#gCanvas').mouseup(function(){
					if(grainDraw){
					  	if(self.gDragger !== undefined){
					  		self.gDragger.remove();
					  		polygonCoords = new Array();
					    	for(i=0;i<currentPath.length;i++){
					    		pr = 'M';
					    		if(i) pr = 'L';
					    		st = pr+' '+currentPath[i][0]+','+currentPath[i][1]
					    		polygonCoords.push(st);
					    	}
					    	
					    	polygonCoords.pop();
					    	polygonCoords.join(' ');
					    	polygonCoords = polygonCoords+'z';
					    	self.gPath.attr("path", polygonCoords);
					    	self.gPath.attr({ fill: 'red', 'fill-opacity': 0.5});
					  		
					  		self.gPath.click(function(event){
					  			if(grainEdit){
					  				/* console.log(this.attrs.path); */
					  				bbox = this.getBBox(true);
					  				self.currentGrain = this.id;
					  				self.gProjection.createProjection(this.attr('path'), bbox)
					  			}
					  		});
					  		self.gPath.mouseover(function(event){
					  			if(grainEdit){
					  				this.attr({stroke: '#ffffff'});
					  				$('#gCanvas').css( 'cursor', 'pointer' );
					  			}
					  		});
					  		self.gPath.mouseout(function(event){
					  			this.attr({stroke: '#000000'});
					  			$('#gCanvas').css( 'cursor', 'default' );
					  		});
					  		self.gPath = false;
					  		
					  		currentPath = [];
					  		delete self.gDragger;
					  		paper.safari();
					  	}
					 }
				});

			   	overlay.mousemove(function(event){
			   		if(grainDraw){
			   			if(self.gDragger !== undefined){
						    coords = getImagePosition(event, panZoom,container.width(), nheight);
						    self.gDragger.attr({
						    	cx: coords[0],
						    	cy: coords[1]
						    });
					    	currentPath = jQuery.unique(currentPath);
					    	currentPath.push([coords[0],coords[1]]);
					    	polygonCoords = new Array();
					    	
					    	for(i=0;i<currentPath.length;i++){
					    		pr = 'M';
					    		if(i) pr = 'L';
					    		st = pr+' '+currentPath[i][0]+','+currentPath[i][1]
					    		polygonCoords.push(st);
					    	}
					    	polygonCoords.pop();
					    	polygonCoords.join(' ');
					    	self.gPath.attr("path", polygonCoords); 
					    	grains.push(self.gPath.id);
						}
					} else if(drawROI){
					 	if(rectDraw){
					 		coords = getImagePosition(event, panZoom,container.width(), nheight);
					 		shadowBbox = self.shadowRect.getBBox();
					 		self.shadowRect.remove();
					 		self.shadowRect = paper.rect(shadowBbox.x, shadowBbox.y, Math.abs((coords[0] - shadowBbox.x)), Math.abs(coords[1] - shadowBbox.y));
							self.shadowRect.attr({
								'stroke-opacity':'0.5',
								'stroke-width':2,
								'stroke':'#33FF00'
							});			 		
					 	}						
					}
			   	});
						   								    
	           	overlay.mousedown(function(event) {
	           		if(grainDraw){
					    coords = getImagePosition(event, panZoom,container.width(), nheight);
					    if(self.gDragger == undefined){
						    self.gDragger = paper.circle(coords[0], coords[1], 2);
						    self.gDragger.attr({
						    	fill: 'red',
						    	stroke: '#33FF00',
						    	'stroke-width':2
						    });
						    self.gDragger.toFront();
					    	pr = 'M';
					    	st = pr+' '+coords[0]+','+coords[1]
					    	currentPath.push([coords[0],coords[1]]);
					    	self.gPath = paper.path(st);
						    paper.safari();
						}
					 } else if(drawROI){
					 	if(rectDraw){ // Second click
					 		coords = getImagePosition(event, panZoom,container.width(), nheight);
				 			shadowBbox = self.shadowRect.getBBox();
				 			self.shadowRect.remove();
				 			sWidth = coords[0]-shadowBbox.x;
				 			sHeight = coords[1]-shadowBbox.y;
				 			self.roiRect = paper.rect(shadowBbox.x, shadowBbox.y, sWidth, sHeight);
				 			roiBBox = self.roiRect.getBBox();
				 			
							self.roiRect.attr({
								'stroke-width':2,
								'stroke':'#33FF00'
							});	
							rectDraw = false;
							
					 	} else { // First click
					 		coords = getImagePosition(event, panZoom,container.width(), nheight);
					 		if(self.roiRect !== undefined) self.roiRect.remove();
					 		
					 		roiBBox = false;
					 		self.shadowRect = paper.rect(coords[0], coords[1], 1, 1);
							self.shadowRect.attr({
								'stroke-opacity':'0.2',
								'stroke-width':2,
								'stroke':'green'
							});
							rectDraw = true;					 		
					 	}
					 }

				});
									
							
			    $("#mapControls #up").click(function (e) {
			        panZoom.zoomIn(1);
			        e.preventDefault();
			    });
			
			    $("#mapControls #down").click(function (e) {
			        panZoom.zoomOut(1);
			        e.preventDefault();
			    });
			    
			    $("#moveTopLeft").click(function (e) {
			        panZoom.pan(1,1);
			    });
			    
				function animateOver() {
			        if (this.data("hoverFill")) {
			            this.attr("fill", this.data("hoverFill"));
			        }
			    }
			
			    function animateOut() {
			        if (this.data("fill")) {
			            this.attr("fill", this.data("fill"));
			        }
			    }
			    
			    function handleDetails() {
			        if (panZoom.isDragging() || isHandling) return;
			        isHandling = true;
			        var anim, box = this.getBBox();
			
			        if (inDetails) {
			            inDetails = false;
			            panZoom.enable();
			            this.hover(animateOver, animateOut);
			            anim = overlay.animate({ 'fill-opacity': 0 }, 300, function () { this.toBack(); isHandling = false; });
			            this.animateWith(overlay, anim, {
			                transform: ""
			            }, 300);
			            this.attr("fill", this.data("fill"));
			        } else {
			            inDetails = true;
			            panZoom.disable();
			            this.unhover(animateOver, animateOut);
			            overlay.toFront();
			            this.toFront();
			
			            var currPaperPosition = panZoom.getCurrentPosition();
			            var currPaperZoom = panZoom.getCurrentZoom();
			
			            var currHeight = paper.height * (1 - currPaperZoom * 0.1);
			
			            var zoomDif = (currHeight / 2) / box.height;
			
			            var xdif = currPaperPosition.x - box.x + ((box.width * zoomDif) - box.width) / 2;
			            var ydif = (currPaperPosition.y + ((currHeight / 2) - (box.height / 2))) - box.y;
			
			
			            anim = overlay.animate({ 'fill-opacity': 0.7 }, 300, function () { isHandling = false; });
			            this.animateWith(overlay, anim, {
			                transform: "t" + xdif + "," + ydif + "s" + zoomDif
			            }, 300);
			        }
			    }
			    
			    $('#save').click(function(){
			    	toCsv = new Array();
			    	alert('yo');
					_.each(grains, function(grain){
						gData = paper.getById(grain);
						self.gProjection.clearProjection();
						gd = self.gProjection.createProjection(gData, gData.getBBox(true));
						toCsv.push(gd);
					});
					console.log(toCsv);
			    });
			    
			    $('#deleteGrain').click(function(){
			    	if(self.currentGrain){
				    	paper.getById(self.currentGrain).remove();
				    	delete grains[grains.indexOf(self.currentGrain)];
				    	self.gProjection.clearProjection();
				    }
			    });
			}
       };
       
       this.saveData = function(){
       	// Collect Grains
       		
       }
   };
   
   $.fn.graincounter = function()
   {
       return this.each(function()
       {
           var element = $(this);
           // Return early if this element already has a plugin instance
           if (element.data('graincounter')) return;

           var graincounter = new GrainCounter(this);

           // Store plugin object in this element's data
           
           element.data('graincounter', graincounter);
           
       });
   };

})(jQuery);

(function($){

   var GrainProjection = function(element)
   {
       var elem = $(element);
       var obj = this;
 		             
       // Public method
       this.setupProjection = function(svgCanvas, parent)
       {
	       	var self = this;
	       	$('#grainControls').show();
	       	self.svgCanvas = svgCanvas;
	       	self.parent = parent;
		}
		
		this.clearProjection = function(){
			var self = this;
       		self.grainPath.remove();
       		self.lineChart.remove();
       		self.longAxis.remove();
       		self.intAxis.remove();
       		self.midAxis.remove();
       		self.parent.currentGrain = false;
		}
		
		this.createProjection =  function(pathData, bbBoxData)
		{
/*
			if(!roiBBox){
				alert('Please set an ROI');
				return false;
			}
*/
			
			var self = this;
			
	       	if(self.grainPath !== undefined){
	       		self.clearProjection();
	       	}

			coordinates = []
			self.grainPath = self.svgCanvas.path(pathData);
	
			if(bbBoxData.width>bbBoxData.height){
				scaleFactor = 100/bbBoxData.width;
			} else {
				scaleFactor = 100/bbBoxData.height;
			}
			
			self.grainPath.transform('t-'+bbBoxData.x+',-'+bbBoxData.y);
			midHeight = (100-(bbBoxData.height/2));
			self.grainPath.translate(150-(bbBoxData.width/2),midHeight);
			self.grainPath.scale(scaleFactor,scaleFactor);
			self.midAxis = self.svgCanvas.path("M0 100,L300 100");
			self.midAxis.hide();
			self.midAxis.attr({
				'stroke-opacity':'0.2',
				'stroke-width':2
			});
						
			angles = [];
			widths = [];
			
			angle = 10;
			total = 0;
			firstRun = true;
			
			while(total < 360){
				total = total + angle;
				self.grainPath.rotate(angle);
				rPath = Raphael.transformPath(self.grainPath.attr('path'), self.grainPath.attr('transform'));
				isects = Raphael.pathIntersection(rPath, "M0 100,L300 100");
				last = _.last(isects);
				first = _.first(isects);
				
				try{
/*
					c1.remove();
					c2.remove();
*/
					t.remove();
					a.remove();
					dPath.remove();
				} catch(e){}
				
/*
				c1 = self.svgCanvas.circle(last.x, last.y, 5);
				c2 = self.svgCanvas.circle(first.x, first.y, 5);
*/
				diff = last.x-first.x;
/*
				self.t = self.svgCanvas.text(230, 150, Math.floor(diff));
				self.a = self.svgCanvas.text(230, 180, total);
*/
				
				angles.push(total);
				widths.push(Math.abs(diff));
				coords.push([{
					x:first.x,
					y:first.y
				},{
					x:last.x,
					y:last.y				
				}]);
			}
			
			max = _.max(widths);
			min = _.min(widths);
			min_angle = 360-(angles[widths.indexOf(min)]);
			max_angle = 360-(angles[widths.indexOf(max)]);
			intersectMax = angles[widths.indexOf(max)];
			intersectMin = angles[widths.indexOf(min)];
			
			diff_max = (Math.abs(max)/2);
			diff_min = (Math.abs(min)/2);
				
			self.longAxis = self.svgCanvas.path("M"+(150-diff_max)+" 100,L"+(150+diff_max)+" 100");
			self.longAxis.transform("R"+(max_angle));
			self.intAxis = self.svgCanvas.path("M"+(150-diff_min)+" 100,L"+(150+diff_min)+" 100");
			self.intAxis.transform("R"+(min_angle));
			
			self.longAxis.attr({
				'stroke':'green'
			});
			self.intAxis.attr({
				'stroke':'red'
			});
		
	       	self.lineChart = self.svgCanvas.linechart(20, 180, 250, 100, angles, widths, {
				axis:'0 0 1 1'
			});
			
			// Correct for ROI
			
			// Get displacement using Pythagoras
			
			// Intermediate Axis
			intDisp = Math.sqrt(Math.pow(((intersectMin[0]).x - (intersectMin[1]).x),2) + Math.pow(((intersectMin[0]).y - (intersectMin[1]).y),2));
				
			// Long Axis
			longDisp = Math.sqrt(Math.pow(((intersectMax[0]).x - (intersectMax[1]).x),2) + Math.pow(((intersectMax[0]).y - (intersectMax[1]).y),2));			
			
			return {
				boundingBox: {
					x1:bbox.x,
					x2:bbox.y,
					y1:bbox.x2,
					y2:bbox.y2
				},
				intermediate: {
					d:intDisp,
					a:min_angle
				},
				long: {
					d:longDisp,
					a:max_angle
				}
			}
       }
    }
 $.fn.grainprojection = function()
   {
       return this.each(function()
       {
           var element = $(this);
           // Return early if this element already has a plugin instance
           if (element.data('grainprojection')) return;

           var grainprojection = new GrainProjection(this);

           // Store plugin object in this element's data
           
           element.data('grainprojection', grainprojection);
           
       });
   };
})(jQuery);