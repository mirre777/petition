var canvas = document.getElementById('canvas');
var ctxCanvas = canvas.getContext('2d');


console.log('connected');

ctxCanvas.beginPath();
ctxCanvas.strokeStyle = 'black';

$(canvas).on('mousedown', function (e){
    if (e.target === canvas) {
        ctxCanvas.moveTo(e.offsetX, e.offsetY);
        $(document).on('mousemove', function(e) {
            e.preventDefault();
            ctxCanvas.lineTo(e.offsetX, e.offsetY);
            ctxCanvas.stroke();
            console.log(e.offsetX, e.offsetY);
        });
        $(document).on('mouseup', function(e) {
            $(document).off('mousemove');
            $(document).off('mouseup');
            var sigvalue = canvas.toDataURL();
            $('#signaturehidden').val(sigvalue);
            console.log(sigvalue);
        });
    }
});


//Raindrops snippet from codepen__________________________________________________
// number of drops created.
var nbDrop = 300;
// function to generate a random number range.
function randRange( minNum, maxNum) {
    return (Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
}
// function to generate drops
function createRain() {

    for( var i=1;i<nbDrop;i++) {
        var dropLeft = randRange(0,2000);
        var dropTop = randRange(-1000,1400);

        $('.rain').append('<div class="drop" id="drop'+i+'"></div>');
        $('#drop'+i).css('left',dropLeft);
        $('#drop'+i).css('top',dropTop);
    }

}
// Make it rain
createRain();
