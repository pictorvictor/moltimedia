document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const saveButton = document.getElementById('saveButton');
    const scaleButton = document.getElementById('scaleButton');
    const scaleWidthInput = document.getElementById('scaleWidth');
    const scaleHeightInput = document.getElementById('scaleHeight');
    const applyEffectButton = document.getElementById('applyEffectButton');
    const deleteButton = document.getElementById('deleteButton');
    const textInput = document.getElementById('textInput');
    const textSizeInput = document.getElementById('textSizeInput');
    const textColorInput = document.getElementById('textColorInput');
    const addTextButton = document.getElementById('addTextButton');
    const textXInput = document.getElementById('textXInput');
    const textYInput = document.getElementById('textYInput');

    let image = new Image();
    let isDragging = false;
    let startX, startY = 0
    let endX, endY;
    let isShiftPressed = false;
    let imageFirstLoad = false;;

    fileInput.addEventListener('change', handleFileSelect);
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleFileDrop);
    saveButton.addEventListener('click', handleSaveButtonClick);
    scaleButton.addEventListener('click', handleScaleButtonClick);
    scaleWidthInput.addEventListener('input', handleScaleInputChange);
    scaleHeightInput.addEventListener('input', handleScaleInputChange);
    applyEffectButton.addEventListener('click', handleApplyEffectButtonClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    deleteButton.addEventListener('click', handleDeleteButtonClick);
    addTextButton.addEventListener('click', addTextToImage);

    function handleKeyDown(event) {
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            isShiftPressed = true;
        }
    }

    function handleKeyUp(event) {
        if (event.code === 'Space') {
            if (Math.abs(endX - startX) >= 10 && Math.abs(endY - startY) >= 10) {
                cropImage(startX, startY, endX, endY);
            }
        }
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            isShiftPressed = false;
        }
    }

    function handleFileSelect(event) {
        event.preventDefault();
        imageFirstLoad = true;
        const file = event.target.files[0];
        loadAndDrawImage(file);
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleFileDrop(event) {
        event.preventDefault();
        imageFirstLoad = true;
        const file = event.dataTransfer.files[0];
        loadAndDrawImage(file);
    }

    function loadAndDrawImage(file) {
        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                image.src = e.target.result;
                image.onload = () => {
                    canvas.width = image.width;
                    canvas.height = image.height;
                    ctx.drawImage(image, 0, 0);
                    startX = canvas.clientLeft
                    startY = canvas.clientTop
                    endX = image.width;
                    endY = image.height;
                    if (imageFirstLoad)
                        {
                            scaleHeightInput.value = image.height;
                            scaleWidthInput.value = image.width;
                            drawSelectionBox(0, 0, canvas.width, canvas.height, '#FFF', 2);
                            imageFirstLoad = false;
                        }
                };
            };

            reader.readAsDataURL(file);
        }
    }

    function handleSaveButtonClick() {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'result.png';
        a.click();
    }

    function handleScaleButtonClick() {
        const newWidth = parseInt(scaleWidthInput.value);
        const newHeight = parseInt(scaleHeightInput.value);

        if (!isNaN(newWidth) && !isNaN(newHeight)) {
            scaleImage(newWidth, newHeight);
        }
    }

    function handleScaleInputChange() {
        const aspectRatio = image.width / image.height;

        if (this.id === 'scaleWidth' && scaleHeightInput.value !== '') {
            const newWidth = parseInt(this.value) || 0;
            const newHeight = Math.round(newWidth / aspectRatio);
            scaleHeightInput.value = newHeight;
        } else if (this.id === 'scaleHeight' && scaleWidthInput.value !== '') {
            const newHeight = parseInt(this.value) || 0;
            const newWidth = Math.round(newHeight * aspectRatio);
            scaleWidthInput.value = newWidth;
        }
    }

    function scaleImage(newWidth, newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(image, 0, 0, newWidth, newHeight);
        const modifiedImageDataUrl = canvas.toDataURL('image/png');
        image.src = modifiedImageDataUrl;
    }

    function handleMouseDown(event) {
        isDragging = true;
        if (!isShiftPressed) {
            startX = event.clientX - canvas.offsetLeft;
            startY = event.clientY - canvas.offsetTop;
        }
    }

    function handleMouseMove(event) {
        if (isDragging) {
            endX = event.clientX - canvas.offsetLeft;
            endY = event.clientY - canvas.offsetTop;

            drawSelectionBox(startX, startY, endX, endY);
        }
    }

    function handleMouseUp() {
        endX = event.clientX - canvas.offsetLeft;
        endY = event.clientY - canvas.offsetTop;

        if (isDragging) {
            isDragging = false;
        }
    }

    function drawSelectionBox(startX, startY, endX, endY, borderColor = '#FFF', borderWidth = 2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;

        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    }

    function applyEffect(startX, startY, endX, endY) {
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        drawSelectionBox(startX, startY, endX, endY, 'rgba(0,0,0,0)', 0);

        const newCanvas = document.createElement('canvas');
        newCanvas.width = width;
        newCanvas.height = height;
        const newCtx = newCanvas.getContext('2d');
        newCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    
        const imageData = newCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
    
        for (let i = 0; i < data.length; i += 4) {
            const grayscale = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = grayscale; // red
            data[i + 1] = grayscale; // green
            data[i + 2] = grayscale; // blue
        }
    
        newCtx.putImageData(imageData, 0, 0);
        ctx.clearRect(x, y, width, height);
        ctx.drawImage(newCanvas, x, y);
        const modifiedImageDataUrl = canvas.toDataURL('image/png');
        image.src = modifiedImageDataUrl;
    }

    function cropImage(startX, startY, endX, endY) {
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        const imageData = ctx.getImageData(x, y, width, height);

        canvas.width = width;
        canvas.height = height;

        ctx.putImageData(imageData, 0, 0);
        scaleHeightInput.value = height;
        scaleWidthInput.value = width;
        const modifiedImageDataUrl = canvas.toDataURL('image/png');
        image.src = modifiedImageDataUrl;
    }

    function handleApplyEffectButtonClick() {
        applyEffect(startX, startY, endX, endY);
    }

    function handleDeleteButtonClick() {
        deletePixelsInSelection(startX, startY, endX, endY);
    }

    function deletePixelsInSelection(startX, startY, endX, endY) {
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        const imageData = ctx.getImageData(x, y, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255; // red
            data[i + 1] = 255; // green
            data[i + 2] = 255; // blue
        }

        ctx.putImageData(imageData, x, y);
        const modifiedImageDataUrl = canvas.toDataURL('image/png');
        image.src = modifiedImageDataUrl;
    }

    function addTextToImage() {
        const text = textInput.value;
        const textSize = parseInt(textSizeInput.value) || 20;
        const textColor = textColorInput.value;
    
        if (text) {
            ctx.font = `${textSize}px Arial`;
            ctx.fillStyle = textColor;
            let x = parseInt(textXInput.value);
            let y = parseInt(textYInput.value);

            if (isNaN(x) || x < 0) {
              x = canvas.width / 2;
            }
            if (isNaN(y) || y < 0) {
              y = canvas.height / 2;
            }

            ctx.fillText(text, x, y);
            const imageDataUrl = canvas.toDataURL('image/png');
            image.src = imageDataUrl;
        }
    }
});
