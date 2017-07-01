
//TODO: check incognito
//      Storage

chrome.browserAction.onClicked.addListener(function(){getTabs();});
chrome.tabs.onRemoved.addListener(function(){getTabs();});

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
      !Array.prototype.includes.call(tabURLs, trimURL(new URL('http://' + cookie.domain), true)) ? chrome.cookies.remove({url: isSecure(cookie) + trimURL(new URL('http://' + cookie.domain), false) + cookie.path ,name: cookie.name}) 
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

