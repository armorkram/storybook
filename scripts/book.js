var pageWidth = 400;
var pageHeight = 400;
var showFpsCounter = false;

var cornerPt = { x:pageWidth, y:pageHeight };
var centerPt = { x:0, y:0 }; // mouse/touch pointer
var lowerLeftPt = { x:0, y:0 }; // will be computed
var upperRightPt = { x:0, y:0 }; // will be computed
var midPt = new Point( pageWidth, 0 );
var topPt = new Point( 0, 0 ); 
var basePt = new Point( 0, pageHeight );
var canvasSize = new Point( 1000, 800 );
var offset = new Point( 0, 0 );
var bgOffset;
var targetPt = new Point( cornerPt.x, cornerPt.y );
var mousePt = new Point( cornerPt.x, cornerPt.y );

var collisionPoint1;
var collisionPoint2;
var collisionPoint3;
var collisionPoint4;

var renderAngle;

var onePageDeltaScale = 1;
var onePageDeltaSkew = .6;


var COVER_STATES = { COVERED:"covered", SNAPPED:"snapped", RELEASED_LEFT:"releasedLeft", RELEASED_RIGHT:"releasedRight", OPENED:"opened", SEEKING:"seeking" };
var PAGE_STATES = { SNAPPED:"snapped", RELEASED_LEFT:"releasedLeft", RELEASED_RIGHT:"releasedRight", IDLE_LEFT:"idleLeft", IDLE_RIGHT:"idleRight", SEEKING:"seeking" };
var ALIGN = { LEFT:"left", RIGHT:"right", CENTER:"center" };

var frontCoverState = COVER_STATES.COVERED;
var backCoverState = COVER_STATES.OPENED;
var pageState = PAGE_STATES.IDLE_RIGHT;

var initialImageIndex = 3;
var finalImageIndex = 10;
var currentImageIndex = 1;
var selectedWord = "";

var currentDate;
var diff = 0;
var fpsDiff = 0;
var fps = 24; // previously @ 60
var mspf = 1000 / fps;
var numUpdates = 0;

var images = [];
var imageSrcs = [];
var frontCoverImage = null;
var innerFrontCoverImage = null;
var backCoverImage = null;
var innerBackCoverImage = null;

var autoPlayGlobalSoundInstance;
var playGlobalSoundInstance;

var singleWordHitbox = [];
var audioDictionary = [];

var isPlaying = false;
var isAutoPlaying = false;

var pages;

var img1, img2, img3, img4;

var bgImage;

var numImagesToLoad = 0;
var numImagesLoaded = 0;

var leftButton, rightButton, playButton, autoButton, fullscreenButton;

var leftButtonBounds = {};
var rightButtonBounds = {};
var playButtonBounds = {};
var autoButtonBounds = {};
var fullscreenButtonBounds = {};
    
var c;
var ctx;
var fpsCounter;

var pBookID;
var pProductID;

var pXMLPath;
var pImagesPath;
var pCoversPath;
var pPageImagesPath;
var pWordsAudioPath;
var pPageAudioPath;
var tempCanvas;
var tempContext;

var pLang;

var pages;
var numPages = 0;

var defaults = {};
defaults.txt = {};
defaults.font = {};

/*----------------------------------------LOADING----------------------------------------*/
function updateBookDimension ( width, height ) {
	pageWidth = width;
	pageHeight = height;

	cornerPt.x = pageWidth;
	cornerPt.y = pageHeight;

	midPt.x = pageWidth;
	basePt.y = pageHeight;

	targetPt.x = pageWidth;
	targetPt.y = pageHeight;

	offset.x = c.width * .5 - pageWidth;
	offset.y = ( c.height - pageHeight ) * .5;
}

function loadBook ( bookID, productID, xmlPath, imagesPath, coversPath, pageImagesPath, wordsAudioPath, pageAudioPath, lang, pfps, callback ) {
	if ( window.XMLHttpRequest ) {
		pBookID = bookID;
		pProductID = productID;
		
		// set fps
		if ( pfps ) {
			fps = pfps;
			mspf = 1000 / fps;
		}

		pXMLPath = xmlPath;
		pImagesPath = imagesPath;
		pCoversPath = coversPath;
		pPageImagesPath = pageImagesPath;
		pWordsAudioPath = wordsAudioPath;
		pPageAudioPath = pageAudioPath;

		pLang = lang;

		// load xml
		var xmlUrl = pXMLPath + bookID + ".xml";

		var request = new XMLHttpRequest();
		request.open( "GET", xmlUrl, true );

		request.onload = function ( event ) {
			if ( window.DOMParser ) {
			  parser = new DOMParser();

			  xmlDoc = parser.parseFromString( event.target.response, "text/xml" );
			} else {// Internet Explorer
			  xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			  xmlDoc.async = false;
			  xmlDoc.loadXML( event.target.response ); 
			}

			// images
			pages = xmlDoc.getElementsByTagName( "page" );
			numPages = pages.length;
			console.log( "Num pages: " + numPages );

			// add front cover and inner front cover
			imageSrcs.push( pCoversPath + "front.jpg" );
			imageSrcs.push( pCoversPath + "inside_front.jpg" );

			// add back cover and inner back cover
			imageSrcs.push( pCoversPath + "back.jpg" );
			imageSrcs.push( pCoversPath + "inside_back.jpg" );


			for ( var a = 1, pageNum = pages.length; a <= pageNum; a++ ) {
				imageSrcs.push( pPageImagesPath + a + ".jpg" );
			}

			numImagesToLoad = imageSrcs.length;
			finalImageIndex = imageSrcs.length - 4;

			// dimension
			var dimension = xmlDoc.getElementsByTagName( "pgsize" );
			updateBookDimension( parseInt( dimension[0].attributes[0].value ), parseInt( dimension[0].attributes[1].value ) );

			if ( callback ) {
				callback();
			}
		}

		request.send();
	}	
}

function loadStep1 ( bookID, productID, xmlPath, imagesPath, coversPath, pageImagesPath, wordsAudioPath, pageAudioPath, lang, fps ) {
	c = document.getElementById( "myCanvas" );
    ctx = c.getContext( "2d" );

	loadBook( bookID, productID, xmlPath, imagesPath, coversPath, pageImagesPath, wordsAudioPath, pageAudioPath, lang, fps, loadStep2 );
}

function loadStep2 () {
	c.addEventListener('touchmove', function(event) {
	  event.preventDefault();
	}, false); 


	// add buttons and bg to load list
	numImagesToLoad += 6;
    
	for ( var a = 0; a < imageSrcs.length; a++ ) {
		images.push( new Image() );

		if ( a < 4 ) {
			if ( 
				imageSrcs[a] == pCoversPath + "front.jpg" 
				|| imageSrcs[a] == pCoversPath + "back.jpg" 
			) {
				images[a].onload = coverImageLoadHandler;
			} else {
				images[a].onload = imageLoadHandler;
			}
		} else {
			images[a].onload = pageImageLoadHandler;
			images[a].index = a - 4;
		}
		
		images[a].crossOrigin = "anonymous";
		images[a].src = imageSrcs[a];
	}

	leftButton = new Image();
	rightButton = new Image();
	playButton = new Image();
	autoButton = new Image();
	fullscreenButton = new Image();

	bgImage = new Image();

	leftButton.crossOrigin = "anonymous";
	rightButton.crossOrigin = "anonymous";
	playButton.crossOrigin = "anonymous";
	autoButton.crossOrigin = "anonymous";
	fullscreenButton.crossOrigin = "anonymous";
	bgImage.crossOrigin = "anonymous";

	leftButton.onload = imageLoadHandler;
	rightButton.onload = imageLoadHandler;
	playButton.onload = imageLoadHandler;
	autoButton.onload = imageLoadHandler;
	fullscreenButton.onload = imageLoadHandler;
	bgImage.onload = imageLoadHandler;

	leftButton.src = pImagesPath + "left.png";
	rightButton.src = pImagesPath + "right.png";
	playButton.src = pImagesPath + "play.png";
	autoButton.src = pImagesPath + "auto.png";
	fullscreenButton.src = pImagesPath + "fullscreen.png";

	bgImage.src = pImagesPath + "bg.jpg";

    fpsCounter = document.getElementById( "fpsCounter" );

    // get defaults
    var defaultsXML = xmlDoc.getElementsByTagName( "defaults" );
    var defaultsTxt = defaultsXML[0].getElementsByTagName( "txt" );

    defaults.txt.x = defaultsTxt[0].attributes['x'].value;
    defaults.txt.y = defaultsTxt[0].attributes['y'].value;
    defaults.txt.align = defaultsTxt[0].attributes['align'].value;
    defaults.txt.width = defaultsTxt[0].attributes['width'].value;

    var defaultsFont = defaultsXML[0].getElementsByTagName( 'font' );
    defaults.font.face = defaultsFont[0].attributes['face'].value;
    defaults.font.color = defaultsFont[0].attributes['color'].value;
    defaults.font.size = defaultsFont[0].attributes['size'].value;

	// add page audio to load list
	numImagesToLoad += Math.floor( ( numPages + 2 ) / 2 );
    preloadSound();
}

