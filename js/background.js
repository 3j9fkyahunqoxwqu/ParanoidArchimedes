
//TODO: check incognito
//      Storage
//   -->add more options to popup
//      subdomain issue?
//      future: add some stats
//      replace array with set
"use strict";

// set running state to true
chrome.storage.local.set({"running": true, "keep_list": []});
var isRunning = true;

//popup
chrome.browserAction.onClicked.addListener(() => { chrome.tabs.create({url: chrome.extension.getURL('bubbleUp.html'), 'active': true}); });
//sendResponse({reply: "gotcha"});
//pause or resume?
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => { isRunning = (request.command == "pause" ? false : request.command == "resume" ? true : null); });
chrome.tabs.onRemoved.addListener(() => isRunning ? getTabs() : null );

function getTabs(){
  chrome.tabs.query({}, tabs => 
    tabs != null ? chrome.storage.local.get(["keep_list"], value => 
      removeCookies(Array.prototype.map.call(tabs, tab => trimURL(new URL(tab.url), true)).concat(value["keep_list"])))
    : null);
}

function removeCookies(tabURLs){
  tabURLs != null ? chrome.cookies.getAll({}, cookies => {
    //cookie belongs to any open tabs? true => keep : false => remove
    cookies != null ? Array.prototype.map.call(cookies, cookie => {
      //too cruel? welcome to my bubble!
      !Array.prototype.includes.call(tabURLs, trimURL(new URL('http://' + cookie.domain), true)) ? // &&  
        chrome.cookies.remove({url: isSecure(cookie) + trimURL(new URL('http://' + cookie.domain), false) + cookie.path ,name: cookie.name}) 
      : console.log("Will not remove --> " + cookie.domain);
    }) : null;
  }) : null;
}

function isSecure(cookie){
  //doesn't allow remove secure cookie with http, it's too smart!
  return cookie.secure ? 'https://' : 'http://';
}

function trimURL(url, sliceWWW){
  //sliceWWW flag --> trim or no trim
  return isSubstring(url, 'www.') && sliceWWW ? url.hostname.split('www.')[1] : url.hostname.startsWith('.') ? url.hostname.slice(1) : url.hostname;
}

function isSubstring(string, subString){
  return String.prototype.includes.call(string, subString) ? true : false;
}

