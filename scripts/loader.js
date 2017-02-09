/**
 * BOOTSTRAP
 */
var qs = getQueryStrings();

var productID = ( !!qs["productID"] ) ? qs["productID"] : "books";
var bookID = ( !!qs["bookID"] ) ? qs["bookID"] : "sample";

var basePath = "./docs/";
var xmlPath = basePath + bookID + "/";
var coversPath = basePath + bookID + "/covers/";
var pageImagesPath = basePath + bookID + "/pages/";
var pageAudioPath = basePath + bookID + "/audio/en_au/";

var imagesPath = basePath + "images/";
var wordsAudioPath = basePath + "audio/en_au/words/";

var lang = "en_au";
var fps = 24;

var canvasWidth = 900;
var canvasHeight = 920;

document.write( "<div id=\"in2era\">" );
document.write( "<canvas id=\"myCanvas\" style=\"top:0px; left:0px; border: 0px solid #FF0000\" width=\"" + canvasWidth + "\" height=\"" + canvasHeight + "\"></canvas><div id=\"fpsCounter\" style=\"position:absolute; top:0px; left: 0px\"></div>" );
document.write( "<script src=\"scripts/book.js\"></script>" );
document.write( "<script src=\"scripts/soundjs-0.6.2.min.js\"></script>" );
document.write( "<script type=\"text/javascript\">var in2era = {};in2era.vars = {bookID:\"" + bookID + "\",productID:\"" + productID + "\",xmlPath:\"" + xmlPath + "\",imagesPath:\"" + imagesPath + "\",coversPath:\"" + coversPath + "\",pageImagesPath:\"" + pageImagesPath + "\",wordsAudioPath:\"" + wordsAudioPath + "\",pageAudioPath:\"" + pageAudioPath + "\",lang:\"" + lang + "\",fps:" + fps + "};in2era.tries = 0;in2era.loadPageFlip = function(){ if(typeof loadStep1 == \"undefined\" && in2era.tries < 150){ window.setTimeout(\"in2era.loadPageFlip()\", 200); in2era.tries++; } else{ loadStep1( in2era.vars.bookID, in2era.vars.productID, in2era.vars.xmlPath, in2era.vars.imagesPath, in2era.vars.coversPath, in2era.vars.pageImagesPath, in2era.vars.wordsAudioPath, in2era.vars.pageAudioPath, in2era.vars.lang, in2era.vars.fps ); }};in2era.loadPageFlip();</script>" );
document.write( "</div>" );

function getQueryStrings() { 
  var assoc  = {};
  var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
  var queryString = location.search.substring(1); 
  var keyValues = queryString.split('&'); 

  for(var i in keyValues) { 
    var key = keyValues[i].split('=');
    if (key.length > 1) {
      assoc[decode(key[0])] = decode(key[1]);
    }
  } 

  return assoc; 
}