function preloadSound () {
	// listen for page audio completion and errors
	createjs.Sound.addEventListener("fileload", soundLoadHandler);
	createjs.Sound.addEventListener("fileerror", soundErrorHandler);

	var numPageAudioToLoad = Math.floor( ( numPages + 2 ) / 2 );
	for ( var a = 1; a <= numPageAudioToLoad; a++ ) {
		createjs.Sound.registerSound( pPageAudioPath + a + ".mp3", a );
	}
}

function soundErrorHandler ( event ) {
	imageLoadHandler();
}

function soundLoadHandler ( event ) {
	imageLoadHandler();
}


function setImages ( index ) {
	currentImageIndex = index;

	img1 = images[currentImageIndex];
	img2 = images[currentImageIndex + 1];
	img3 = images[currentImageIndex + 2];
	img4 = images[currentImageIndex + 3];
}

function coverImageLoadHandler () {
	this.onload = null;

    if ( !tempCanvas ) {
    	tempCanvas = document.createElement( 'canvas' );
    	tempCanvas.width = this.width;
    	tempCanvas.height = this.height;

    	tempContext = tempCanvas.getContext( '2d' );
    } else if ( 
    	tempCanvas.width != this.width
    	|| tempCanvas.height != this.height
    ) {
		tempCanvas.width = this.width;
    	tempCanvas.height = this.height;
    }

    tempContext.clearRect( 0, 0, this.width, this.height );
    tempContext.drawImage( this, 0, 0 );


	if ( this.src == pCoversPath + "front.jpg" ) {
		var cover = "front"
		var covertype = "frontcover";
	} else {
		var cover = "back"
		var covertype = "backcover";
	}

	var txt = xmlDoc.getElementsByTagName( cover );
	if ( txt.length > 0 ) { 
		var lang = txt[0].getElementsByTagName( pLang );

		if ( lang.length > 0 ) {
			drawPageText( tempContext, lang[0].getElementsByTagName( 'txt' ), covertype, covertype );

            this.crossOrigin = null;
			this.src = tempCanvas.toDataURL();
		}
	}

	imageLoadHandler();
}

function pageImageLoadHandler () {
    // alter image
    this.onload = null;

    if ( !tempCanvas ) {
    	tempCanvas = document.createElement( 'canvas' );
    	tempCanvas.width = this.width;
    	tempCanvas.height = this.height;

    	tempContext = tempCanvas.getContext( '2d' );
    } else if ( 
    	tempCanvas.width != this.width
    	|| tempCanvas.height != this.height
    ) {
		tempCanvas.width = this.width;
    	tempCanvas.height = this.height;
    }

    tempContext.clearRect( 0, 0, this.width, this.height );
    tempContext.drawImage( this, 0, 0 );
	
	if ( pages[this.index] ) {
	    var texts = pages[this.index].getElementsByTagName( pLang );
		if ( texts.length > 0 ) drawPageText( tempContext, texts[0].getElementsByTagName( "txt" ), 1, this.index );

		this.crossOrigin = null;
	    this.src = tempCanvas.toDataURL();
	}

	imageLoadHandler();
}

function imageLoadHandler () {
	numImagesLoaded++;

	// update preloader
	drawPreloader();

	if ( numImagesLoaded >= numImagesToLoad ) {
		// remove audio listener
		createjs.Sound.removeEventListener("fileload", soundLoadHandler);
		createjs.Sound.removeEventListener("fileerror", soundErrorHandler);

		for ( var a = 0, imagesLen = images.length; a < imagesLen; a++ ) {
			images[a].onload = null;
		}

		leftButton.onload = null;
		rightButton.onload = null;
		playButton.onload = null;
		autoButton.onload = null;
		fullscreenButton.onload = null;
		bgImage.onload = null;

		// destroy temp canvas and context
		tempContext = null;
		tempCanvas = null;

		init();
	}
}





/*----------------------------------------RENDERING----------------------------------------*/
function drawBG () {
	if ( !bgOffset && bgImage && bgImage.complete ) {
		bgOffset = new Point( offset.x + pageWidth - bgImage.width * .5, offset.y + ( pageHeight - bgImage.height ) * .5 );

		canvasSize.x = c.width;
		canvasSize.y = c.height;
	}
	
	if ( bgOffset ) {
		ctx.drawImage( bgImage, bgOffset.x, bgOffset.y );
	}
}

function drawPreloader () {
	ctx.fillStyle = "#FFFFFF";
	ctx.clearRect( 0, 0, canvasSize.x, canvasSize.y );

	drawBG();

	ctx.fillStyle = "#777777";
	ctx.fillRect( offset.x + pageWidth * 0.5, offset.y + pageHeight * .5, pageWidth, pageHeight * .05 );

	ctx.fillStyle = "#000000";
	ctx.fillRect( offset.x + pageWidth * 0.5, offset.y + pageHeight * .5, pageWidth * numImagesLoaded / numImagesToLoad, pageHeight * .05 );
}

function init () {
	// add listener for single word audio load
	createjs.Sound.addEventListener("fileload", playOnLoad);

	frontCoverImage = images[0];
	innerFrontCoverImage = images[1];

	backCoverImage = images[2];
	innerBackCoverImage = images[3];

	setImages( initialImageIndex );

	var buttonSpacer = 20;

	offset.y = ( c.height - pageHeight - rightButton.height - buttonSpacer ) * .5;

	// anchor point
	rightButtonBounds.x = pageWidth - rightButton.width * .5;
	rightButtonBounds.y = pageHeight + buttonSpacer;
	rightButtonBounds.width = rightButton.width;
	rightButtonBounds.height = rightButton.height;

	leftButtonBounds.x = rightButtonBounds.x - leftButton.width;
	leftButtonBounds.y = rightButtonBounds.y;
	leftButtonBounds.width = leftButton.width;
	leftButtonBounds.height = leftButton.height;

	playButtonBounds.x = leftButtonBounds.x - playButton.width;
	playButtonBounds.y = rightButtonBounds.y;
	playButtonBounds.width = playButton.width;
	playButtonBounds.height = playButton.height;


	autoButtonBounds.x = rightButtonBounds.x + rightButton.width;
	autoButtonBounds.y = rightButtonBounds.y;
	autoButtonBounds.width = autoButton.width;
	autoButtonBounds.height = autoButton.height;

	fullscreenButtonBounds.x = autoButtonBounds.x + autoButtonBounds.width;
	fullscreenButtonBounds.y = rightButtonBounds.y;
	fullscreenButtonBounds.width = fullscreenButton.width;
	fullscreenButtonBounds.height = fullscreenButton.height;

    c.onmousemove = mouseMoveHandler;
    c.onmousedown = mouseDownHandler;
    c.onmouseup = mouseUpHandler;

	c.addEventListener( 'touchmove', touchMoveHandler, false );
	c.addEventListener( 'touchstart', touchStartHandler, false );
	c.addEventListener( 'touchend', touchEndHandler, false );

    update();
	
	setTimeout( consistentTick, mspf );
}

