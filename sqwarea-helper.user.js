// ==UserScript==
// @name           Sqwarea-Helper
// @namespace      http://guillaume.segu.in/
// @description    Enhances Sqwarea UI
// @include        http://sqwarea.cloudapp.net/Game
// @include        http://www.sqwarea.com/Game
// ==/UserScript==

var Map;

function sqwarea_init_wait() {
  if (typeof unsafeWindow.Map == 'undefined') {
    window.setTimeout(sqwarea_init_wait, 100);
  } else {
    Map = unsafeWindow.Map;
    sqwarea_helper_run();
  }
}

function sqwarea_helper_run() {
  Map.square._base_init_point = Map.square._initPoint;
  Map.square._initPoint = function(y, x, square) {
    Map.square._base_init_point (y, x, square);
    square.bind ('click', function(e) {
      if (e.ctrlKey) {
        alert ("Square coords : (x, y) = (" + x + ", " + y + ")");
        e.preventDefault();
      }
    });
  }
}

(function () {
  try {
    sqwarea_init_wait();
  } catch (e) {
    alert("UserScript exception:\n" + e);
  }
})();
