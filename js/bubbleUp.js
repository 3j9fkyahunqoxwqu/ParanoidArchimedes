
"use strict";

window.addEventListener('load', () => {
    //get current state from storage
    chrome.storage.local.get(["running", "keep_list", "keep_subdomains", "disable_google_redirect", "remove_referer"], value => {
        //running? 
        document.getElementById('control-button').innerText = (value['running'] ? "Pause" : "Resume Paranoia");
        //keep cookie list?
        value["keep_list"] != null ? chrome.tabs.query({active: true, currentWindow: true}, tabs => tabs != null ? 
            (document.getElementById('keep-this-domain').checked = (value['keep_list'].indexOf(trimURL(new URL(tabs[0].url))) > -1 ? true : false ),
            document.getElementById('keep-cookie').innerText = trimURL(new URL(tabs[0].url)))
            : null) 
        : null;
        //keep subdomains?
        value["keep_subdomains"] != null ? document.getElementById('keep-subdomains').checked = value["keep_subdomains"] : null;
        //disable google redirect?
        value["disable_google_redirect"] != null ? document.getElementById('disable-google-redirect').checked = value["disable_google_redirect"] : null;
        //remove referer header?
        value["remove_referer"] != null ? document.getElementById('remove-referer').checked = value["remove_referer"] : null;
    });
        
    //get stats
    chrome.storage.local.get(["stats"], value => value["stats"] != null && Object.keys(value["stats"]).length > 0 ?
        chrome.tabs.query({active: true, currentWindow: true}, tabs => tabs != null ?
            (document.getElementById('deleted-domain').innerText = trimURL(new URL(tabs[0].url)),
                (value["stats"][trimURL(new URL(tabs[0].url))] != undefined ?
                    document.getElementById('num-delete-this-domain').innerText = value["stats"][trimURL(new URL(tabs[0].url))] + " or " + Math.trunc(value["stats"][trimURL(new URL(tabs[0].url))]*100 / Object.values(value["stats"]).reduce((a, b) => a + b)) + "%"
                    : null),
            document.getElementById('num-delete-overall').innerText = Object.values(value["stats"]).reduce((a, b) => a + b)
            ) : null)
        : chrome.tabs.query({active: true, currentWindow: true}, tabs => tabs != null ? 
            document.getElementById('deleted-domain').innerText = trimURL(new URL(tabs[0].url))
            : null));

    //eventlisteners
    // true --> it's running
    document.getElementById('control-button').addEventListener('click', () => chrome.storage.local.get(["running"], value => controlCommand("control", value["running"])));
    // click --> save all settings into storage
    document.getElementById('save-settings-button').addEventListener('click', () => (saveSettings(), document.getElementById('save-settings-button').disabled = true));
    //if checked true --> add domain to keep_list, else remove it
    document.getElementById('keep-this-domain').addEventListener('change', (e) => 
        chrome.tabs.query({active: true, currentWindow: true}, tabs => 
            saveToStorage("keep_list", trimURL(new URL(tabs[0].url)), true, e.target.checked)));
    //grey out button if settings changed
    Array.prototype.map.call(document.getElementsByClassName('setting'), checkbox => checkbox.addEventListener('change', () => document.getElementById('save-settings-button').disabled = false)); 

});

//save settings to storage
function saveSettings() {
    //if checked true --> keep subdomain cookies
    saveToStorage("keep_subdomains", document.getElementById('keep-subdomains').checked, false, false);  
    //if checked true --> disable Google redirect
    saveToStorage("disable_google_redirect", document.getElementById('disable-google-redirect').checked, false, false); 
    //if checked true --> remove referer
    saveToStorage("remove_referer", document.getElementById('remove-referer').checked, false, false);
    controlCommand("settings");
}

//messages => {command: pause/resume}
function controlCommand(type, pauseSwitch) {
    type === "control" ? 
    (pauseSwitch ? chrome.runtime.sendMessage({command: "pause"}) : chrome.runtime.sendMessage({command: "resume"}),
    document.getElementById('control-button').innerText = (pauseSwitch ? "Resume Paranoia" : "Pause" ),
    saveToStorage("running", !pauseSwitch, false, true)
    ) : null;
    type === "settings" ? chrome.runtime.sendMessage({command: "refreshSettings"}) : null;
}

//storage => {keep_list: [list of tab numbers we'd like to keep their cookies], running: true -> working/false --> paused}
function saveToStorage(key, value, isArray, append){
    key != null && value != null ? 
        (isArray ? 
            (chrome.storage.local.get([key], val => (append ? 
                val[key].push(value) 
                : val[key].splice(val[key].indexOf(value), 1), chrome.storage.local.set({[key]: val[key]}))))
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