function compute () {
	var realCenterPtX = centerPt.x;
	var realCenterPtY = centerPt.y;


	if ( frontCoverState == COVER_STATES.COVERED ) {
		centerPt.x = cornerPt.x;
		centerPt.y = cornerPt.y;
	} else if ( backCoverState == COVER_STATES.COVERED ) {
		centerPt.x = -cornerPt.x;
		centerPt.y = cornerPt.y;
	} else if ( 
		frontCoverState == COVER_STATES.SEEKING 
		|| frontCoverState == COVER_STATES.SNAPPED 
		|| frontCoverState == COVER_STATES.OPENED
		|| frontCoverState == COVER_STATES.RELEASED_LEFT
		|| frontCoverState == COVER_STATES.RELEASED_RIGHT
		|| backCoverState == COVER_STATES.SEEKING 
		|| backCoverState == COVER_STATES.SNAPPED 
		|| backCoverState == COVER_STATES.OPENED
		|| backCoverState == COVER_STATES.RELEASED_LEFT
		|| backCoverState == COVER_STATES.RELEASED_RIGHT
	) {
		if ( pageState == PAGE_STATES.IDLE_LEFT ) {
			centerPt.x = -cornerPt.x;
			centerPt.y = cornerPt.y;
		} else if ( pageState == PAGE_STATES.IDLE_RIGHT ) {
			centerPt.x = cornerPt.x;
			centerPt.y = cornerPt.y;
		}
	}

	// hack
	if ( centerPt.y == cornerPt.y ) {
		collisionPoint4 = new Point( ( centerPt.x != -pageWidth ) ? Math.abs( -pageWidth - centerPt.x ) / 2 : 0, 0 );
		collisionPoint1 = new Point( collisionPoint4.x, pageHeight );
		collisionPoint3 = new Point( centerPt.x, 0 );
		renderAngle = 0;

		if ( 
			frontCoverState == COVER_STATES.COVERED 
			|| frontCoverState == COVER_STATES.SEEKING 
			|| frontCoverState == COVER_STATES.SNAPPED 
			|| frontCoverState == COVER_STATES.RELEASED_LEFT
			|| frontCoverState == COVER_STATES.RELEASED_RIGHT
			|| backCoverState == COVER_STATES.COVERED 
			|| backCoverState == COVER_STATES.SEEKING 
			|| backCoverState == COVER_STATES.SNAPPED 
			|| backCoverState == COVER_STATES.RELEASED_LEFT
			|| backCoverState == COVER_STATES.RELEASED_RIGHT
		) {
			centerPt.x = realCenterPtX;
			centerPt.y = realCenterPtY;
		}

		return;
	}

	// get angle of rotation formed by the 2 points
	var angle = Math.atan( ( cornerPt.y - centerPt.y ) / ( cornerPt.x - centerPt.x ) ) / Math.PI * 180;
	
	// increase angle based on x position
	angle *= 2;
	
	// adjust image rotation and position
	renderAngle = angle;
	
	// get difference with the 90 def angle
	var angularDifference = 90 - angle;
	
	// get collisions with the baselines
    if ( centerPt.y < pageHeight ) {
		collisionPoint1 = new Point( pageWidth, centerPt.y - Math.tan( angularDifference / 180 * Math.PI ) * ( pageWidth - centerPt.x ) );
		collisionPoint2 = new Point( centerPt.x + ( ( pageHeight - centerPt.y ) / Math.tan( angle / 180 * Math.PI ) ), pageHeight );
	} else {
		collisionPoint1 = new Point( centerPt.x + ( ( pageHeight - centerPt.y ) / Math.tan( angle / 180 * Math.PI ) ), pageHeight );
		distancePt1CollisionPt1 = computeDistance( collisionPoint1, centerPt );
		
		// get angle of rotation formed by pt1 and collisionPoint1
		angle = Math.atan( ( collisionPoint1.y - centerPt.y ) / ( collisionPoint1.x - centerPt.x ) ) / Math.PI * 180;
		
		if ( angle < 0 ) {
			angularDifference = -angle;
		} else {
			angle = angle - 180;
			angularDifference = -angle;
		}
		memAngle = -angle;

		// collision with y axis
		collisionPoint2 = new Point( collisionPoint1.x - ( distancePt1CollisionPt1 / Math.cos( angularDifference / 180 * Math.PI ) ), pageHeight );
		distancePt1CollisionPt2 = computeDistance( collisionPoint2, centerPt );

		// actual endpoint of page height
		if ( angle <= -90 ) {
			collisionPoint3 = collisionPoint2.interpolate( collisionPoint2, centerPt, -pageHeight / distancePt1CollisionPt2  );
		} else {
			collisionPoint3 = collisionPoint2.interpolate( collisionPoint2, centerPt, pageHeight / distancePt1CollisionPt2  );
		}

		collisionPoint4 = new Point( pageWidth - ( collisionPoint3.y / Math.sin( memAngle / 180 * Math.PI ) ), 0 );
	}
    
    // GET EDGE POINTS
    // get bottom left pt
    lowerLeftPt.x = collisionPoint2.x;
    lowerLeftPt.y = cornerPt.y;
    
    // get upper right pt
    upperRightPt.x = cornerPt.x;
    upperRightPt.y = collisionPoint1.y;


    if ( 
    	pageState == PAGE_STATES.IDLE_LEFT 
    	|| pageState == PAGE_STATES.IDLE_RIGHT 
    ) {
    	centerPt.x = realCenterPtX;
    	centerPt.y = realCenterPtY;
	}

}

var strDict = [];
function drawTextInner ( ctx, useIndex, x, y, str, fontSize, font, color, align, maxWidth ) {
	ctx.font = fontSize + "px " + font;
	ctx.fillStyle = color;

	var offsetWidth = 0;
	var textWidth = 0;
	var spaceWidth = 0;
	var offsetHeight = 0;
	var lineWidth;
	var totalWidth = 0;
	var textX = 0;
	var textY = 0;

	var isBold = false;
	var isItalic = false;
	var renderString = "";

	var breakMatches = [ "<b>", "</b>", "<i>", "</i>", "<br />", "<u>", "</u>", " " ];

	// split
	if ( !strDict[useIndex] ) {
		// replace tabs
		str = str.replace( /<tab>/gi, '    ' );

		// parse string, create html array
		var splitStr = str.split( /<br>|<br \/>|<br\/>/ );
		
		strDict[useIndex] = [];

		for ( var a = 0, len = splitStr.length; a < len; a++ ) {
			// break for each element in breakMatches array
			var tempArray = [ splitStr[a] ];

			// check if needle exists and split
			for ( var b = 0, len2 = breakMatches.length; b < len2; b++ ) {
				for ( var c = 0, len3 = tempArray.length; c < len3; c++ ) {
					var splitMatch = tempArray[c].split( breakMatches[b] );
					if ( splitMatch.length > 1 ) {
						// remove previous
						tempArray.splice( c, 1 );

						// insert elements directly to main array
						for ( var d = splitMatch.length - 1; d >= 0; d-- ) {
							// insert split string
							tempArray.splice( c, 0, splitMatch[d] );

							// insert break match
							if ( d > 0 ) {
								tempArray.splice( c, 0, breakMatches[b] );
							}
						}

						len3 += splitMatch.length * 2 - 2; // -2 because the 1st element is already counted in the main array
						c += splitMatch.length * 2 - 2;
					}
				}
			}

			// remove empty strings
			for ( var b = 0, len2 = tempArray.length; b < len2; b++ ) {
				if ( tempArray[b] == '' ) {
					tempArray.splice( b, 1 );
					b--;
					len2--;
				}
			}

			strDict[useIndex].push( tempArray );
		}
	}


	singleWordHitbox[useIndex] = [];

	// draw
	if ( align == ALIGN.LEFT ) {
		offsetHeight = parseInt( fontSize );

		for ( var a = 0, len = strDict[useIndex].length; a < len; a++ ) {
			offsetWidth = 20;

			var str = strDict[useIndex][a];
			for ( var b = 0; b < str.length; b++ ) {
				if ( str[b] == '<b>' ) {
					isBold = true;
					continue;
				} else if ( str[b] == '</b>' ) {
					isBold = false;
					continue;
				} else if ( str[b] == '<i>' ) {
					isItalic = true;
					continue;
				} else if ( str[b] == '</i>' ) {
					isItalic = false;
					continue;
				}

				// update font
				ctx.font = ( isBold ? "bold " : "" ) + ( isItalic ? "italic " : "" ) + fontSize + "px " + font;

				// replace all html tags
				renderString = str[b].replace( "<b>", "" ).replace( "</b>", "" ).replace( "<i>", "" ).replace( "</i>", "" );

				textWidth = ctx.measureText( renderString ).width;
				textX = parseInt( x ) + offsetWidth;
				textY = parseInt( y ) + offsetHeight + parseInt( fontSize ); // do not render offset.y, draw transform is already set 

				ctx.fillText( renderString, textX, textY );

				singleWordHitbox[useIndex].push( { x:textX, y:textY - parseInt( fontSize ), width:textWidth, height:parseInt( fontSize ), word:renderString } );

				offsetWidth += textWidth + spaceWidth;
			}

			offsetHeight += parseInt( fontSize ) * 1.5;
		}
	} else if ( align == ALIGN.CENTER ) {
		offsetHeight = 0;

		for ( var a = 0, len = strDict[useIndex].length; a < len; a++ ) {
			// get total width
			totalWidth = 0;

			var str = strDict[useIndex][a];
			for ( var b = str.length - 1; b >= 0; b-- ) {
				if ( str[b] == '<b>' ) {
					isBold = true;
					continue;
				} else if ( str[b] == '</b>' ) {
					isBold = false;
					continue;
				} else if ( str[b] == '<i>' ) {
					isItalic = true;
					continue;
				} else if ( str[b] == '</i>' ) {
					isItalic = false;
					continue;
				}

				// update font
				ctx.font = ( isBold ? "bold " : "" ) + ( isItalic ? "italic " : "" ) + fontSize + "px " + font;

				totalWidth += textWidth = ctx.measureText( str[b] ).width;
			}

			offsetWidth = ( pageWidth - totalWidth ) * .5;

			// render text
			for ( var b = 0; b < str.length; b++ ) {
				if ( str[b] == '<b>' ) {
					isBold = true;
					continue;
				} else if ( str[b] == '</b>' ) {
					isBold = false;
					continue;
				} else if ( str[b] == '<i>' ) {
					isItalic = true;
					continue;
				} else if ( str[b] == '</i>' ) {
					isItalic = false;
					continue;
				}

				// update font
				ctx.font = ( isBold ? "bold " : "" ) + ( isItalic ? "italic " : "" ) + fontSize + "px " + font;

				textWidth = ctx.measureText( strDict[useIndex][a][b] ).width;
				textX = parseInt( x ) + offsetWidth;
				textY = parseInt( y ) + offsetHeight + parseInt( fontSize ); // do not render offset.y, draw transform is already set 

				renderString = str[b].replace( "<b>", "" ).replace( "</b>", "" ).replace( "<i>", "" ).replace( "</i>", "" );
				ctx.fillText( renderString, textX, textY );

				singleWordHitbox[useIndex].push( { x:textX, y:textY - parseInt( fontSize ), width:textWidth, height:parseInt( fontSize ), word:renderString } );

				offsetWidth += textWidth + spaceWidth;
			}

			offsetHeight += parseInt( fontSize ) * 1.5;
		}
	} else if ( align == ALIGN.RIGHT ) {
		offsetHeight = 0;

		for ( var a = 0, len = strDict[useIndex].length; a < len; a++ ) {
			offsetWidth = 0;

			var str = strDict[useIndex][a];
			for ( var b = str.length - 1; b >= 0; b-- ) {
				if ( str[b] == '<b>' ) {
					isBold = true;
					continue;
				} else if ( str[b] == '</b>' ) {
					isBold = false;
					continue;
				} else if ( str[b] == '<i>' ) {
					isItalic = true;
					continue;
				} else if ( str[b] == '</i>' ) {
					isItalic = false;
					continue;
				}

				// update font
				ctx.font = ( isBold ? "bold " : "" ) + ( isItalic ? "italic " : "" ) + fontSize + "px " + font;

				textWidth = ctx.measureText( str[b] ).width;
				textX = pageWidth - textWidth + parseInt( x ) - offsetWidth;
				textY = parseInt( y ) + offsetHeight + parseInt( fontSize ); // do not render offset.y, draw transform is already set 

				renderString = str[b].replace( "<b>", "" ).replace( "</b>", "" ).replace( "<i>", "" ).replace( "</i>", "" );

				ctx.fillText( renderString, textX, textY );
				singleWordHitbox[useIndex].push( { x:textX, y:textY - parseInt( fontSize ), width:textWidth, height:parseInt( fontSize ), word:renderString } );

				offsetWidth += textWidth + spaceWidth;
			}

			offsetHeight += parseInt( fontSize ) * 1.5;
		}
	}
}

