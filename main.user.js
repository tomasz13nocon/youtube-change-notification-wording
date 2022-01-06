// ==UserScript==
// @name         Change notification wording
// @namespace    https://github.com/tomasz13nocon
// @version      1.0
// @description  Remove sentence-like wording from yt notifications. Dependent on the specific wording, and therefore language, of the notification text. Currently only works with polish.
// @author       Tomasz Nocoń
// @match        https://www.youtube.com/*
// @grant        none
// @homepageURL  https://github.com/tomasz13nocon/youtube-change-notification-wording
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    function main(list) {
        /*let d = document.createElement("div");
        d.style = "color:white; position:fixed; top:0; right:600px; background:#111; z-index:5000; font-size:14px;";
        document.body.append(d);*/

        let weMutatedDom = false;

        new MutationObserver((mutations, observer) => {
            if (weMutatedDom) {
                weMutatedDom = false;
                return;
            }

            let elList = list.querySelectorAll(".message.ytd-notification-renderer");

            for (let el of elList) {
                let style = "color: #99a;";
                weMutatedDom = true;
                el.innerHTML = el.innerHTML.replace(/Na kanał (.*) został przesłany film(.*)/, `<span><strong style="${style}">$1</strong>:$2</span>`);
                el.innerHTML = el.innerHTML.replace(/(?:.*<\/span>)*(.*) nadaje:(.*)/,         `<span>🔴 <strong style="${style}">$1</strong>:$2</span>`); // The regex weirdness is a workaround for the same thing as the if statement below
                el.innerHTML = el.innerHTML.replace(/Na kanale (.*) trwa premiera filmu:(.*)/, `<span>🎦 <strong style="${style}">$1</strong>:$2</span>`); // Alternative emojis: 🗓️📹

                // Youtube goes crazy when the notification text gets changed, and adds text from different notifications to existing notification elements. This works around that.
                if (el.children.length > 1) {
                    el.firstElementChild.remove();
                }
            }
        }).observe(list, { childList: true, subtree: true });
    }

    let list = document.querySelector("ytd-popup-container");
    // Most of the time this element exists at the time this script executes, so we just call the main function
    if (list) {
        main(list);
    }
    // If it doesn't though, observe body for it to be added
    else {
        let observer = new MutationObserver(() => {
            list = document.querySelector("ytd-popup-container");
            if (list) {
                observer.disconnect();
                main(list);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

})();
