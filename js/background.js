
//TODO: check incognito
//      Storage
//   -->add more options to popup
//      replace array with set
//   -->disable twitter link redirect
//      add secure flag to all https

"use strict";

// initialize global settings from storage
chrome.storage.local.set({"running": true, "keep_list": [], "keep_subdomains": false, "disable_google_redirect": true, "disable_twitter_redirect": true, "remove_referer": true},);
chrome.storage.local.get(["stats"], value => value["stats"] == null ? chrome.storage.local.set({"stats": Object()}) : null)
var isRunning = true;
var keepSubdomains = false
var disableGoogleRedirect = true;
var disableTwitterRedirect = true;
var removeReferer = true;

const nuke_storage = `(async() => {
  try{
    localStorage.clear(); 
    sessionStorage.clear();  
    var dbname = await indexedDB.databases(); 
    for (let i of dbname) {
      let req = indexedDB.deleteDatabase(i['name']);
      req.onsuccess = function () { console.log("Paranoid delete database: Success"); };
      req.onerror = function () { console.log("Paranoid delete database: Error"); };
      req.onblocked = function () { console.log("Paranoid delete database: Blocked");};
    }
  } catch (err) {
    console.log(err.message)
  }
})();`;

//popup
chrome.browserAction.onClicked.addListener(() => { chrome.tabs.create({url: chrome.extension.getURL('bubbleUp.html'), 'active': true}); });
//communicating with popup --> pause/resume/refreshSettings
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
  isRunning = (request.command == "pause" ? false : request.command == "resume" ? true : null); 
  request.command == "refreshSettings" ? refreshSettings() : null;
});
//remove referer --> for now remove all referers --> check usability issues
chrome.webRequest.onBeforeSendHeaders.addListener( request => {
  isRunning && removeReferer ? 
    Array.prototype.map.call(request.requestHeaders, headerItem => headerItem.name == "Referer" ? 
      request.requestHeaders.splice(request.requestHeaders.indexOf(headerItem), 1) : null)
  : null;
  return {requestHeaders: request.requestHeaders};
}, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"] );

//pause or resume?
chrome.tabs.onRemoved.addListener(() => isRunning ? getTabs() : null );
//disable google redirect
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  isIn(tab.url, 'www.google.') && changeInfo.status === 'complete' && isRunning && disableGoogleRedirect ?
    chrome.tabs.executeScript({file: "js/content_script.js"})
    : null;
  isIn(tab.url, 'twitter.com') && changeInfo.status === 'complete' && isRunning && disableTwitterRedirect ?
    chrome.tabs.executeScript({file: "js/content_script.js"})
    : null;
});

function getTabs(){
  chrome.tabs.query({}, tabs => {
    tabs != null ? chrome.storage.local.get(["keep_list"], value => 
        removeCookies(Array.prototype.map.call(tabs, tab => trimURL(new URL(tab.url), true)).concat(value["keep_list"]), keepSubdomains, tabs))
    : null;
    })
}

function removeCookies(tabURLs, keepSubdomain, tabs){
  var stats_array = [];
  tabURLs != null ? 
    // remove stale cookies
    chrome.cookies.getAllCookieStores(storeIds => { Array.prototype.map.call(storeIds, sId => { 
      chrome.cookies.getAll({storeId: sId.id}, cookies => { 
        //cookie belongs to any open tabs? true => keep : false => remove
        cookies != null ? Array.prototype.map.call(cookies, cookie => { 
          isUseless(tabURLs, cookie.domain, keepSubdomain) ?
          ( isUseless(stats_array, cookie.domain, false) ? stats_array.push(trimURL(new URL('http://' + cookie.domain), true)) : null, 
          chrome.cookies.remove({url: isSecure(cookie) + trimURL(new URL('http://' + cookie.domain), false) + cookie.path ,name: cookie.name, storeId: sId.id}) )
          : console.log("Will not remove --> " + cookie.domain);
        }) : null;
      }) 
    }) }) : null;
    // storage
    if (tabURLs != null){
      for (let tab of tabs){
        chrome.webNavigation.getAllFrames({tabId: tab.id}, (frames) => {
          for (let frame of frames){
          //frames.forEach(frame => { 
            !isIn(new URL(frame.url).protocol, 'chrome') && new URL(frame.url).protocol != 'about:' ? 
              // note: keepsubdomain for frames is set to true
              (isUseless(tabURLs, new URL(frame.url).hostname, true) ? chrome.tabs.executeScript(tab.id, {code: nuke_storage, frameId: frame.frameId}, () =>{
                  // runtime.lastError
                  chrome.runtime.lastError !== undefined ? console.log(tab.id, tab.url, chrome.runtime.lastError.message) : null;
                }) : null)
            : null;
          }
        });
      }
    }
    // stats
    chrome.storage.local.get(["stats"], value => 
      Array.prototype.map.call(stats_array, domain => { 
        domain in value["stats"] ? value["stats"][domain]++ : value["stats"][domain] = 1;
        chrome.storage.local.set({"stats": value["stats"]});
      })
    );
}

function refreshSettings() {
  chrome.storage.local.get(["running", "keep_subdomains", "disable_google_redirect", "disable_twitter_redirect", "remove_referer"], value => 
  {
    isRunning = value["running"];
    keepSubdomains = value["keep_subdomains"];
    disableGoogleRedirect = value["disable_google_redirect"];
    disableTwitterRedirect = value["disable_twitter_redirect"];
    removeReferer = value["remove_referer"];
  })
}

function isUseless(urls, cookieDomain, keepSubdomain){
  return cookieDomain && !isIn(urls, trimURL(new URL('http://' + cookieDomain), true)) ? 
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