function drawPageText ( ctx, texts, renderIndex, useIndex ) {
	var xPageOffset = 0;
	var yPageOffset = 0;

	if ( renderIndex == 1 ) {
		xPageOffset = 0;
		yPageOffset = 0;
	} else if ( renderIndex == 2 ) {
		xPageOffset = pageWidth;
		yPageOffset = 15;
	} else if ( renderIndex == 3 ) {
		xPageOffset = -offset.x;
		yPageOffset = -pageHeight + 15 - offset.y;
	} else if ( renderIndex == 4 ) {
		xPageOffset = pageWidth;
		yPageOffset = 15;
	} else if ( renderIndex == "frontcover" ) {
		xPageOffset = 0;
		yPageOffset = 0;
	} else if ( renderIndex == "backcover" ) {
		xPageOffset = 0;
		yPageOffset = 15;
	}

	for ( var a = 0, len = texts.length; a < len; a++ ) {
		drawTextInner(
			ctx,  
			useIndex + '_' + a, 
			( !!texts[a].attributes["x"] ) ? parseInt( texts[a].attributes["x"].value ) + xPageOffset: 0 + xPageOffset,
			( !!texts[a].attributes["y"] ) ? parseInt( texts[a].attributes["y"].value ) + yPageOffset: 0 + yPageOffset,
			( !!texts[a].childNodes[0].nodeValue ) ? texts[a].childNodes[0].nodeValue : "", 
			( !!texts[a].attributes["size"] ) ? parseInt( texts[a].attributes["size"].value ) : parseInt( defaults.font.size ),
			( !!texts[a].attributes["fontFace"] ) ? texts[a].attributes["fontFace"].value : defaults.font.face,
			( !!texts[a].attributes["color"] ) ? texts[a].attributes["color"].value : defaults.font.color,
			( !!texts[a].attributes["align"] ) ? texts[a].attributes["align"].value : defaults.txt.align,
			( !!texts[a].attributes["width"] ) ? parseInt( texts[a].attributes["width"].value ): defaults.txt.width
		);
	}
}

var testIndex = 1;
var test = false;
function drawFirstPageText () {
	var useIndex;

	if ( !test ) {
		useIndex = currentImageIndex - 4;
	} else {
		useIndex = testIndex;
	}

	var texts = pages[useIndex].getElementsByTagName( pLang );
	if ( texts.length > 0 ) drawPageText( ctx, texts[0].getElementsByTagName( "txt" ), 1, useIndex );
}

function drawSecondPageText () {
	var useIndex;

	if ( !test ) {
		useIndex = currentImageIndex - 3;
	} else {
		useIndex = testIndex;
	}

	var texts = pages[useIndex].getElementsByTagName( pLang );
	if ( texts.length > 0 ) drawPageText( ctx, texts[0].getElementsByTagName( "txt" ), 2, useIndex );
}

function drawThirdPageText () {
	var useIndex;

	if ( !test ) {
		useIndex = currentImageIndex - 2;
	} else {
		useIndex = testIndex;
	}

	var texts = pages[useIndex].getElementsByTagName( pLang );
	if ( texts.length > 0 ) drawPageText( ctx, texts[0].getElementsByTagName( "txt" ), 3, useIndex );
}

function drawFourthPageText () {
	var useIndex;

	if ( !test ) {
		useIndex = currentImageIndex - 1;
	} else {
		useIndex = testIndex;
	}

	var texts = pages[useIndex].getElementsByTagName( pLang );
	if ( texts.length > 0 ) drawPageText( ctx, texts[0].getElementsByTagName( "txt" ), 4, useIndex );
}

function drawButtons () {
	if ( frontCoverState == COVER_STATES.COVERED || backCoverState == COVER_STATES.COVERED ) {
		if ( playButton.src != pImagesPath + "play_disabled.png" ) {
			playButton.src = pImagesPath + "play_disabled.png";
		}
		if ( autoButton.src != pImagesPath + "auto_disabled.png" ) {
			autoButton.src = pImagesPath + "auto_disabled.png";
		}
	} else {
		if ( playButton.src == pImagesPath + "play_disabled.png" ) {
			playButton.src = pImagesPath + "play.png";
		}
		if ( autoButton.src == pImagesPath + "auto_disabled.png" ) {
			autoButton.src = pImagesPath + "auto.png";
		}
	}

	ctx.drawImage( leftButton, offset.x + leftButtonBounds.x, offset.y + leftButtonBounds.y );
	ctx.drawImage( rightButton, offset.x + rightButtonBounds.x, offset.y + rightButtonBounds.y );
	ctx.drawImage( playButton, offset.x + playButtonBounds.x, offset.y + playButtonBounds.y );
	ctx.drawImage( autoButton, offset.x + autoButtonBounds.x, offset.y + autoButtonBounds.y );
	ctx.drawImage( fullscreenButton, offset.x + fullscreenButtonBounds.x, offset.y + fullscreenButtonBounds.y );
}


