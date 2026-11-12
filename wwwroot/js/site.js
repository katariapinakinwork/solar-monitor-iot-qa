// SolarMonitor IIoT — site.js
// Sets the last-updated timestamp on every page
(function () {
    'use strict';
    var el = document.getElementById('lastUpdated');
    if (el) {
        el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
})();
