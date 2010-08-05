// ==UserScript==
// @name           Sqwarea-Helper
// @namespace      http://guillaume.segu.in/
// @description    Enhances Sqwarea UI
// @include        http://sqwarea.cloudapp.net/Game
// @include        http://www.sqwarea.com/Game
// ==/UserScript==

var elmt = document.createElement("script");
elmt.type = "text/javascript";
elmt.text = "(" + (function() {
  var Map, Tools, $;
  function sqwarea_init_wait() {
    if (typeof window.Map == 'undefined'
     || typeof window.Tools == 'undefined'
     || typeof window.$ == 'undefined') {
      window.setTimeout(sqwarea_init_wait, 100);
    } else {
      Map = window.Map;
      Tools = window.Tools;
      $ = window.$;
      try {
        sqwarea_helper_run();
      } catch (e) {
        alert("UserScript exception:\n" + e);
      }
    }
  }

  function sqwarea_helper_run() {
    Map.square._base_initPoint = Map.square._initPoint;
    Map.square._base_mouseOver = Map.square._mouseOver;
    Map.square._initPoint = function(y, x, square) {
      // Add coords info alert on ctrl+click
      Map.square._base_initPoint (y, x, square);
      square.bind ('click', function(e) {
        if (e.ctrlKey) {
          alert ("Square coords : (x, y) = (" + x + ", " + y + ")");
          e.preventDefault();
        }
      });
      // Add coords info to tooltip
      square.unbind('mouseenter mouseleave');
      Map.square._mouseOver = function(e) {
        Map.square._base_mouseOver.apply (square, arguments);
        var info = Map._info;
        info.append ('<dt>Coords:</dt><dd>(' + x + ', ' + y + ')</dd>');
        var offset = {
           left: (square.position().left + Map.size.width + 10),
           top: (square.position().top + Map.size.height + 10)
        };
        info.css( offset );
        // Reapply offsets
        var groundOffset = Map._ground.offset();
        if( ((offset.left + info.width()) >= (-groundOffset.left + Map._dim.width*Map.size.width - 50))
            ||  ((offset.top + info.height()) >= (-groundOffset.top + Map._dim.height*Map.size.height - 50)) ) {
            offset.left -= info.width() + Map.size.width + 30;
            offset.top -= info.height() + Map.size.height + 30;
            info.css( offset );
        }
      }
      square.hover(Map.square._mouseOver, Map.square._mouseOut);
    }
    // Add "Go to _C_oords" button
    var gotobutton = $("<li class=\"GoToCoords\"><img src=\"../../Content/Images/troops.png\" /> Go to <u>C</u>oords</li>");
    gotobutton.click(function() {
      var destination = window.prompt ("Destination coords ?", "a,b");
      destination = Tools.point.parse (destination);
      Map.goToPoint (destination);
    });
    $("div.Actions ol").append (gotobutton);
    // Add "_B_ank Troops" button
    var bankbutton = $("<li class=\"BankTroops\"><img src=\"../../Content/Images/troops.png\" /> <u>B</u>ank troops</li>");
    bankbutton.click(function() {
      Dialog.displayTroopsSender(Map._kingData, Logic.king.academyTroops);
    });
    $("div.Actions ol").append (bankbutton);
  }

  try {
    sqwarea_init_wait();
  } catch (e) {
    alert("UserScript exception:\n" + e);
  }
}).toString() + ")();";
document.body.appendChild(elmt);