function render () {
    // RENDER
	ctx.fillStyle = "#CCCCCC";
	ctx.lineWidth = 2;

	ctx.clearRect( 0, 0, canvasSize.x, canvasSize.y );


	drawBG();

	ctx.save();
	
	ctx.strokeStyle = "#00FFFF";

	
	if ( 
		frontCoverState == COVER_STATES.OPENED 
		&& currentImageIndex == initialImageIndex
	) {
		xPercent = -1;
		var skew = ( 1 + xPercent ) * onePageDeltaSkew;
		var adjustment = pageWidth * skew;
		
		ctx.setTransform( -xPercent * onePageDeltaScale, skew, 0, 1, offset.x + innerFrontCoverImage.width * xPercent + innerFrontCoverImage.width - ( innerFrontCoverImage.width - pageWidth ), offset.y - ( innerFrontCoverImage.height - pageHeight ) / 2 - adjustment);
		ctx.drawImage( innerFrontCoverImage, 0, 0 );

		ctx.setTransform( 1, 0, 0, 1, 0, 0 );
	} else if ( 
		frontCoverState == COVER_STATES.OPENED 
		&& currentImageIndex > initialImageIndex 
	) {
		ctx.save();

		var coverTopY = offset.y - ( innerFrontCoverImage.height - pageHeight ) * .5;
		var coverLeft = offset.x - ( innerFrontCoverImage.width - pageWidth );

		ctx.strokeStyle = "#FF0000";

		ctx.beginPath();
		ctx.moveTo( offset.x + pageWidth, coverTopY );
		ctx.lineTo( coverLeft, coverTopY );
		ctx.lineTo( coverLeft, coverTopY + innerFrontCoverImage.height );
		ctx.lineTo( offset.x + pageWidth, coverTopY + innerFrontCoverImage.height );
		ctx.lineTo( offset.x + pageWidth, offset.y + pageHeight );
		ctx.lineTo( offset.x, offset.y + pageHeight );
		ctx.lineTo( offset.x, offset.y );
		ctx.lineTo( offset.x + pageWidth, offset.y );
		ctx.closePath();
		
		ctx.clip();

		xPercent = -1;
		var skew = ( 1 + xPercent ) * onePageDeltaSkew;
		var adjustment = pageWidth * skew;
		
		ctx.setTransform( -xPercent * onePageDeltaScale, skew, 0, 1, offset.x + innerFrontCoverImage.width * xPercent + innerFrontCoverImage.width - ( innerFrontCoverImage.width - pageWidth ), offset.y - ( innerFrontCoverImage.height - pageHeight ) / 2 - adjustment);
		ctx.drawImage( innerFrontCoverImage, 0, 0 );

		ctx.restore();
		ctx.save();
	}


	if ( 
		backCoverState == COVER_STATES.OPENED 
		&& currentImageIndex < finalImageIndex
	) {
		var coverTopY = offset.y - ( innerBackCoverImage.height - pageHeight ) * .5;

		ctx.strokeStyle = "#FF0000";

		ctx.beginPath();
		ctx.moveTo( offset.x + pageWidth + innerBackCoverImage.width, coverTopY );
		ctx.lineTo( offset.x + pageWidth, coverTopY );
		ctx.lineTo( offset.x + pageWidth, offset.y );
		ctx.lineTo( offset.x + pageWidth * 2, offset.y );
		ctx.lineTo( offset.x + pageWidth * 2, offset.y + pageHeight );
		ctx.lineTo( offset.x + pageWidth, offset.y + pageHeight );
		ctx.lineTo( offset.x + pageWidth, coverTopY + innerBackCoverImage.height );
		ctx.lineTo( offset.x + pageWidth + innerBackCoverImage.width, coverTopY + innerBackCoverImage.height );
		ctx.closePath();
		
		ctx.clip();


		xPercent = 1;

		var skew = ( 1 + xPercent ) * onePageDeltaSkew;
		var adjustment = pageWidth * skew;

		ctx.setTransform( 1, 0, 0, 1, pageWidth + offset.x, offset.y - ( innerBackCoverImage.height - pageHeight ) / 2 );
		ctx.drawImage( innerBackCoverImage, 0, 0 );

		ctx.setTransform( 1, 0, 0, 1, 0, 0 );

		ctx.restore();
		ctx.save();
	} else if (
		backCoverState == COVER_STATES.OPENED 
		&& currentImageIndex >= finalImageIndex
	) {
		ctx.setTransform( 1, 0, 0, 1, pageWidth + offset.x, offset.y - ( innerBackCoverImage.height - pageHeight ) / 2 );
		ctx.drawImage( innerBackCoverImage, 0, 0 );

		ctx.setTransform( 1, 0, 0, 1, 0, 0 );

		ctx.restore();
		ctx.save();
	}



	// FIRST PAGE
	if ( 
		frontCoverState == COVER_STATES.OPENED 
		&& currentImageIndex > initialImageIndex 
	) {
		// draw first page with clipping
		ctx.beginPath();
		ctx.moveTo( offset.x, offset.y );
		ctx.lineTo( pageWidth + offset.x, offset.y );
		ctx.lineTo( pageWidth + offset.x, pageHeight + offset.y );
		ctx.lineTo( offset.x, pageHeight + offset.y );
		ctx.closePath();

		ctx.clip();

		ctx.drawImage( img1, 0 + offset.x, 0 + offset.y );

		ctx.restore();
		ctx.save();
	}


	if ( pageState != PAGE_STATES.IDLE_LEFT ) {
		// SECOND PAGE
		ctx.strokeStyle = "#FF00FF";
		// draw second page with clipping
		ctx.beginPath();
		ctx.moveTo( pageWidth + offset.x, offset.y );
		ctx.lineTo( pageWidth * 2 + offset.x, offset.y );
		ctx.lineTo( pageWidth * 2 + offset.x, pageHeight + offset.y );
		ctx.lineTo( pageWidth + offset.x, pageHeight + offset.y );
		ctx.closePath();

		ctx.clip();

		ctx.drawImage( img2, midPt.x + offset.x, 0 + offset.y );

		ctx.restore();
		ctx.save();
	}


	if ( 
		(
			pageState == PAGE_STATES.SNAPPED
			|| pageState == PAGE_STATES.RELEASED_LEFT
			|| pageState == PAGE_STATES.RELEASED_RIGHT
			|| pageState == PAGE_STATES.SEEKING
		)
		&& frontCoverState == COVER_STATES.OPENED
		&& centerPt.y < pageHeight 
	) {

		if ( currentImageIndex <= finalImageIndex ) {
			// FOURTH PAGE
			ctx.strokeStyle = "#FFFF00";

			// draw fourth page with clipping
			ctx.beginPath();
			ctx.moveTo( midPt.x + cornerPt.x + offset.x, cornerPt.y + offset.y );
			ctx.lineTo( midPt.x + upperRightPt.x + offset.x, upperRightPt.y + offset.y );
			ctx.lineTo( midPt.x + lowerLeftPt.x + offset.x, lowerLeftPt.y + offset.y );
			ctx.closePath();
			
			ctx.clip();
			
			ctx.drawImage( img4, midPt.x + offset.x, 0 + offset.y );

			ctx.restore();
			ctx.save();
		} else {
			// erase 2nd page
			ctx.beginPath();
			ctx.moveTo( midPt.x + cornerPt.x + offset.x, cornerPt.y + offset.y );
			ctx.lineTo( midPt.x + upperRightPt.x + offset.x, upperRightPt.y + offset.y );
			ctx.lineTo( midPt.x + lowerLeftPt.x + offset.x, lowerLeftPt.y + offset.y );
			ctx.closePath();

			ctx.clip();

			ctx.clearRect( midPt.x + offset.x, 0 + offset.y, pageWidth, pageHeight );

			ctx.setTransform( 1, 0, 0, 1, pageWidth + offset.x, offset.y - ( innerBackCoverImage.height - pageHeight ) / 2 );
			ctx.drawImage( innerBackCoverImage, 0, 0 );

			ctx.restore();
			ctx.save();
		}
		

		// THIRD PAGE
		ctx.strokeStyle = "#FF0000";

		// draw third page with clipping
		ctx.beginPath();
		ctx.moveTo( midPt.x + centerPt.x + offset.x, centerPt.y + offset.y );
		ctx.lineTo( midPt.x + upperRightPt.x + offset.x, upperRightPt.y + offset.y );
		ctx.lineTo( midPt.x + lowerLeftPt.x + offset.x, lowerLeftPt.y + offset.y );
		ctx.closePath();
		
		ctx.clip();
		
		ctx.translate( midPt.x + centerPt.x + offset.x, centerPt.y + offset.y );
		ctx.rotate( degToRad( renderAngle ) );
		
		ctx.drawImage( img3, 0, -cornerPt.y );

		ctx.restore();
		ctx.save();
	} else if ( 
		(
			pageState == PAGE_STATES.SNAPPED
			|| pageState == PAGE_STATES.RELEASED_LEFT
			|| pageState == PAGE_STATES.RELEASED_RIGHT
			|| pageState == PAGE_STATES.IDLE_LEFT
			|| pageState == PAGE_STATES.IDLE_RIGHT
			|| pageState == PAGE_STATES.SEEKING
		)
		&& frontCoverState == COVER_STATES.OPENED
	) {
		if ( currentImageIndex <= finalImageIndex ) {
			// FOURTH PAGE
			ctx.strokeStyle = "#FFFF00";

			// draw fourth page with clipping
			ctx.beginPath();
			ctx.moveTo( midPt.x + collisionPoint4.x + offset.x, collisionPoint4.y + offset.y );
			ctx.lineTo( midPt.x + collisionPoint1.x + offset.x, collisionPoint1.y + offset.y );
			ctx.lineTo( midPt.x + cornerPt.x + offset.x, cornerPt.y + offset.y );
			ctx.lineTo( midPt.x + cornerPt.x + offset.x, 0 + offset.y );
			ctx.closePath();
			
			ctx.clip();
			
			ctx.drawImage( img4, midPt.x + offset.x, 0 + offset.y );

			ctx.restore();
			ctx.save();
		} else if ( backCoverState == COVER_STATES.OPENED ) {
			// erase 2nd page
			ctx.beginPath();
			ctx.moveTo( midPt.x + collisionPoint4.x + offset.x, collisionPoint4.y + offset.y );
			ctx.lineTo( midPt.x + collisionPoint1.x + offset.x, collisionPoint1.y + offset.y );
			ctx.lineTo( midPt.x + cornerPt.x + offset.x, cornerPt.y + offset.y );
			ctx.lineTo( midPt.x + cornerPt.x + offset.x, 0 + offset.y );
			ctx.closePath();

			ctx.clip();

			ctx.clearRect( midPt.x + offset.x, 0 + offset.y, pageWidth, pageHeight );

			ctx.setTransform( 1, 0, 0, 1, pageWidth + offset.x, offset.y - ( innerBackCoverImage.height - pageHeight ) / 2 );
			ctx.drawImage( innerBackCoverImage, 0, 0 );

			ctx.setTransform( 1, 0, 0, 1, 0, 0 );

			ctx.restore();
			ctx.save();
		}


		// THIRD PAGE
		ctx.strokeStyle = "#FFFF00";

		// draw third page with clipping
		ctx.beginPath();
		
		if ( pageState == PAGE_STATES.IDLE_LEFT ) {
			ctx.moveTo( midPt.x + collisionPoint3.x + offset.x, collisionPoint1.y + offset.y );
		} else {
			ctx.moveTo( midPt.x + centerPt.x + offset.x, centerPt.y + offset.y );	
		}
		
		ctx.lineTo( midPt.x + collisionPoint3.x + offset.x, collisionPoint3.y + offset.y );
		ctx.lineTo( midPt.x + collisionPoint4.x + offset.x, collisionPoint4.y + offset.y );
		ctx.lineTo( midPt.x + collisionPoint1.x + offset.x, collisionPoint1.y + offset.y );
		ctx.closePath();
		
		ctx.clip();
		
		if ( pageState == PAGE_STATES.IDLE_LEFT ) {
			ctx.translate( midPt.x + -cornerPt.x + offset.x, cornerPt.y + offset.y );
		} else {
			ctx.translate( midPt.x + centerPt.x + offset.x, centerPt.y + offset.y );
		}
		
		ctx.rotate( degToRad( renderAngle ) );

		ctx.drawImage( img3, 0, -cornerPt.y );

		ctx.restore();
		ctx.save();
	}
	

	// draw front cover
	var xPercent = centerPt.x / pageWidth;
	if ( frontCoverState == COVER_STATES.COVERED ) {
		ctx.setTransform( 1, 0, 0, 1, pageWidth + offset.x, offset.y - ( frontCoverImage.height - pageHeight ) / 2 );
		ctx.drawImage( frontCoverImage, 0, 0 );
	} else if ( 
		frontCoverState == COVER_STATES.RELEASED_RIGHT 
		|| ( frontCoverState == COVER_STATES.SNAPPED && centerPt.x > 0 ) 
		|| ( frontCoverState == COVER_STATES.SEEKING && centerPt.x > 0 ) 
	) {
		ctx.setTransform( 1 - ( 1 - xPercent ) * onePageDeltaScale, -( 1 - xPercent ) * onePageDeltaSkew, 0, 1, pageWidth + offset.x, offset.y - ( frontCoverImage.height - pageHeight ) / 2 );
		ctx.drawImage( frontCoverImage, 0, 0 );
	} else if ( 
		frontCoverState == COVER_STATES.RELEASED_LEFT 
		|| ( frontCoverState == COVER_STATES.SNAPPED && centerPt.x <= 0 ) 
		|| ( frontCoverState == COVER_STATES.SEEKING && centerPt.x <= 0 ) 
	) {
		var skew = ( 1 + xPercent ) * onePageDeltaSkew;
		var adjustment = innerFrontCoverImage.width * skew;
		
		ctx.setTransform( -xPercent * onePageDeltaScale, skew, 0, 1, offset.x + innerFrontCoverImage.width * xPercent + innerFrontCoverImage.width - ( innerFrontCoverImage.width - pageWidth ), offset.y - ( innerFrontCoverImage.height - pageHeight ) / 2 - adjustment);
		ctx.drawImage( innerFrontCoverImage, 0, 0 );
	}

	ctx.setTransform( 1, 0, 0, 1, 0, 0 );



	// draw back cover
	 if (
		backCoverState == COVER_STATES.RELEASED_RIGHT 
		|| ( backCoverState == COVER_STATES.SNAPPED && centerPt.x > 0 ) 
		|| ( backCoverState == COVER_STATES.SEEKING && centerPt.x > 0 ) 
	) {
		ctx.setTransform( 1 - ( 1 - xPercent ) * onePageDeltaScale, -( 1 - xPercent ) * onePageDeltaSkew, 0, 1, pageWidth + offset.x, offset.y - ( innerBackCoverImage.height - pageHeight ) / 2 );
		ctx.drawImage( innerBackCoverImage, 0, 0 );
	} else if (
		backCoverState == COVER_STATES.COVERED
		|| backCoverState == COVER_STATES.RELEASED_LEFT 
		|| ( backCoverState == COVER_STATES.SNAPPED && centerPt.x <= 0 ) 
		|| ( backCoverState == COVER_STATES.SEEKING && centerPt.x <= 0 ) 
	) {
		var skew = ( 1 + xPercent ) * onePageDeltaSkew;
		var adjustment = backCoverImage.width * skew;
		
		ctx.setTransform( -xPercent * onePageDeltaScale, skew, 0, 1, offset.x + backCoverImage.width * xPercent + backCoverImage.width - ( backCoverImage.width - pageWidth ), offset.y - ( backCoverImage.height - pageHeight ) / 2 - adjustment);
		ctx.drawImage( backCoverImage, 0, 0 );
	}

	ctx.setTransform( 1, 0, 0, 1, 0, 0 );
}


