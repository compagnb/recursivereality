// require(
//     ['typecast', 'frame', 'model', 'socket.io',
//         'css!/base/bootstrap/bootstrap.min.css',
//         'css!stylist/style.css', 'dc'
//     ],
    function(type, Frame, Model, io, lscache, moment) {

    brainData = {
            eSense: {
                attention: 0,
                meditation: 0
            },
            eegPower: {
                delta: 0,
                theta: 0,
                lowAlpha: 0,
                highAlpha: 0,
                lowBeta: 0,
                highBeta: 0,
                lowGamma: 0,
                highGamma: 0
            }
            // ,
            // poorSignalLevel: 0,
            // blinkStrength: 0
            // }
        };

    var socket = io.connect();

    socket.on('connect', function (data) {
        console.log("web socket connected");
    });

    socket.on('mindEvent', function (datatest) {
        brainData = datatest
    });

    console.log('data', brainData.eSense);

    $('body').append('<div id="screen"></div>');

    var data = d3.range(n).map(test);

    function test(){
        if(brainData.eSense != undefined){
            return {
                attention: brainData.eSense.attention,
                // brain.detectwebGL(); // detect webGL
                // brain.guiLoad(); // load gui
                // brain.init(); // initializes scene
                // brain.animate(); // adds animation

            }
        } else {
            return {
                attention: 0,

            }
        }
    }


// });
