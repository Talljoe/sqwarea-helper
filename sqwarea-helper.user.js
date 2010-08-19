// ==UserScript==
// @name           Sqwarea-Helper
// @namespace      http://guillaume.segu.in/
// @description    Enhances Sqwarea UI
// @include        http://sqwarea.cloudapp.net/Game
// @include        http://www.sqwarea.com/Game
// ==/UserScript==

var elmt = document.createElement("script");
elmt.type = "text/javascript";
elmt.text = "(" + (function () {
    function displayTroopsSender(data, troops) {
        if (troops == null) troops = 10;
        if (data.kingId != Logic.king.id) {
            troops = data.troops == null ? (Logic.globals.initialSquareTroopsNumber + Logic.globals.minimumTroopsToClaimSquare)
                                         : (data.troops + Logic.globals.minimumTroopsToClaimSquare);
        }
        troops = Math.min(Logic.king.academyTroops, troops);

        $('.Actions .SendTroops.Pushed').click();
        var o = this.displayMessage('Send troops',
        $('.Templates .SendTroopsDialog').clone(),
        {
            'Send': function () {
                var key = data.x + ',' + data.y;
                data = Map._data[key];
                if ((data.kingId != Logic.king.id)
                    && (data.troops > (troops - Logic.globals.minimumTroopsToClaimSquare))) {
                    switch (Logic.globals.minimumTroopsToClaimSquare) {
                        case 0:
                            if (!confirm('You need to have killed all troops'
                                + ' at the end of the battle top claim square. Are you sure you want to continue ?')) {
                                return;
                            }
                            break;
                        case 1:
                            if (!confirm('You need to have 1 troop'
                                + ' at the end of the battle top claim square. Are you sure you want to continue ?')) {
                                return;
                            }
                            break;
                        default:
                            if (!confirm('You need to have ' + Logic.globals.minimumTroopsToClaimSquare + ' troops'
                                + ' at the end of the battle top claim square. Are you sure you want to continue ?')) {
                                return;
                            }
                            break;
                    }
                }
                $.post('/Game/SendTroops', {
                    x: data.x,
                    y: data.y,
                    sessionId: Logic.globals.sessionId,
                    troops: troops
                }, function (json) {
                    Logic.handleSynchronization(json);
                    Map.handleSynchronization(json);
                    if (!json.Success) {
                        Dialog.displaySimpleMessage('Movement failed',
                            "<p>King can't send troops to this destination</p>");
                    }
                }, 'json');
                Dialog.close(o);
            },

            'Cancel': function () {
                Dialog.close(o);
            }
        });

        $('.TroopsNumber', o).attr('value', troops);
        $('.TroopsNumber', o).bind('change keyup blur', function () {
            var value = $(this).attr('value');
            var flag = value;
            value = value.replace(/[^0-9]/g, '');
            if (value != flag) {
                $(this).attr('value', value);
            }
            if (value == '') {
                $('input[type=button]:first', o).attr('disabled', 'disabled');
                return;
            }
            value = parseInt(value);
            if (value > Logic.king.academyTroops) {
                $('input[type=button]:first', o).attr('disabled', 'disabled');
                return;
            }
            $('input[type=button]:first', o).removeAttr('disabled');
            troops = value;
            $('.Slider', o).slider('value', value);
        });

        $('.Slider', o).slider({
            min: 1,
            value: troops,
            max: Logic.king.academyTroops,
            step: 1,
            slide: function (e, ui) {
                troops = ui.value;
                $('.TroopsNumber', o).attr('value', ui.value);
            }
        });

        $('input[type=text]', o).select();
        return o;
    }

    function sqwarea_helper_run() {
        Logic.logs.updateLogs = function (logs) {

            var ol = $('.Logs ol');
            ol.find('li').trigger('mouseout');

            //ol.html( '' );
            for (var i = Math.max(0, logs.length - 200); i < logs.length; i++) {
                var log = logs[i];
                log.Date = Tools.date.parse(log.Date);
                log.Position = Tools.point.parse(log.Position);
                ol.prepend(Logic.logs.log.create(log));
            }
        }

        Dialog.displayTroopsSender = displayTroopsSender;
        Map.square._base_initPoint = Map.square._initPoint;
        Map.square._base_mouseOver = Map.square._mouseOver;
        Map.square._initPoint = function (y, x, square) {
            Map.square._base_initPoint(y, x, square);

            // Add coords info alert on ctrl+click
            square.bind('click', function (e) {
                if (e.ctrlKey) {
                    alert("Square coords : (x, y) = (" + x + ", " + y + ")");
                    e.preventDefault();
                }
            });
            // Add coords info to tooltip
            square.unbind('mouseenter mouseleave');
            Map.square._mouseOver = function (e) {
                Map.square._base_mouseOver.apply(square, arguments);
                var xOfs = Map._kingData.x - x;
                var yOfs = Map._kingData.y - y;
                var distance = Math.sqrt((xOfs * xOfs) + (yOfs * yOfs));
                var info = Map._info;
                info.append('<dt>Coords:</dt><dd>(' + x + ', ' + y + ')</dd>');
                if (distance > 0) {
                    info.append('<dt>Travel Time:</dt><dd>' + Tools.date.toHumanDelay(distance * 10 * 60 * 1000) + '</dd>');
                }
                var offset = {
                    left: (square.position().left + Map.size.width + 10),
                    top: (square.position().top + Map.size.height + 10)
                };
                info.css(offset);
                // Reapply offsets
                var groundOffset = Map._ground.offset();
                if (((offset.left + info.width()) >= (-groundOffset.left + Map._dim.width * Map.size.width - 50))
            || ((offset.top + info.height()) >= (-groundOffset.top + Map._dim.height * Map.size.height - 50))) {
                    offset.left -= info.width() + Map.size.width + 30;
                    offset.top -= info.height() + Map.size.height + 30;
                    info.css(offset);
                }
            }
            square.hover(Map.square._mouseOver, Map.square._mouseOut);
        }
        // Add "Go to _C_oords" button
        var gotobutton = $("<li class=\"GoToCoords\"><img src=\"../../Content/Images/troops.png\" /> Go to <u>C</u>oords</li>");
        gotobutton.click(function () {
            var destination = window.prompt("Destination coords ?", "a,b");
            if (destination != null) {
                destination = Tools.point.parse(destination);
                Map.goToPoint(destination);
            }
        });
        $("div.Actions ol").append(gotobutton);

        // Add "_B_ank Troops" button
        var bankbutton = $("<li class=\"BankTroops\"><img src=\"../../Content/Images/troops.png\" /> <u>B</u>ank troops</li>");
        bankbutton.click(function () {
            Dialog.displayTroopsSender(Map._kingData, Logic.king.academyTroops);
        });
        $("div.Actions ol").append(bankbutton);

        // Add "_D_efault Attack" button
        var defaultattackbutton = $("<li class=\"DefaultAttack\"><img src=\"../../Content/Images/troops.png\" /> <u>D</u>efault attack</li>");
        defaultattackbutton.click(function () {
            var inputSquareNumber = window.prompt("Troops on square", Logic.globals.initialSquareTroopsNumber);
            if(inputSquareNumber != null) {
              var inputMinimumTroops = window.prompt("Troops left over", Logic.globals.minimumTroopsToClaimSquare);
              if(inputMinimumTroops != null) {
                Logic.globals.minimumTroopsToClaimSquare = parseInt(inputMinimumTroops);
                Logic.globals.initialSquareTroopsNumber = parseInt(inputSquareNumber);
              }
            }
        });
        $("div.Actions ol").append(defaultattackbutton);

        $(document).unbind('keydown');
        $(document).keyup(function (e) {
            if (e.keyCode == $.ui.keyCode.ESCAPE) {
                $('.Pushed').click();
                $('.Dialogs .Dialog').each(function () {
                    Dialog.close(this);
                });
            }
            if (e.keyCode == $.ui.keyCode.ENTER) {
                $('.Dialogs .Dialog input[type=button]:first').each(function () {
                    if ($(this).is('[disabled]')) {
                        return;
                    }
                    $(this).click();
                });
                return;
            }
            if ($('input:focus').length) {
                return;
            }
            if (e.keyCode == $.ui.keyCode.UP) {
                Map._ground.css('top', parseInt(Map._ground.css('top')) + 10);
                Map.refreshPeriodically();
                return;
            }
            if (e.keyCode == $.ui.keyCode.DOWN) {
                Map._ground.css('top', parseInt(Map._ground.css('top')) - 10);
                Map.refreshPeriodically();
                return;
            }
            if (e.keyCode == $.ui.keyCode.LEFT) {
                Map._ground.css('left', parseInt(Map._ground.css('left')) + 10);
                Map.refreshPeriodically();
                return;
            }
            if (e.keyCode == $.ui.keyCode.RIGHT) {
                Map._ground.css('left', parseInt(Map._ground.css('left')) - 10);
                Map.refreshPeriodically();
                return;
            }
            $('u').each(function () {
                if ($(this).html().charCodeAt(0) == e.keyCode) {
                    $(this).click();
                }
            });
        });
    }

    $(sqwarea_helper_run);
}).toString() + ")();";
document.body.appendChild(elmt);