/*----------------------------------------UTILS----------------------------------------*/
function degToRad ( deg ) {
    return deg / 180 * Math.PI;
}

function radToDeg ( rad ) {
    return rad / Math.PI * 180;
}

function computeDistance ( pt1, pt2 ) {
    return Math.sqrt( Math.pow( pt2.x - pt1.x, 2 ) + Math.pow( pt2.y - pt1.y, 2 ) );
}

function checkForSingleWordHit ( index, adjustedPt ) {
	var a = 0;
	while ( bounds = singleWordHitbox[index + "_" + a] ) {
		for ( var b = 0, len = bounds.length; b < len; b++ ) {	
			if ( checkBoxCollision( adjustedPt, bounds[b] ) ) {
				return bounds[b];
			}
		}

		a++;
	}
}

function Point ( x, y ) {
	this.x = x;
	this.y = y;
}

Point.prototype.interpolate = function interpolate ( a, b, frac ) {
	var nx = b.x + ( a.x - b.x ) * frac;
	var ny = b.y + ( a.y - b.y ) * frac;
	return { x:nx, y:ny };
}
/*----------------------------------------UPDATE LOOP----------------------------------------*/
function update () {
	// ease to target
	updateCenterPoint();
	
	selectedWord = "";

    compute();
    render();

    drawButtons();

    currentDate = new Date();
}

function consistentTick () {
    if ( currentDate ) {
        var newDate = new Date();
        diff += newDate.getTime() - currentDate.getTime();
        fpsDiff += newDate.getTime() - currentDate.getTime();
		
        if ( diff > mspf ) {
            var ticks = Math.floor( diff / mspf );
            diff -= ticks * mspf;
            
			numUpdates += ticks;
			
			for ( var a = 0; a < ticks; a++ ) {
				update();
			}
        }
		
		if ( fpsDiff >= 1000 ) {
			if (showFpsCounter) {
				fpsCounter.innerHTML = numUpdates;
			}
		
			fpsDiff = 0;
			numUpdates = 0;
		}
        
        currentDate = newDate;
    }
    
    setTimeout( consistentTick, mspf );
}

function updateCenterPoint () {
	var cornerDistance = computeDistance( topPt, cornerPt );

	if ( targetPt.x != centerPt.x || targetPt.y != centerPt.y ) {
		// get distance of centerPt and targetPt
		var distanceFromTarget = computeDistance( centerPt, targetPt );
		
		if ( distanceFromTarget < 2 ) {
			centerPt.x = targetPt.x;
			centerPt.y = targetPt.y
		} else {
			centerPt.x -= ( centerPt.x - targetPt.x ) * 0.2;
			centerPt.y -= ( centerPt.y - targetPt.y ) * 0.3;
		}

		// check overflow from base
		var dist = computeDistance( centerPt, basePt );
		if ( dist > pageWidth ) {
			// interpolate to page height
			var checkedCenterPt = basePt.interpolate( centerPt, basePt, cornerPt.x / dist );
			centerPt.x = checkedCenterPt.x;
			centerPt.y = checkedCenterPt.y;
		}
		
		// check overflow from top
		dist = computeDistance( centerPt, topPt );
		if ( dist > cornerDistance ) {
			var checkedCenterPt = basePt.interpolate( centerPt, topPt, cornerDistance / dist );
			centerPt.x = checkedCenterPt.x;
			centerPt.y = checkedCenterPt.y;
		}
	} else {
		if ( frontCoverState == COVER_STATES.SEEKING && centerPt.x == -cornerPt.x ) {
			frontCoverState = COVER_STATES.OPENED;
		} else if ( frontCoverState == COVER_STATES.SEEKING && centerPt.x == cornerPt.x ) {
			frontCoverState = COVER_STATES.COVERED;
		}

		if ( backCoverState == COVER_STATES.SEEKING && centerPt.x == -cornerPt.x ) {
			backCoverState = COVER_STATES.COVERED;
		} else if ( backCoverState == COVER_STATES.SEEKING && centerPt.x == cornerPt.x ) {
			backCoverState = COVER_STATES.OPENED;
		}

		if ( pageState == PAGE_STATES.SEEKING && centerPt.x == -cornerPt.x ) {
			pageState= PAGE_STATES.IDLE_LEFT;
		} else if ( pageState == PAGE_STATES.SEEKING && centerPt.x == cornerPt.x ) {
			pageState = PAGE_STATES.IDLE_RIGHT;
		}
	}
	


	if ( frontCoverState == COVER_STATES.RELEASED_LEFT && centerPt.x == -cornerPt.x ) {
		frontCoverState = COVER_STATES.OPENED;
	} else if ( frontCoverState == COVER_STATES.RELEASED_RIGHT && centerPt.x == cornerPt.x ) {
		frontCoverState = COVER_STATES.COVERED;
	}


	if ( backCoverState == COVER_STATES.RELEASED_LEFT && centerPt.x == -cornerPt.x ) {
		backCoverState = COVER_STATES.COVERED;
	} else if ( backCoverState == COVER_STATES.RELEASED_RIGHT && centerPt.x == cornerPt.x ) {
		backCoverState = COVER_STATES.OPENED;
	}


	if ( pageState == PAGE_STATES.RELEASED_LEFT && centerPt.x == -cornerPt.x ) {
		pageState = PAGE_STATES.IDLE_LEFT;
	} else if ( pageState == PAGE_STATES.RELEASED_RIGHT && centerPt.x == cornerPt.x ) {
		pageState = PAGE_STATES.IDLE_RIGHT;
	}
}


function autoSeekLeft () {
	if ( 
		backCoverState == COVER_STATES.COVERED 
		|| backCoverState == COVER_STATES.SEEKING 
	) {
		return;
	} else if ( frontCoverState == COVER_STATES.COVERED ) {
		frontCoverState = COVER_STATES.SEEKING;
	} else if ( 
		backCoverState == COVER_STATES.OPENED 
		&& pageState == PAGE_STATES.IDLE_LEFT
		&& currentImageIndex >= finalImageIndex 
	) {
		backCoverState = COVER_STATES.SEEKING;
	} else if ( frontCoverState == COVER_STATES.OPENED ) {
		if ( 
			pageState == PAGE_STATES.IDLE_LEFT 
			&& currentImageIndex < finalImageIndex
		) {
			setImages( currentImageIndex + 2 );
		} else if ( currentImageIndex == finalImageIndex ) { // add logic for back cover
			return;
		}

		pageState = PAGE_STATES.SEEKING;
	} else {
		// conditions not satisfied, do nothing
		return;
	}

	centerPt.x = pageWidth;
	centerPt.y = pageHeight;

	targetPt.x = -pageWidth;
	targetPt.y = pageHeight;
}


