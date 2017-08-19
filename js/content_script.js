
// google
(() => {
    var script = document.createElement('script');
    script.textContent = `document.addEventListener('DOMSubtreeModified', () => {
        Array.prototype.map.call(Array.prototype.filter.call(document.getElementsByTagName('a'), element => element.onmousedown), 
            element => { 
                console.log(element.href);
                element.removeAttribute('onmousedown')
            });
            });`;
    (document.body || document.documentElement).appendChild(script);
    script.remove();
})();

// twitter
(() => {
    var script = document.createElement('script');
    script.textContent = ` 
        document.addEventListener('DOMSubtreeModified', () => {
        if (document.location.href.indexOf('twitter.com') >= 0) {
            var all_links = document.querySelectorAll('a.twitter-timeline-link'); 
            for (i in all_links){
                if (typeof all_links[i].getAttribute === 'function'){
                    if (all_links[i].getAttribute('data-expanded-url') != null) {
                        all_links[i]['href'] = all_links[i].getAttribute('data-expanded-url');
                        }
                    }
                }
            }
        });`;
    (document.body || document.documentElement).appendChild(script);
    script.remove();
})();
 

