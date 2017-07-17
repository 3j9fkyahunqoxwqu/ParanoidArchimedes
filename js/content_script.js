

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
        