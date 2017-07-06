
//TODO: check incognito
//      Storage
//   -->add more options to popup
//      subdomain issue?
//   -->keeping cookies of specific website
//   -->put each type in its own folder
//      future: add some stats
//      replace array with set
"use strict";

// set running state to true
chrome.storage.local.set({"running": true, "keep_list": []});
var isRunning = true;

chrome.browserAction.onClicked.addListener(function(tab){
  //popup
  chrome.tabs.create({url: chrome.extension.getURL('bubbleUp.html'), 'active': true});
});
//pause or resume
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    //sendResponse({reply: "gotcha"});
    //pause or resume?
    isRunning = (request.command == "pause" ? false : request.command == "resume" ? true : null);
  });
chrome.tabs.onRemoved.addListener(function(){
  //go ahead?   
  isRunning ? getTabs() : null;
});

function getTabs(){
  chrome.tabs.query({}, tabs => 
    tabs != null ? chrome.storage.local.get(["keep_list"], value => 
      removeCookies(Array.prototype.map.call(tabs, tab => trimURL(new URL(tab.url), true)).concat(value["keep_list"])))
    : null);
}

function removeCookies(tabURLs){
  tabURLs != null ? chrome.cookies.getAll({}, function(cookies) {
    //cookie belongs to any open tabs? true => keep : false => remove
    cookies != null ? Array.prototype.map.call(cookies, function(cookie){
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

