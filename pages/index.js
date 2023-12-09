const togglePlay = (audioElement) => {
    return audioElement.paused ? audioElement.play() : audioElement.pause();
};

const backward = (audioElement) => {
    audioElement.currentTime -= 5;
    if (audioElement.currentTime <= 0.00001) {
        audioElement.currentTime = audioElement.duration - 2;
    }
};

const forward = (audioElement) => {
    audioElement.currentTime += 5;

    if (audioElement.currentTime >= audioElement.duration - 0.2) {
        audioElement.currentTime = 0;
    }
};

const NUM_OSC = 24;

const isElementControlType = (el, type) => el.classList.contains(type);

const renderControls = () => {
    const oscList = document.querySelector('#osc-item-list');
    const oscItemTemplate = document.querySelector('#osc-item-template');
    Array(NUM_OSC).fill(0).map((_, i) => {
        let li = oscItemTemplate.content.cloneNode(true).querySelector('li');
        li.dataset.oscIndex = i;
        oscList.append(li);
    });
};

const getOscItemByIndex = (n) => {
    return document.querySelector(`.osc-item[data-osc-index="${n}"]`);
}

function startup() {
    renderControls();
    const rhizomeClient = new rhizome.Client()
    const oscApp = document.querySelector("#osc-app");

    rhizomeClient.start(function (err) {
        if (err) {
            $('body').html('client failed starting : ' + err)
            throw err
        }

        rhizomeClient.send('/sys/subscribe', ['/'])
    })

    rhizomeClient.on('message', function (address, args) {
        if (address === "/zoom") {
            document.body.style.zoom = args[0];
        } else if (address === "/scrool_x") {
            oscApp.scrollTo({
                left: args[0] * (oscApp.scrollWidth - oscApp.clientWidth),
                behavior: "smooth"
            });
        } else if (address === "/scrool_y") {
            window.scrollTo({
                top: args[0] * (document.documentElement.scrollHeight - document.documentElement.clientHeight),
                behavior: "smooth"
            });
        } else if (address === "/rotate") {
            const ratateDeg = `${args[1]}deg`;
            const oscItem = getOscItemByIndex(args[0]);
            oscItem.style.transform = `rotate(${ratateDeg})`;
        } else if (address === "/spin") {
            const oscItem = getOscItemByIndex(args[0]);
            if (args[1] === null || args[1] === undefined) {
                oscItem.classList.remove("spin-element");
            } else {
                oscItem.classList.add("spin-element");
                oscItem.style["animation-duration"] = `${args[1]}s`;
            }
        } else if (address === "/zoom_item") {
            const oscItem = getOscItemByIndex(args[0]);
            oscItem.style.zoom = args[1];
        } else if (address === "/scrool_xy") {
            oscApp.scrollTo({
                left: args[0] * (oscApp.scrollWidth - oscApp.clientWidth),
                behavior: "smooth"
            });
            window.scrollTo({
                top: args[1] * (document.documentElement.scrollHeight - document.documentElement.clientHeight),
                behavior: "smooth"
            });
        };
    });


    const controls = document.querySelectorAll("#osc-item-list input");

    const controlListener = (event) => {
        const target = event.target;
        const index = target.parentElement.dataset.oscIndex;
        const val = event.target.value;
        if (isElementControlType(target, "amp-slide")) {
            rhizomeClient.send('/set_amp', [index, val]);
        } else {
            rhizomeClient.send('/set_freq', [index, val]);
        }
    };

    controls.forEach(input => input.addEventListener('input', controlListener));

    const el = document.getElementById("play-block");
    const player = document.getElementById("player");

    if (el != null) {
        el.addEventListener("touchstart", handleStart);
        el.addEventListener("touchend", function (evt) {
            const target = evt.target;
            handleEnd(evt);

            if (isElementControlType(target, "play")) {
                togglePlay(player);
            } else if (isElementControlType(target, "backward")) {
                backward(player);
            } else if (isElementControlType(target, "forward")) {
                forward(player);
            }
            return;
        });
        el.addEventListener("touchcancel", handleCancel);
        el.addEventListener("touchmove", handleMove);
        log("Initialized.");
    }
}

document.addEventListener("DOMContentLoaded", startup);

const ongoingTouches = [];

function handleStart(evt) {
    log("touch start before prevent default");
    evt.preventDefault();
    log("touchstart.");
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
        log(`touchstart: ${i}.`);
        ongoingTouches.push(copyTouch(touches[i]));
        const color = colorForTouch(touches[i]);
        log(`color of touch with id ${touches[i].identifier} = ${color}`);
    }
}

function handleMove(evt) {
    evt.preventDefault();
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
        const color = colorForTouch(touches[i]);
        const idx = ongoingTouchIndexById(touches[i].identifier);

        if (idx >= 0) {
            log(`continuing touch ${idx}`);
            log(
                `ctx.moveTo( ${ongoingTouches[idx].pageX}, ${ongoingTouches[idx].pageY} );`,
            );
            log(`ctx.lineTo( ${touches[i].pageX}, ${touches[i].pageY} );`);

            ongoingTouches.splice(idx, 1, copyTouch(touches[i])); // swap in the new touch record
        } else {
            log("can't figure out which touch to continue");
        }
    }
}

function handleEnd(evt) {
    evt.preventDefault();
    log("touchend");
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
        const color = colorForTouch(touches[i]);
        let idx = ongoingTouchIndexById(touches[i].identifier);

        if (idx >= 0) {
            ongoingTouches.splice(idx, 1); // remove it; we're done
        } else {
            log("can't figure out which touch to end");
        }
    }
}

function handleCancel(evt) {
    evt.preventDefault();
    log("touchcancel.");
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
        let idx = ongoingTouchIndexById(touches[i].identifier);
        ongoingTouches.splice(idx, 1); // remove it; we're done
    }
}

function colorForTouch(touch) {
    let r = touch.identifier % 16;
    let g = Math.floor(touch.identifier / 3) % 16;
    let b = Math.floor(touch.identifier / 7) % 16;
    r = r.toString(16); // make it a hex digit
    g = g.toString(16); // make it a hex digit
    b = b.toString(16); // make it a hex digit
    const color = `#${r}${g}${b}`;
    return color;
}

function copyTouch({ identifier, pageX, pageY }) {
    return { identifier, pageX, pageY };
}

function ongoingTouchIndexById(idToFind) {
    for (let i = 0; i < ongoingTouches.length; i++) {
        const id = ongoingTouches[i].identifier;

        if (id === idToFind) {
            return i;
        }
    }
    return -1; // not found
}

function log(msg) {
    const container = document.getElementById("log");
    container.textContent = `${msg} \n${container.textContent}`;
}


// osc
