const togglePlay = (audioElement) => {
    console.log(audioElement, audioElement);
    return audioElement.paused ? audioElement.play() : audioElement.pause();
};

function startup() {
    const el = document.getElementById("play-block");
    const player = document.getElementById("player");

    el.addEventListener("touchstart", handleStart);
    el.addEventListener("touchend", function (evt) {
        handleEnd(evt);
        togglePlay(player);
        return;
    });
    el.addEventListener("touchcancel", handleCancel);
    el.addEventListener("touchmove", handleMove);
    log("Initialized.");
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

