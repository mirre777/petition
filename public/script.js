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
        });
    }
});
