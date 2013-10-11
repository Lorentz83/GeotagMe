
var GeotaggedPicsToMap = {
    dialogTitle : 'There are 0 pictures on the map',
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
    
    var binaryDownload = function(url, callback) {
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

    var readExif = function(url, callback) {
	binaryDownload(url, function(data){
            var exif = new ExifReader();
            exif.load(data);
            var tags = exif.getAllTags();
            callback(tags);
	});
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
    

    var PicsToMap = function() {
	var This = this;
	var points = [];
	var mapDialog;
	var mapHolder;
	var map;
	var progressBar;
	this._waitingForPoints = null;

	var addImageClickListener = function(marker, src) {
	    var img = new ImageFrame(src);
	    google.maps.event.addListener(marker, 'click', img.open);
	}
	
	var loadGoogleMaps = function() {
	    progressBar.hide();
	    mapDialog.dialog('option', 'title', GeotaggedPicsToMap.dialogTitle.replace('0', points.length));
	    if ( points.length == 0 ) {
		mapDialog.text(GeotaggedPicsToMap.sorry);
		return;
	    }
	    
            map = new google.maps.Map(mapHolder.get(0), {
		center: new google.maps.LatLng(points[0].GPSLatitude, points[0].GPSLongitude ),
		zoom: 7,
		mapTypeId: google.maps.MapTypeId.ROADMAP
            });
	    
	    var bounds = new google.maps.LatLngBounds ();	
	    for (var n = 0 ; n < points.length ; n++){
		var marker = new google.maps.Marker({
		    position: new google.maps.LatLng(points[n].GPSLatitude, points[n].GPSLongitude),
		    map: map,
		    icon: {
		    	url : points[n].thumbnail,
		    	scaledSize : new google.maps.Size(45,45)
		    }
		});
		console.log(points[n])
		bounds.extend(marker.position);
		addImageClickListener(marker, points[n].img);
	    }
	    map.fitBounds(bounds);
	}

	var prepareData = function(img, finish, progress){
	    if ( This._waitingForPoints !== null)
		return;
	    This._waitingForPoints = new Barrier(img.length, finish, progress);
	    img.each(
		function(index, imgUrl) { 
		    readExif(this.image, This._waitingForPoints.createCallback(function(tags) {
			if(tags !== null && tags['GPSLongitude'] && tags['GPSLatitude']){
			    var point = {
				GPSLongitude : tags['GPSLongitude'].description,
				GPSLatitude : tags['GPSLatitude'].description,
				img : imgUrl.image,
				thumbnail :  imgUrl.thumbnail
			    };
			    points.push(point);
			}
		    }));
		}
	    );
	}

	var openMap = function(){
	    var img = $('a[href$=".jpg"]:has(img)').map(function(idx) {
		return {
		    image : this.href,
		    thumbnail : $(this).find('img').attr('src')
		}
	    });
	    
	    progressBar.progressbar( { max: img.length, disabled: true } );
	    mapDialog.dialog('open');
	    prepareData(img, 
			loadGoogleMaps, 
			function(curr, max){ progressBar.progressbar('option', 'disabled', false); progressBar.progressbar('value', curr); } 
		       );
	    return false;
	}


	//ctor
	mapDialog = $('<div class="picstomap"></div>');
	progressBar = $('<div class="picstomapPB" style="left: 2em; position: absolute; right: 2em; top: 2em;"/>');
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
	
	$('.geotagged_pics_open_map').click(openMap)
    }
    
    new PicsToMap()
    
})
