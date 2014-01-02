
var GeotaggedPicsToMap = {
    dialogTitle : 'There are 0 pictures on the map',
    dialogTitleProgress : 'Analyzing 0 pictures...',
    dialogLoading: 'Loading the pictures...',
    ajaxLoader : '/wp-content/plugins/geotagged-pics-to-map/img/ajax-loader.gif',
    sorry : 'Sorry, no pictures found :(' 
};


jQuery(document).ready(function( $ ) {

    var Barrier = function(triggerAfter, finishFunction, progressFunction){
	var This = this;
	this._callbackFunctionsNum = triggerAfter;
	this._completeFunctionsNum = 0;
	this._finishFunction = finishFunction;
	this._progressFunction = progressFunction;
	
	this.createCallback = function (callback){
	    return function(){
		var args = Array.prototype.slice.call(arguments);
		callback.apply(this, args.splice(0, 1));
		
		++This._completeFunctionsNum;
		if ( This._progressFunction ) {
		    This._progressFunction(This._completeFunctionsNum, This._callbackFunctionsNum);
		}
		if ( This._completeFunctionsNum == This._callbackFunctionsNum ) {
		    This._finishFunction();
		}
	    }
	}
    }
    
    var ImageFrame = function(src) {
	var This = this;
	this.src = src;
	this.container = null;
	this.image = null;
	
	this.open = function() {
	    if (This.container === null)
		This._initAndOpen()
	    else
		This.container.dialog("open");
	}
	this.close = function() {
	    if (This.container !== null)
		This.container.dialog("close");
	}

	this._initAndOpen = function() {
	    This.container = $('<div style="overflow:hidden; background:url('+GeotaggedPicsToMap.ajaxLoader+') no-repeat center" class="picstomapImage"></div>')
	    This.image = $('<img style="visibility: hidden" alt=""/>');
	    This.image.attr('src', src);
	    This.image.css('max-width', $(window).width()-30 );
	    This.image.css('max-height', $(window).height()-30 );
	    This.container.append(This.image);
	    This.container.dialog({
		resizable : false,
		draggable : false,
		modal : true,
		position: 'center',
		height : 70,
		width : '70px',
		dialogClass : "no-title",
		open : function() {	
		    jQuery('.ui-widget-overlay').click( This.close );
		}
	    });
	    This.container.click( This.close );
	    jQuery(window).scroll(function() {
		This.container.dialog('option','position','center');
	    });
	    jQuery(window).resize(function() {
		This.image.css('max-width', $(window).width()-30 );
		This.image.css('max-height', $(window).height()-30 );
		This.container.dialog('option','position','center');
	    });
	    This.image.on('load', function(){
		This.image.css('visibility', 'visible');
		This.container.dialog( 'option', 'width', 'auto' );
		This.container.dialog( 'option', 'height', 'auto' );
	    })
	}
	
	return this;
    }
    
    var Marker = function(latitude, longitude, image, thumbnail) {
	var This = this;
	
	this.GPSLongitude = longitude;
	this.GPSLatitude = latitude; 
	this.img = image;
	this.thumbnail = thumbnail;

	this._imgFrame = new ImageFrame(this.img);
	
	this.openWindow = function() {
	    This._imgFrame.open();
	}
    }

    var MapWindow = function() {
	var mapDialog;
	var mapHolder;
	var progressBar;

	this.readyToLoadMap = function(numPics) {
	    progressBar.hide();
	    mapDialog.dialog('option', 'title', GeotaggedPicsToMap.dialogTitle.replace('0', numPics));
	    return mapHolder.get(0);
	}
	
	this.open = function() {
	    mapDialog.dialog('open');
	}
	
	this.close = function() {
	    mapDialog.dialog('close');
	}
	
	this.progress = function(curr, max) {
	    progressBar.progressbar('option', 'disabled', false); 
	    progressBar.progressbar('option', 'max', max);
	    progressBar.progressbar('value', curr);
	    mapDialog.dialog('option', 'title', GeotaggedPicsToMap.dialogTitleProgress.replace('0', curr));
	}
	
	this.failToLoad = function() {
	    mapDialog.dialog('option', 'title', GeotaggedPicsToMap.sorry);
	    mapDialog.text(GeotaggedPicsToMap.sorry);
	}

	//ctor
	mapDialog = $('<div class="picstomap"></div>');
	progressBar = $('<div class="picstomapPB" style="left: 2em; position: absolute; right: 2em; top: 2em;"/>');
	progressBar.progressbar( { disabled: true } );

	mapHolder = $('<div class="picstomapMH" style="height: 100%; width: 100%;"/>');
	mapDialog.append(mapHolder);
	mapDialog.append(progressBar);
	mapDialog.dialog({ 
	    modal: true ,
	    draggable: false,
	    resizable: false,
	    autoOpen: false,
	    position: 'center',
	    title: GeotaggedPicsToMap.dialogLoading,
	    width: $(window).width() * 0.8,
	    height: $(window).height() * 0.8
	});
	
	$(window).resize(function() {
	    mapDialog.dialog("option", "width", $(window).width() * 0.8);
	    mapDialog.dialog("option", "height", $(window).height() * 0.8);
	});
	jQuery(window).scroll(function() {
	    mapDialog.dialog('option','position','center');    
	});
    }
    
    var PicsAnalyzer = function() {
	var This = this;
	this._waitingForPoints = null;
	this.markers = [];
	
	this.binaryDownload = function(url, callback) {
	    var req = new XMLHttpRequest();
	    req.open("GET", url, true);
	    req.responseType = "arraybuffer";
	    req.onload = function (event) {
		callback(req.response);
	    };
	    req.onerror = function () {
		callback(null);
	    }
	    req.send(null);
	}
	
	this.readExif = function(url, callback) {
	    This.binaryDownload(url, function(data){
		var tags = null;
		try {
		    var exif = new ExifReader();
		    exif.load(data);
		    tags = exif.getAllTags();
		}
		catch(e) { /* no exif*/ }
		callback(tags);
	    });
	}
	
	this.bind = function() {
	    $(this).bind.apply($(this), arguments);
	}
	
	
	this.loadImages = function(){
	    var img = $('a[href$=".jpg"]:has(img)').map(function(idx) {
		return {
		    image : this.href,
		    thumbnail : $(this).find('img').attr('src')
		}
	    });

	    This._waitingForPoints = new Barrier(img.length,
						 function() { $(This).trigger('finish', [This.markers] ); } ,
						 function(curr, max) { $(This).trigger('progress', [curr, max] ); } );

	    img.each(
		function(index, imgUrl) { 
		    This.readExif(this.image, This._waitingForPoints.createCallback(function(tags) {
			if(tags !== null && 
			   !isNaN(tags['GPSLongitude'].description) && tags['GPSLongitudeRef'].description !== null &&
			   !isNaN(tags['GPSLatitude'].description) && tags['GPSLatitudeRef'].description !== null
			  ){
			    console.log(tags['GPSLatitudeRef'])
			    var latitude = tags['GPSLatitudeRef'].description.indexOf('N') === -1 ? -1 : 1;
			    latitude *= tags['GPSLatitude'].description;
			    var longitude = tags['GPSLongitudeRef'].description.indexOf('E') === -1 ? -1 : 1;
			    longitude *= tags['GPSLongitude'].description;
			    var point = new Marker(latitude, longitude, imgUrl.image, imgUrl.thumbnail);
			    This.markers.push(point);
			}
			else {
			    console.log('No exif for ' + imgUrl.image);
			}
		    }));
		}
	    );
	}
    }
    
    var GoogleMaps = function() {
	var map;
	var oms;
	
	this.loadMap = function(mapHolderDiv, markers) {
            map = new google.maps.Map(mapHolderDiv, {
		center: new google.maps.LatLng(markers[0].GPSLatitude, markers[0].GPSLongitude ),
		zoom: 7,
		mapTypeId: google.maps.MapTypeId.ROADMAP
            });
	    oms = new OverlappingMarkerSpiderfier(map, {markersWontMove: true, markersWontHide: true, nearbyDistance: 30} );
	    oms.addListener('click', function(marker, event) {
		marker.openWindow();
	    });
	    
	    var bounds = new google.maps.LatLngBounds ();	
	    for (var n = 0 ; n < markers.length ; n++){
		var marker = new google.maps.Marker({
		    position: new google.maps.LatLng(markers[n].GPSLatitude, markers[n].GPSLongitude),
		    map: map,
		    icon: {
		    	url : markers[n].thumbnail,
		    	scaledSize : new google.maps.Size(45,45)
		    },
		    openWindow: markers[n].openWindow
		});
		bounds.extend(marker.position);
		oms.addMarker(marker);
	    }
	    map.fitBounds(bounds);
	}
    }
    
    var PicsToMap = function(mapProvider) {
	var This = this;
	this.mapProvider = mapProvider;
	this.picsAnalyzer = new PicsAnalyzer();
	this.mapWindow = new MapWindow();
	this.loaded = false;

	this.markersReady = function(event, markers) {
	    console.log(markers);
	    if (markers.length == 0) {
		This.mapWindow.failToLoad();
		return;
	    }
	    var container = This.mapWindow.readyToLoadMap(markers.length);
	    This.mapProvider.loadMap(container, markers);
	}
	
	this.openMap = function() {
	    This.mapWindow.open();
	    if ( !This.loaded ) {
		This.loaded = true;
		This.picsAnalyzer.loadImages();
	    }
	    return false;
	}
	
	//ctor
	this.picsAnalyzer.bind('finish', this.markersReady)
	this.picsAnalyzer.bind('progress', function(event, curr, max){ This.mapWindow.progress(curr,max); })
    }
    

    var picsToMap = new PicsToMap( new GoogleMaps() );

    $('.geotagged_pics_open_map').click(picsToMap.openMap);

})
