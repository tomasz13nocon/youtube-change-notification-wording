// ==UserScript==
// @name         Change notification wording
// @namespace    https://github.com/tomasz13nocon
// @version      1.1
// @description  Replace sentence-like wording from yt notifications with predictable, readable-at-a-glance text.
// @author       Tomasz Nocoń
// @match        https://www.youtube.com/*
// @grant        none
// @homepageURL  https://github.com/tomasz13nocon/youtube-change-notification-wording
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const langs = {
        pl: {
            video: /Na kanał (?<channel>.*?) został przesłany film (?<title>.*)/,
            // Youtube goes crazy when the notification text gets changed,
            // and adds text from different notifications to existing notification elements.
            // The span stuff works around that.
            live: /(?:.*<\/span>)*(?<channel>.*?) nadaje: (?<title>.*)/,
            premiere: /Na kanale (?<channel>.*?) trwa premiera filmu: (?<title>.*)/,
        },
        en: {
            video: /(?<channel>.*?) uploaded: (?<title>.*)/,
            live: /(?:.*<\/span>)*(?<channel>.*?) is live: (?<title>.*)/,
            premiere: /(?<channel>.*?) premiering now: (?<title>.*)/,
        },
    };

    let siteLang;

    document.head.insertAdjacentHTML("beforeend",
`<style>
.notif-wording_channel-name {
    color: var(--yt-spec-text-primary);
}
html[dark="true"] .notif-wording_channel-name {
    color: #99a;
}
</style>`);

    function main(list) {
        let weMutatedDom = false;
        let styleObserverActive = false;

        new MutationObserver((mutations, observer) => {
            if (weMutatedDom) {
                weMutatedDom = false;
                return;
            }

            let elList = list.querySelectorAll(".message.ytd-notification-renderer");

            // The changes we make to notification wording mess up youtube's proccessing of them
            // that happens when the notification drop down gets reopened, scrolled down or a new notification gets added.
            // To remedy this we need to watch for when the drop down gets hidden and revert all our changes.
            if (!styleObserverActive) {
                // let listHtml = list.querySelector("#items").innerHTML;
                let listWrapper = list.querySelector("tp-yt-iron-dropdown");
                new MutationObserver((mutations, observer) => {
                    console.log("style mutation");
                    if (listWrapper.style.display === "none") {
                        // Surprisingly  removing the HTML works.
                        // When the drop down reopens youtube figures everything out and fills it with notifications.
                        list.querySelector("#items").innerHTML = "";
                        styleObserverActive = false;
                        observer.disconnect();
                    }
                }).observe(listWrapper, { attributes: true, attributeFilter: ["style"] });
                styleObserverActive = true;
            }

            for (let el of elList) {
                weMutatedDom = true;

                // Figure out the language being used
                if (!siteLang) {
                    for (let [langName, lang] of Object.entries(langs)) {
                        if (Object.values(lang).some(re => re.test(el.innerHTML)))
                            siteLang = langName;
                    }
                }

                el.innerHTML = el.innerHTML.replace(langs[siteLang].video,    `<span><strong class="notif-wording_channel-name">$<channel></strong>: $<title></span>`);
                el.innerHTML = el.innerHTML.replace(langs[siteLang].live,     `<span>🔴 <strong class="notif-wording_channel-name">$<channel></strong>: $<title></span>`);
                el.innerHTML = el.innerHTML.replace(langs[siteLang].premiere, `<span>🎦 <strong class="notif-wording_channel-name">$<channel></strong>: $<title></span>`); // Alternative emojis: 🗓️📹

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
