// ==UserScript==
// @name           Sqwarea-Helper
// @namespace      http://guillaume.segu.in/
// @description    Enhances Sqwarea UI
// @include        http://sqwarea.cloudapp.net/Game
// @include        http://www.sqwarea.com/Game
// ==/UserScript==

(function () {
  var Map, $;

  function sqwarea_init_wait() {
    if (typeof unsafeWindow.Map == 'undefined' || typeof unsafeWindow.$ == 'undefined') {
      window.setTimeout(sqwarea_init_wait, 100);
    } else {
      Map = unsafeWindow.Map;
      $ = unsafeWindow.$;
      sqwarea_helper_run();
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
  }

  try {
    sqwarea_init_wait();
  } catch (e) {
    alert("UserScript exception:\n" + e);
  }
})();
