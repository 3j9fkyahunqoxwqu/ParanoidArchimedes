
//TODO: check incognito
//      Storage
//      add more options to popup
//      maybe? keeping cookies of specific website
"use strict";

// set running state to true
chrome.storage.local.set({"running": true});
var isRunning = true;

chrome.browserAction.onClicked.addListener(function(tab){
  //popup
  chrome.tabs.create({url: chrome.extension.getURL('bubbleUp.html'), 'active': true});
});
//pause or resume
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    //sendResponse({reply: "gotcha"});
    //set isRunning to false or true
    isRunning = (request.command == "pause" ? false : request.command == "resume" ? true : null);
  });
chrome.tabs.onRemoved.addListener(function(){
  //go ahead?   
  isRunning ? getTabs() : null;
});



function getTabs(){
  chrome.tabs.query({}, function(tabs){
    tabs != null ? removeCookies(Array.prototype.map.call(tabs, function(tab) { 
      return trimURL(new URL(tab.url), true)
    })) : null;
  });
}

function removeCookies(tabURLs){
  tabURLs != null ? chrome.cookies.getAll({}, function(cookies) {
    cookies != null ? Array.prototype.map.call(cookies, function(cookie){
      //too cruel? welcome to my bubble!
      !Array.prototype.includes.call(tabURLs, trimURL(new URL('http://' + cookie.domain), true)) ? 
        chrome.cookies.remove({url: isSecure(cookie) + trimURL(new URL('http://' + cookie.domain), false) + cookie.path ,name: cookie.name}) 
      : null;
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

