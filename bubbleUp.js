
"use strict";

window.addEventListener('load', function() {
    chrome.storage.local.get(["running"], value => document.getElementById('control-button').innerText = (value['running'] ? "Pause" : "Resume Paranoia"));
    document.getElementById('control-button').addEventListener('click', function() {
        // true means running
        chrome.storage.local.get(["running"], value => value['running'] ? pause() : resume());
    });
});

function pause(){
    chrome.runtime.sendMessage({command: "pause"});
    document.getElementById('control-button').innerText = "Resume Paranoia";
    saveCurrentState(false)
}

function resume(){
    chrome.runtime.sendMessage({command: "resume"});
    document.getElementById('control-button').innerText = "Pause";
    saveCurrentState(true)
}

function saveCurrentState(state){
    //check if state is true or false
    [true, false].indexOf(state) > -1
    ? chrome.storage.local.set({"running": state})
    : null; 
}
