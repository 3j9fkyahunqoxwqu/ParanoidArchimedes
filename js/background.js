
//TODO: check incognito
//      Storage
//   -->add more options to popup
//   -->add some stats
//      replace array with set

"use strict";

// set running state to true
chrome.storage.local.set({"running": true, "keep_list": [], "keep_subdomains": false, "disable_google_redirect": true, "stats": Object()},);
var isRunning = true;

//popup
chrome.browserAction.onClicked.addListener(() => { chrome.tabs.create({url: chrome.extension.getURL('bubbleUp.html'), 'active': true}); });
//sendResponse({reply: "gotcha"});
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => { isRunning = (request.command == "pause" ? false : request.command == "resume" ? true : null); });
//pause or resume?
chrome.tabs.onRemoved.addListener(() => isRunning ? getTabs() : null );
//disable google redirect
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  isIn(tab.url, 'www.google.com') && changeInfo.status === 'complete' ?
  chrome.storage.local.get(["disable_google_redirect"], value => { 
    value["disable_google_redirect"] ? chrome.tabs.executeScript({file: "js/content_script.js"
  }) : null})
  : null;
});

function getTabs(){
  chrome.tabs.query({}, tabs => 
    tabs != null ? chrome.storage.local.get(["keep_list", "keep_subdomains"], value => 
      removeCookies(Array.prototype.map.call(tabs, tab => trimURL(new URL(tab.url), true)).concat(value["keep_list"]), value["keep_subdomains"]))
    : null);
}

function removeCookies(tabURLs, keepSubdomain){
  var stats_array = [];
  tabURLs != null ? chrome.cookies.getAll({}, cookies => {
    //cookie belongs to any open tabs? true => keep : false => remove
    cookies != null ? Array.prototype.map.call(cookies, cookie => {
      isUseless(tabURLs, cookie.domain, keepSubdomain) ?
      ( isUseless(stats_array, cookie.domain, false) ? stats_array.push(trimURL(new URL('http://' + cookie.domain), true)) : null,
      chrome.cookies.remove({url: isSecure(cookie) + trimURL(new URL('http://' + cookie.domain), false) + cookie.path ,name: cookie.name}) )
      : console.log("Will not remove --> " + cookie.domain);
    }) : null;
  }) : null;
  chrome.storage.local.get(["stats"], value => 
    Array.prototype.map.call(stats_array, domain => { 
      domain in value["stats"] ? value["stats"][domain]++ : value["stats"][domain] = 1;
      chrome.storage.local.set({"stats": value["stats"]});
    }));
  chrome.storage.local.get(["stats"], value => console.log(value["stats"])); 
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

