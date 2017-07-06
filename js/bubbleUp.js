
"use strict";

window.addEventListener('load', function() {
    //get current state from storage
    chrome.storage.local.get(["running"], value => document.getElementById('control-button').innerText = (value['running'] ? "Pause" : "Resume Paranoia"));
    chrome.storage.local.get(["keep_list"], value => value["keep_list"] != null ? 
        chrome.tabs.query({active: true, currentWindow: true}, tabs => tabs != null ? 
            (document.getElementById('keep-this-domain').checked = (value['keep_list'].indexOf(trimURL(new URL(tabs[0].url))) > -1 ? true : false ),
            document.getElementById('keep_cookie').innerText = trimURL(new URL(tabs[0].url)))
        : null) 
    : null);
    
    //eventlisteners
    //if checked true --> add domain to keep_list, else remove it
    document.getElementById('keep-this-domain').addEventListener('change', (e) => 
        chrome.tabs.query({active: true, currentWindow: true}, tabs => 
            saveToStorage("keep_list", trimURL(new URL(tabs[0].url)), true, e.target.checked)));
    // true --> it's running
    document.getElementById('control-button').addEventListener('click', () => chrome.storage.local.get(["running"], value => controlCommand(value["running"])));
});

//messages => {command: pause/resume}
function controlCommand(pauseSwitch) {
    pauseSwitch ? chrome.runtime.sendMessage({command: "pause"}) : chrome.runtime.sendMessage({command: "resume"});
    document.getElementById('control-button').innerText = (pauseSwitch ? "Resume Paranoia" : "Pause" );
    saveToStorage("running", !pauseSwitch, false, true);
}

//storage => {keep_list: [list of tab numbers we'd like to keep their cookies], running: true -> working/false --> paused}
function saveToStorage(key, value, isArray, append){
    key != null && value != null ? 
        (isArray ? 
            (chrome.storage.local.get([key], val => (append ? 
                val[key].push(value) 
                : val[key].splice(val[key].indexOf(value), 1), 
            chrome.storage.local.set({[key]: val[key]}))))
            : chrome.storage.local.set({[key]: value})
        )
        : null; 
}

function trimURL(url){
  return isSubstring(url, 'www.') ? url.hostname.split('www.')[1] : url.hostname;
}

function isSubstring(string, subString){
  return String.prototype.includes.call(string, subString) ? true : false;
}