function autoSeekRight () {
	if ( backCoverState == COVER_STATES.SEEKING ) {
		return;
	} else if ( backCoverState == COVER_STATES.COVERED ) {
		backCoverState = COVER_STATES.SEEKING;
	} else if ( frontCoverState == COVER_STATES.OPENED && pageState == PAGE_STATES.IDLE_RIGHT && currentImageIndex == initialImageIndex ) {
		frontCoverState = COVER_STATES.SEEKING;
	} else if ( backCoverState == COVER_STATES.COVERED ) {
		backCoverState = COVER_STATES.SEEKING;
	} else if ( frontCoverState == COVER_STATES.OPENED ) {
		if ( pageState == PAGE_STATES.IDLE_RIGHT && currentImageIndex != initialImageIndex ) {
			setImages( currentImageIndex - 2 );
		}

		pageState = PAGE_STATES.SEEKING;
	} else {
		// conditions not satisfied, do nothing
		return;
	}

	centerPt.x = -pageWidth;
	centerPt.y = pageHeight;

	targetPt.x = pageWidth;
	targetPt.y = pageHeight;
}


function processMove ( newPt ) {
	mousePt.x = newPt.x - midPt.x;
	mousePt.y = newPt.y;

	if ( 
		pageState != PAGE_STATES.SNAPPED 
		&& frontCoverState != COVER_STATES.SNAPPED 
		&& backCoverState != COVER_STATES.SNAPPED 
	) {
		return;
	}

	if ( newPt.x != targetPt.x || newPt.y != targetPt.y ) {
		targetPt.x = newPt.x - midPt.x;
		targetPt.y = newPt.y
	}
}

window.soundCompleteHandler = function ( event ) {
	if ( autoPlayGlobalSoundInstance ) {
		autoPlayGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
		autoPlayGlobalSoundInstance = null;
	}

	if ( isPlaying ) {
		playGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
		playGlobalSoundInstance = null;

		isPlaying = false;
	}

	if ( isAutoPlaying ) {
		if ( pageState == PAGE_STATES.IDLE_LEFT ) {
			autoPlayGlobalSoundInstance = createjs.Sound.play( Math.floor( currentImageIndex / 2 ) + 2 );
			autoPlayGlobalSoundInstance.on("complete", window.soundCompleteHandler, window);
			
			autoSeekLeft();
		} else if ( pageState == PAGE_STATES.IDLE_RIGHT ) {
			autoPlayGlobalSoundInstance = createjs.Sound.play( Math.floor( currentImageIndex / 2 ) + 1 );
			autoPlayGlobalSoundInstance.on("complete", window.soundCompleteHandler, window);

			autoSeekLeft();
		}
	}
}


function playOnLoad ( event ) {
	createjs.Sound.play( event.id );	
}


/*----------------------------------------INPUT HANDLING----------------------------------------*/
function processDown ( newPt ) {
	if ( selectedWord !== "" ) {
		return;
	}

	if ( pageState == PAGE_STATES.SEEKING || frontCoverState == COVER_STATES.SEEKING || backCoverState == COVER_STATES.SEEKING ) {
		return;
	}

	if ( checkBoxCollision( newPt, leftButtonBounds ) ) {
		autoSeekRight();
		return;
	} else if ( checkBoxCollision( newPt, rightButtonBounds ) ) {
		autoSeekLeft();
		return;
	} else if ( checkBoxCollision( newPt, fullscreenButtonBounds ) ) {
		toggleFullScreen();
		return;
	} else if ( checkBoxCollision( newPt, playButtonBounds ) ) {
		if ( frontCoverState == COVER_STATES.COVERED || backCoverState == COVER_STATES.COVERED ) {
			return;
		}

		// play
		if ( isPlaying ) {
			if ( autoPlayGlobalSoundInstance ) {
				autoPlayGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
				autoPlayGlobalSoundInstance = null;

				autoButton.src = pImagesPath + "auto.png";

				isAutoPlaying = false;
			}

			if ( playGlobalSoundInstance ) {
				playGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
				playGlobalSoundInstance = null;
			}

			isPlaying = false;
			createjs.Sound.stop();

			playButton.src = pImagesPath + "play.png";
		} else {
			if ( isAutoPlaying ) {
				autoButton.src = pImagesPath + "auto.png";

				isAutoPlaying = false;
			}

			if ( autoPlayGlobalSoundInstance ) {
				autoPlayGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
				autoPlayGlobalSoundInstance = null;

				autoButton.src = pImagesPath + "auto.png";

				isAutoPlaying = false;
			}

			if ( playGlobalSoundInstance ) {
				playGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
				playGlobalSoundInstance = null;
			}

			createjs.Sound.stop();

			if ( pageState == PAGE_STATES.IDLE_LEFT ) {
				playGlobalSoundInstance = createjs.Sound.play( Math.floor( currentImageIndex / 2 ) + 1 );
				playGlobalSoundInstance.on("complete", window.soundCompleteHandler, window);
				isPlaying = true;

				playButton.src = pImagesPath + "pause.png";
			} else if ( pageState == PAGE_STATES.IDLE_RIGHT ) {
				playGlobalSoundInstance = createjs.Sound.play( Math.floor( currentImageIndex / 2 ) );
				playGlobalSoundInstance.on("complete", window.soundCompleteHandler, window);
				isPlaying = true;

				playButton.src = pImagesPath + "pause.png";
			}
		}
		
		return;
	} else if ( checkBoxCollision( newPt, autoButtonBounds ) ) {
		if ( frontCoverState == COVER_STATES.COVERED || backCoverState == COVER_STATES.COVERED ) {
			return;
		}

		// auto play
		if ( isAutoPlaying ) {
			if ( playGlobalSoundInstance ) {
				playGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
				playGlobalSoundInstance = null;

				playButton.src = pImagesPath + "play.png";

				isPlaying = false;
			}

			if ( playGlobalSoundInstance ) {
				playGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
				playGlobalSoundInstance = null;
			}

			isAutoPlaying = false;
			createjs.Sound.stop();

			autoButton.src = pImagesPath + "auto.png";
		} else {
			if ( autoPlayGlobalSoundInstance ) {
				autoPlayGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
				autoPlayGlobalSoundInstance = false;
			}

			if ( playGlobalSoundInstance ) {
				playGlobalSoundInstance.off( "complete", window.soundCompleteHandler );
				playGlobalSoundInstance = null;

				playButton.src = pImagesPath + "play.png";

				isPlaying = false;
			}

			createjs.Sound.stop();

			if ( pageState == PAGE_STATES.IDLE_LEFT ) {
				var autoPlayGlobalSoundInstance = createjs.Sound.play( Math.floor( currentImageIndex / 2 ) + 1 );
				autoPlayGlobalSoundInstance.on("complete", window.soundCompleteHandler, window);
				isAutoPlaying = true;

				autoButton.src = pImagesPath + "auto_pause.png";
			} else if ( pageState == PAGE_STATES.IDLE_RIGHT ) {
				var autoPlayGlobalSoundInstance = createjs.Sound.play( Math.floor( currentImageIndex / 2 ) );
				autoPlayGlobalSoundInstance.on("complete", window.soundCompleteHandler, window);
				isAutoPlaying = true;

				autoButton.src = pImagesPath + "auto_pause.png";
			}
		}

		return;
	}
	


	// check for single word collision
	var singleWord;
	var adjustedPt = {};
	var isRightPage = false;
	if ( newPt.x > pageWidth ) {
		adjustedPt.x = newPt.x - pageWidth;
		isRightPage = true;
	} else {
		adjustedPt.x = newPt.x;	
	}
	adjustedPt.y = newPt.y;

	if ( 
		frontCoverState == COVER_STATES.COVERED 
		|| frontCoverState == COVER_STATES.RELEASED_RIGHT
	) {
		if (newPt.x >= pageWidth) {
			adjustedPt.y += (frontCoverImage.height - pageHeight) * .5;

			singleWord = checkForSingleWordHit( "frontcover", adjustedPt );
		}
	} else if ( backCoverState == COVER_STATES.COVERED ) {
		if (newPt.x <= pageWidth) {
			adjustedPt.y += (frontCoverImage.height - pageHeight) * .5;

			singleWord = checkForSingleWordHit( "backcover", adjustedPt );
		}
	} else if ( 
		frontCoverState == COVER_STATES.OPENED 
		&& backCoverState == COVER_STATES.OPENED 
	) {
		if ( 
			pageState == PAGE_STATES.IDLE_RIGHT 
			|| pageState == PAGE_STATES.RELEASED_RIGHT 
		) {
			if ( isRightPage ) {
				singleWord = checkForSingleWordHit( currentImageIndex - 3, adjustedPt );
			} else {
				singleWord = checkForSingleWordHit( currentImageIndex - 4, adjustedPt );
			}
		} else if ( 
			pageState == PAGE_STATES.IDLE_LEFT 
			|| pageState == PAGE_STATES.RELEASED_LEFT 
		) {
			if ( isRightPage ) {
				singleWord = checkForSingleWordHit( currentImageIndex, adjustedPt );
			} else {
				singleWord = checkForSingleWordHit( currentImageIndex - 2, adjustedPt );
			}
		}
	}

	if ( singleWord ) {
		if (!audioDictionary[singleWord.word]) {
			audioDictionary[singleWord.word] = singleWord.word;
			var trimmedWord = singleWord.word.toLowerCase().replace(/[\W_]+/g,"");
			createjs.Sound.registerSound( pWordsAudioPath + trimmedWord + ".mp3", trimmedWord );
		} else {
			createjs.Sound.play( singleWord.word.toLowerCase() );
		}
		
		return;
	}


	// page turn
	if ( newPt.x != targetPt.x || newPt.y != targetPt.y ) {		
		if ( 
			( frontCoverState == COVER_STATES.COVERED && newPt.x > pageWidth )
			|| ( frontCoverState == COVER_STATES.RELEASED_RIGHT && newPt.x > pageWidth )
			|| ( frontCoverState == COVER_STATES.RELEASED_LEFT && newPt.x <= pageWidth )
			|| ( frontCoverState == COVER_STATES.OPENED && newPt.x < pageWidth && currentImageIndex == initialImageIndex && pageState == PAGE_STATES.IDLE_RIGHT )
			|| ( frontCoverState == COVER_STATES.SNAPPED )
		) {
			if ( frontCoverState == COVER_STATES.COVERED ) {
				centerPt.x = cornerPt.x;
				centerPt.y = cornerPt.y;
			} else if ( frontCoverState == COVER_STATES.OPENED ) {
				centerPt.x = -cornerPt.x;
				centerPt.y = cornerPt.y;
			}

			frontCoverState = COVER_STATES.SNAPPED;
		} else if ( frontCoverState == COVER_STATES.OPENED ) { // process taps on pages only if cover is open
			if ( 
				( 
					(
						backCoverState == COVER_STATES.COVERED 
						|| backCoverState == COVER_STATES.RELEASED_LEFT
					)
					&& newPt.x <= pageWidth 
				)
				|| (
					(
						backCoverState == COVER_STATES.OPENED
						|| backCoverState == COVER_STATES.RELEASED_RIGHT
					)
					&& pageState == PAGE_STATES.IDLE_LEFT
					&& currentImageIndex > finalImageIndex
					&& newPt.x > pageWidth
				)
			) {
				if ( backCoverState == COVER_STATES.OPENED ) {
					centerPt.x = cornerPt.x;
					centerPt.y = cornerPt.y;
				} else if ( backCoverState == COVER_STATES.COVERED ) {
					centerPt.x = -cornerPt.x;
					centerPt.y = cornerPt.y;
				}

				backCoverState = COVER_STATES.SNAPPED;
			} else if ( 
				( 
					pageState == PAGE_STATES.IDLE_RIGHT 
					|| pageState == PAGE_STATES.RELEASED_RIGHT 
				)
				&& newPt.x > pageWidth
			) {
				pageState = PAGE_STATES.SNAPPED;

				if ( centerPt.x < pageWidth ) {
					centerPt.x = cornerPt.x
					centerPt.y = cornerPt.y
				}
			} else if (
				( 
					pageState == PAGE_STATES.IDLE_LEFT
					|| pageState == PAGE_STATES.RELEASED_LEFT 
				)
				&& newPt.x <= pageWidth
			) {
				pageState = PAGE_STATES.SNAPPED;

				if ( centerPt.x >= pageWidth ) {
					centerPt.x = -cornerPt.x
					centerPt.y = cornerPt.y
				}
			}


			if ( 
				( pageState == PAGE_STATES.IDLE_RIGHT && newPt.x <= pageWidth )
				&& currentImageIndex > initialImageIndex
			) {
				// change state
				pageState = PAGE_STATES.SNAPPED;

				setImages( currentImageIndex - 2 );

				centerPt.x = -cornerPt.x;
				centerPt.y = cornerPt.y;
			} else if ( 
				pageState == PAGE_STATES.IDLE_LEFT && newPt.x > pageWidth 
				&& currentImageIndex < finalImageIndex
			) {
				// change state
				pageState = PAGE_STATES.SNAPPED;

				setImages( currentImageIndex + 2 );

				centerPt.x = cornerPt.x;
				centerPt.y = cornerPt.y;
			}
		}

		if ( 
			frontCoverState == COVER_STATES.SNAPPED
			|| backCoverState == COVER_STATES.SNAPPED
			|| pageState == PAGE_STATES.SNAPPED
		) {
			targetPt.x = newPt.x - midPt.x;
			targetPt.y = newPt.y
		}

	}
}

