/*
Worms

Author: Francis Shanahan, 2011
Website: http://FrancisShanahan.com

*/

var worms = [];
var gCanvas;
var srcImg;
var srcImgCanvas;
var srcImgCtx;
var srcImgData;
//var proxy = '/p.php?src=';

// how many worms to start with
var initialNumWorms = 10;
// Maximum worms
var maxWorms = 100;

var scoreToFavour = 255;

var counter = 0;

// the context we're writing to
var globalCtx;
// controls when a worm will branch
var branchThreshold = 230 * 4;

var lifetime = 100000;
var justBranched = 0;

var paused = false;

var once = true;

var pause = function () {
    if (paused === true) {
        paused = false;
        setTimeout(draw, 5); counter++;
        $('#pauseButton').attr('value', 'Pause');
    } else {
        paused = true;
        $('#pauseButton').attr('value', 'Paused');
    };
};

// Main loop
var draw = function () {

    var ctx = globalCtx;

    // draw all the worms
    for (var i = 0; i < worms.length; i++) {

        var w = worms[i];

        if (w.dead == false) {
            ctx.beginPath();
            // what color is this worm?
            ctx.fillStyle = "rgba( " + w.r + "," + w.g + "," + w.b + ", " + w.food / (4 * 255) + ")";

            ctx.arc(w.x, w.y, 1, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();

            // move all the worms
            w.x += (Math.cos(w.vector) * w.speed);
            w.y += (Math.sin(w.vector) * w.speed);

            worms[i] = updateDirection(worms[i]);

            // Wrap the worms around the canvas
            if (w.x > srcImgData.width) w.x = 0;
            if (w.x < 0) w.x = srcImgData.width;
            if (w.y > srcImgData.height) w.y = 0;
            if (w.y < 0) w.y = srcImgData.height;
        }
        else {
            // regenerate an available worm at a random slot
            // remove this to generate cleaner images.
            var tx = Math.floor(Math.random() * srcImgData.width);
            var ty = Math.floor(Math.random() * srcImgData.height);

            // assign a random vector to begin with
            var angle = Math.random() * 2 * Math.PI;

            // x and y and a vector (direction).
            // Unit circle is the cos(0), sin(0)
            // To convert radians to degrees, divide by 2*PI and multiply by 360 or ( * Math.PI/180)
            worms[i] = newWorm(i, tx, ty, angle);
        }
    }

    // Should we stop?
    if (paused) {
        log("paused");
    } else {
        setTimeout(draw, 5); counter++;
    }
};

var h2d = function (val) { return parseInt(val, 16); };

// Create a new worm, use random colors if directed
var newWorm = function (pi, px, py, pv) {

    var pr = h2d($('#wRed').val());
    var pg = h2d($('#wGreen').val());
    var pb = h2d($('#wBlue').val());

    if ($('#randomWormColors').attr('checked') === "checked") {
        pr = Math.floor(Math.random() * 255);
        pg = Math.floor(Math.random() * 255);
        pb = Math.floor(Math.random() * 255);
    };

    var w = { id: pi, x: px, y: py, vector: pv,
        food: 100, dead: false,
        speed: 2,
        r: pr,
        g: pg,
        b: pb
    };
    return w;
};

var log = function (msg) {
    // disable logging, goes a bit faster.
    if (window.console != undefined) {
        console.log(msg);
    }
    return;

};

var updateDirection = function (w) {
    // we know the current location
    // we know the vector
    // calculate a few variations between -30 degrees and +30 degree
    // and get their colors
    // whichever is brightest, that's where we go to.

    var thirtyDegrees = Math.PI / 12;
    var angle = 0;
    var bestAngle = 0;
    //var bestScoreSoFar = 0;
    //            var bestScoreSoFar = { r: 0, g: 0, b: 0, a: 0, score: 0 };
    var bestScoreSoFar = { r: 0, g: 0, b: 0, a: 0, score: 99999999 };

    // look for the best place to go
    for (var i = 0; i < 6; i++) {

        angle = w.vector - ((Math.random() * thirtyDegrees)) + ((Math.random() * thirtyDegrees));

        // calculate a new direction
        var tx = w.x + (Math.cos(angle) * 5 * w.speed);
        var ty = w.y + (Math.sin(angle) * 5 * w.speed); // 5 makes it look further out

        // test the source image
        var score = getColor(tx, ty, srcImgData);

        // swap > for <
        if (score.score < bestScoreSoFar.score) {
            //  log("best score " + score.score);

            bestAngle = angle;
            // Object assignment
            bestScoreSoFar = score;
        };
    };

    justBranched--;

    // If the score is SOO good, we should branch (unless maximum worms have been reached
    if (bestScoreSoFar.score > branchThreshold) {

        if (justBranched <= 0) {

            // assign a new vector, close to the original
            var startAngle = w.vector + ((Math.random() * thirtyDegrees));
            w.vector -= 0.37;

            if (worms.length < maxWorms) {
                // new worm
                worms[worms.length] = newWorm(worms.length, w.x, w.y, startAngle);

                // we don't want everything branching at once
                justBranched = 500;

                log("branching, num worms = " + worms.length);
            } else {
                log("wanted to branch but couldn't, too MANY worms");

                // maybe we can find a dead-worm and re-use him
                for (var i = 0; i < worms.length; i++) {
                    if (worms[i].dead == true) {
                        worms[i] = newWorm(i, w.x, w.y, startAngle);

                        log("Re-used a worm spot");
                        break;
                    };
                }
            }
        } else {
            log("wanted to branch but couldn't, too recent since last branch");
        }
    }

    w.vector = bestAngle;

    w.food--;

    // favour the light
    // 100 + 100 + 100 + 255
    /*if (bestScoreSoFar.score > 755) {
    w.food = 200;
    }*/

    // favour the dark
    if (bestScoreSoFar.score < 355) {
        w.food = 200;
    }

    //log(w.food);
    if (w.food == 0) {
        w.dead = true;
        log("worm " + w.id + " died, lack of food");
    }


    //log(angle);
    return w;
};

var loadImg = function () {
    // Load the reference image
    $('#srcImg').attr('src', $('#imgPath').val()).load(function () {
       // alert('loaded' + this.width);
    });
};

var getColor = function (tX, tY, src) {

    tX = Math.floor(tX);
    tY = Math.floor(tY);

    var index = ((tX * 4) + ((tY * 4) * src.width));

    var tr = src.data[index];
    var tg = src.data[1 + index];
    var tb = src.data[2 + index];
    var ta = src.data[3 + index];
    // score this
    var ts = tr + tg + tb + ta;
    return { r: tr, g: tg, b: tb, a: ta, score: ts };
};

var initWorms = function (numberOfWorms, maxWidth, maxHeight) {

    for (var i = 0; i < numberOfWorms; i++) {
        var tx = Math.floor(Math.random() * maxWidth);
        var ty = Math.floor(Math.random() * maxHeight);

        // assign a random vector to begin with
        var angle = Math.random() * 2 * Math.PI;

        // x and y and a vector (direction).
        // Unit circle is the cos(0), sin(0)
        // To convert radians to degrees, divide by 2*PI and multiply by 360 or ( * Math.PI/180)
        worms[i] = newWorm(i, tx, ty, angle);
    }
};

// return the object back to the chained call flow
var goWorms = function () {

    gCanvas = document.createElement('canvas');

    if (gCanvas.getContext) {
        // canvas is supported
        $('#srcImg').attr('src', '');

       // New Cross-Origin support for Img
        //$('#srcImg').attr('crossOrigin', '');

        // load the source image into an img tag
        var Img_source = $('#imgPath').val();

        $('#srcImg').attr('src', Img_source).load(function () {

            initialNumWorms = $('#initWorms').val();
            maxWorms = $('#maxWorms').val();

            var width = this.width;
            var height = this.height;

            gCanvas.id = "outputCanvas";
            gCanvas.width = width;
            gCanvas.height = height;
            gCanvas.setAttribute('width', width);
            gCanvas.setAttribute('height', height);

            // Setup the source Image for reference in drawing
            srcImg = document.getElementById('srcImg');

            srcImgCanvas = document.createElement("canvas");
            srcImgCanvas.setAttribute('width', srcImg.width);
            srcImgCanvas.setAttribute('height', srcImg.height);

            srcImgCtx = srcImgCanvas.getContext("2d");
            // draw the source image to the canvas, just to see what it's getting



                    // draw the image to the canvas
                    srcImgCtx.drawImage(srcImg, 0, 0);

                    // get and store the source image data for reference later
                    srcImgData = srcImgCtx.getImageData(0, 0, srcImg.width, srcImg.height);

                    initWorms(initialNumWorms, gCanvas.width, gCanvas.height);

                    globalCtx = gCanvas.getContext("2d");
                    globalCtx.drawImage(srcImg, 0, 0);

                   // Draw a rectangle on canvas for some contrast
                    globalCtx.fillStyle = $('#bgColor').val();
                    globalCtx.fillRect(0, 0, srcImgData.width, srcImgData.height);

                    setTimeout(draw, 1);

                    $('#output').html('');
                    $('#output').append(gCanvas);

        });
    } else {
        // canvas not supported
    }
};
