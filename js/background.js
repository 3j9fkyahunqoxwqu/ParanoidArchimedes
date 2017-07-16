
//TODO: check incognito
//      Storage
//   -->add more options to popup
//   -->subdomain issue?
//      future: add some stats
//      replace array with set
"use strict";

// set running state to true
chrome.storage.local.set({"running": true, "keep_list": [], "keep_subdomains": false});
var isRunning = true;

//popup
chrome.browserAction.onClicked.addListener(() => { chrome.tabs.create({url: chrome.extension.getURL('bubbleUp.html'), 'active': true}); });
//sendResponse({reply: "gotcha"});
//pause or resume?
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => { isRunning = (request.command == "pause" ? false : request.command == "resume" ? true : null); });
chrome.tabs.onRemoved.addListener(() => isRunning ? getTabs() : null );

function getTabs(){
  chrome.tabs.query({}, tabs => 
    tabs != null ? chrome.storage.local.get(["keep_list", "keep_subdomains"], value => 
      removeCookies(Array.prototype.map.call(tabs, tab => trimURL(new URL(tab.url), true)).concat(value["keep_list"]), value["keep_subdomains"]))
    : null);
}

function removeCookies(tabURLs, keepSubdomain){
  tabURLs != null ? chrome.cookies.getAll({}, cookies => {
    //cookie belongs to any open tabs? true => keep : false => remove
    cookies != null ? Array.prototype.map.call(cookies, cookie => {
      isUseless(tabURLs, cookie.domain, keepSubdomain) ?
      chrome.cookies.remove({url: isSecure(cookie) + trimURL(new URL('http://' + cookie.domain), false) + cookie.path ,name: cookie.name}) 
      : console.log("Will not remove --> " + cookie.domain);
    }) : null;
  }) : null;
}

function isUseless(urls, cookieDomain, keepSubdomain){
  return !isIn(urls, trimURL(new URL('http://' + cookieDomain), true)) ? 
            (keepSubdomain && Array.prototype.filter.call(urls, url => isIn(cookieDomain, url)).length > 0 ? false : true)
          : false;
}

function isSecure(cookie){
  //doesn't allow remove secure cookie with http, it's too smart!
  return cookie.secure ? 'https://' : 'http://';
}

function trimURL(url, sliceWWW){
  //sliceWWW flag --> trim or no trim
  return isIn(url, 'www.') && sliceWWW ? url.hostname.split('www.')[1] : url.hostname.startsWith('.') ? url.hostname.slice(1) : url.hostname;
}

// gets string or Array
function isIn(string, subString){
  return String.prototype.includes.call(string, subString) ? true : false;
}

