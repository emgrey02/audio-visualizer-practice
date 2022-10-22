//The App
var app = new PIXI.Application({
    width: 800,
    height: 800,
    backgroundColor: 0xffffff
});
var stage = app.stage;
var view = app.view;

//Add view to the document
document.body.appendChild(app.view);

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

window.addEventListener('click', () => {
  // check if context is in suspended state (autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}, false);

//get audio elemnt
const audioElement = document.querySelector("audio");
//get source, call it track
const track = audioCtx.createMediaElementSource(audioElement);
//create analyser (yeah, british spelling)
const analyser = audioCtx.createAnalyser();
// making connections so is track --> analyser --> speakers
track.connect(analyser);
analyser.connect(audioCtx.destination);

//set fft (any num power of 2)
analyser.fftSize = 128;
//get buggerlength - half of fft. it's the num of datapoints we're collecting
const bufferLength = analyser.frequencyBinCount;
//create array to hold these datapoints
const dataArray = new Uint8Array(bufferLength);

let circle = new PIXI.Graphics();
stage.addChild(circle);

let color = 0x000000;

let makeColorSelection = () => {
    let colors = [];

    let colorGrid = new PIXI.Container();
    colorGrid.position.set(0, 100);
    colorGrid.interactive = true;

    let color1 = new PIXI.Graphics();
    color1.interactive = true;
    color1.beginFill(0xf502cd);
    color1.drawRect(0, 0, 60, 60);
    colorGrid.addChild(color1);
    colors.push(color1);

    let color2 = new PIXI.Graphics();
    color2.interactive = true;
    color2.beginFill(0x382e91);
    color2.drawRect(60, 0, 60, 60);
    colorGrid.addChild(color2);
    colors.push(color2);

    let color3 = new PIXI.Graphics();
    color3.interactive = true;
    color3.beginFill(0x36F5E2);
    color3.drawRect(120, 0, 60, 60);
    colorGrid.addChild(color3);
    colors.push(color3);

    let color4 = new PIXI.Graphics();
    color4.interactive = true;
    color4.beginFill(0xFF8F7D);
    color4.drawRect(0, 60, 60, 60);
    colorGrid.addChild(color4);
    colors.push(color4);

    let color5 = new PIXI.Graphics();
    color5.interactive = true;
    color5.beginFill(0xBD6ADF);
    color5.drawRect(60, 60, 60, 60);
    colorGrid.addChild(color5);
    colors.push(color5);

    let color6 = new PIXI.Graphics();
    color6.interactive = true;
    color6.beginFill(0xCAD7FA);
    color6.drawRect(120, 60, 60, 60);
    colorGrid.addChild(color6);
    colors.push(color6);

    colors.forEach(colorBlock => {
        colorBlock.on('pointerdown', (e) => {
            color = e.target.fill.color;
        })
    })

    return colorGrid;
}
let colors = makeColorSelection();
stage.addChild(colors);

function makeColorSlider() {
    // create container
    let ourButton = new PIXI.Container();
    ourButton.interactive = true;
    
    //value from 0.0 to 1.0
    ourButton.value = 0.0;

    // the track
    let theTrack = new PIXI.Graphics();
    theTrack.beginFill(0xCCCCCC);
    theTrack.drawRect(0, -10, 300, 20);
    ourButton.addChild(theTrack);

    // the slide
    let theSlide = new PIXI.Graphics();
    theSlide.interactive = true;
    theSlide.beginFill(0xEEEEEE);
    theSlide.drawRect(-25, -25, 50, 50);

    ourButton.addChild(theSlide);

    theSlide.dragging = false;

    theSlide.on("pointerdown", (e) => {
        theSlide.dragging = true;
    });

    theSlide.on("pointermove", (e) => {
        if (theSlide.dragging) {
            let newX = e.data.global.x - ourButton.getGlobalPosition().x;
            let newY = e.data.global.y - ourButton.getGlobalPosition().y;

            if (newX > theTrack.width) newX = theTrack.width;
            if (newX < 0) newX = 0;

            ourButton.value = (newX * 0xffffff);
            theSlide.x = newX;
            let newHexVal = 0x000000 + ourButton.value
            color = newHexVal;
        }
    });
    
    theSlide.on("pointerup", (e) => {
        theSlide.dragging = false;
    })

    theSlide.on("pointerupoutside", (e) => {
        theSlide.dragging = false;
    })

    return ourButton;
}

// let slider = makeColorSlider();
// slider.position.set(100, 200);
// stage.addChild(slider);

let texture = PIXI.Texture.from('seventeen.jpg');
let verticesX = 8;
let verticesY = 8;
let plane = new PIXI.SimplePlane(texture, verticesX, verticesY);
plane.position.set(0, 0);
// stage.addChild(plane);

let createPlane = () => {
    const planeLoop = requestAnimationFrame(createPlane);
    analyser.getByteTimeDomainData(dataArray);

    stage.removeChild(plane);
    plane = new PIXI.SimplePlane(texture, verticesX, verticesY);
    plane.position.set(0, 0);
    stage.addChild(plane);

    const buffer = plane.geometry.getBuffer('aVertexPosition');
    
    for (let i = 0; i < buffer.data.length; i++) {
        buffer.data[i] += ((dataArray[i]));
    }
    buffer.update();
    
}

// createPlane();

let drawCircles = () => {
    const drawVisual = requestAnimationFrame(drawCircles);

    //retrieves data and copies it into our array
    analyser.getByteFrequencyData(dataArray);

    stage.removeChild(circle);
    circle = new PIXI.Graphics();
    stage.addChild(circle);

    for (let i = 0; i < bufferLength; i++) {
        circle.beginFill(color + (dataArray[i]));
        circle.drawCircle(view.width / 2, view.height / 2, dataArray[i]);
        circle.endFill();
    }
}

drawCircles();

let line;

let drawWave = () => {
    const drawVisual = requestAnimationFrame(drawWave);
    //retrieves data and copies it into our array
    analyser.getByteTimeDomainData(dataArray);

    if (line) {
        line.clear();
    }
    line = new PIXI.Graphics();
    line.lineStyle(2, 0x000000);
    
    stage.addChild(line);

    let sliceWidth = view.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * (app.view.height / 2);

        if (i === 0) {
            line.moveTo(x, y);
        } else {
            line.lineTo(x, y);
        }

        x += sliceWidth;
    }
    
}

drawWave();


