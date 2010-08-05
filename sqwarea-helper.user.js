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

  function displayTroopsSender( data, troops ) {
    if(troops == null) troops = 10;
    if( data.kingId != Logic.king.id ) {
        troops = Math.min(Logic.king.academyTroops,
         data.troops == null ? (Logic.globals.initialSquareTroopsNumber + Logic.globals.minimumTroopsToClaimSquare)
         : (data.troops + Logic.globals.minimumTroopsToClaimSquare) );
    }
    
    $('.Actions .SendTroops.Pushed').click();
    var o = this.displayMessage( 'Send troops', 
        $('.Templates .SendTroopsDialog').clone(), 
        { 
            'Send' : function() {
                var key = data.x + ',' + data.y;
                data = Map._data[key];
                if( (data.kingId != Logic.king.id) 
                    && (data.troops > (troops - Logic.globals.minimumTroopsToClaimSquare)) ) {
                    switch( Logic.globals.minimumTroopsToClaimSquare ) {
                        case 0:
                            if( !confirm( 'You need to have killed all troops'
                                + ' at the end of the battle top claim square. Are you sure you want to continue ?' ) ) {
                                return;
                            }
                            break;
                        case 1:
                            if( !confirm( 'You need to have 1 troop'
                                + ' at the end of the battle top claim square. Are you sure you want to continue ?' ) ) {
                                return;
                            }
                            break; 
                        default:
                            if( !confirm( 'You need to have ' + Logic.globals.minimumTroopsToClaimSquare + ' troops'
                                + ' at the end of the battle top claim square. Are you sure you want to continue ?' ) ) {
                                return;
                            }
                            break;
                    }
                }
                $.post( '/Game/SendTroops', {
                    x : data.x,
                    y : data.y,
                    sessionId : Logic.globals.sessionId,
                    troops : troops
                }, function( json ) {
                    Logic.handleSynchronization( json );
                    Map.handleSynchronization( json );
                    if( !json.Success ) {
                        Dialog.displaySimpleMessage( 'Movement failed',
                            "<p>King can't send troops to this destination</p>" );
                    }
                }, 'json' );
                Dialog.close( o );
            },
            
            'Cancel' : function() {
                Dialog.close( o );
            }
        } );
     
    $('.TroopsNumber', o).attr( 'value', troops );
    $('.TroopsNumber', o).bind( 'change keyup blur', function() {
        var value = $(this).attr( 'value' );
        var flag = value;
        value = value.replace( /[^0-9]/g, '' );
        if( value != flag ) {
            $(this).attr( 'value', value );
        }
        if( value == '' ) {
            $('input[type=button]:first', o).attr( 'disabled', 'disabled' );
            return;
        }
        value = parseInt(value);
        if( value > Logic.king.academyTroops ) {
            $('input[type=button]:first', o).attr( 'disabled', 'disabled' );
            return;
        }
        $('input[type=button]:first', o).removeAttr( 'disabled' );
        troops = value;
        $('.Slider', o).slider( 'value', value );
    } );
        
    $('.Slider', o).slider( {
        min : 1,
        value : troops,
        max : Logic.king.academyTroops,
        step : 1,
        slide: function(e, ui) {
            troops = ui.value;
            $('.TroopsNumber', o).attr( 'value', ui.value );
        }
    } );
    
    $('input[type=text]', o).select();
    return o;
  }
    
  function sqwarea_helper_run() {
    Dialog.displayTroopsSender = displayTroopsSender;
    Map.square._base_initPoint = Map.square._initPoint;
    Map.square._base_mouseOver = Map.square._mouseOver;
    Map.square._initPoint = function(y, x, square) {
      Map.square._base_initPoint (y, x, square);

      // Add coords info alert on ctrl+click
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