function processUp ( newPt ) {
	if ( pageState == PAGE_STATES.SEEKING || frontCoverState == COVER_STATES.SEEKING || backCoverState == COVER_STATES.SEEKING ) {
		return;
	}
	

	if ( frontCoverState == COVER_STATES.SNAPPED ) {
		if ( newPt.x > pageWidth ) {
			frontCoverState = COVER_STATES.RELEASED_RIGHT;

			targetPt.x = cornerPt.x;
			targetPt.y = cornerPt.y
		} else {
			frontCoverState = COVER_STATES.RELEASED_LEFT;

			targetPt.x = -cornerPt.x;
			targetPt.y = cornerPt.y
		}
	}

	if ( backCoverState == COVER_STATES.SNAPPED ) {
		if ( newPt.x > pageWidth ) {
			backCoverState = COVER_STATES.RELEASED_RIGHT;

			targetPt.x = cornerPt.x;
			targetPt.y = cornerPt.y
		} else {
			backCoverState = COVER_STATES.RELEASED_LEFT;

			targetPt.x = -cornerPt.x;
			targetPt.y = cornerPt.y
		}
	}

	if ( pageState == PAGE_STATES.SNAPPED ) {
		if ( newPt.x > pageWidth ) {
			pageState = PAGE_STATES.RELEASED_RIGHT;

			targetPt.x = cornerPt.x;
			targetPt.y = cornerPt.y
		} else {
			pageState = PAGE_STATES.RELEASED_LEFT;

			targetPt.x = -cornerPt.x;
			targetPt.y = cornerPt.y
		}
	}
}


function checkBoxCollision ( pt, bounds ) {
	if ( pt.x >= bounds.x && pt.x <= bounds.x + bounds.width && pt.y >= bounds.y && pt.y < bounds.y + bounds.height ) {
		return true;
	} else {
		return false;
	}
}


function mouseMoveHandler ( event ) {
	var cRect = c.getBoundingClientRect();

	var pX = ( event.clientX - cRect.left ) * c.width / cRect.width;
	var pY = ( event.clientY - cRect.top ) * c.height / cRect.height;

	var newPt = new Point( pX - offset.x, pY - offset.y );
	processMove( newPt );

	return false;
}

function mouseDownHandler ( event ) {
	var cRect = c.getBoundingClientRect();

	var pX = ( event.clientX - cRect.left ) * c.width / cRect.width;
	var pY = ( event.clientY - cRect.top ) * c.height / cRect.height;

	var newPt = new Point( pX - offset.x, pY - offset.y );
	processDown( newPt );

	return false;
}

function mouseUpHandler ( event ) {
	var cRect = c.getBoundingClientRect();

	var pX = ( event.clientX - cRect.left ) * c.width / cRect.width;
	var pY = ( event.clientY - cRect.top ) * c.height / cRect.height;
	
	var newPt = new Point( pX - offset.x, pY - offset.y );

	processUp( newPt );

	return false;
}

function touchMoveHandler ( event ) {
	var cRect = c.getBoundingClientRect();

	var pX = ( event.changedTouches[0].clientX - cRect.left ) * c.width / cRect.width;
	var pY = ( event.changedTouches[0].clientY - cRect.top ) * c.height / cRect.height;

	var newPt = new Point( pX - offset.x, pY - offset.y );

	processMove( newPt );

	return false;
}

function touchStartHandler ( event ) {
	var cRect = c.getBoundingClientRect();

	var pX = ( event.changedTouches[0].clientX - cRect.left ) * c.width / cRect.width;
	var pY = ( event.changedTouches[0].clientY - cRect.top ) * c.height / cRect.height;

	var newPt = new Point( pX - offset.x, pY - offset.y );

	processDown( newPt );

	return false;
}

function touchEndHandler ( event ) {
	var cRect = c.getBoundingClientRect();
	
	var pX = ( event.changedTouches[0].clientX - cRect.left ) * c.width / cRect.width;
	var pY = ( event.changedTouches[0].clientY - cRect.top ) * c.height / cRect.height;

	var newPt = new Point( pX - offset.x, pY - offset.y );

	processUp( newPt );

	return false;
}

function toggleFullScreen () {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (c.requestFullscreen) {
      c.requestFullscreen();
    } else if (c.msRequestFullscreen) {
      c.msRequestFullscreen();
    } else if (c.mozRequestFullScreen) {
      c.mozRequestFullScreen();
    } else if (c.webkitRequestFullscreen) {
      c.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }

    fullscreenButton.src = pImagesPath + "exit_fullscreen.png";
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }

    fullscreenButton.src = pImagesPath + "fullscreen.png";
  }
}