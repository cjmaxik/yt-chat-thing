/**
 * Original script by Gabriel Porto
 * @link https://github.com/gsporto/yt-chat-thing
 */

const hostname = window.location.hostname;
const user = window.location.pathname.split("/")[1];
const proxies = [
    "https://corsproxy.io/?",
    "https://api.codetabs.com/v1/proxy/?quest=",
    "https://api.allorigins.win/get?url=",
];

/**
 * Get the liveId of a youtube channel
 * @param {string} handle - The handle of the channel
 * @returns {Promise<{ liveId: string }>} - The liveId of the channel
 */
async function getLiveId(handle, index = 0) {
    try {
        if (index >= proxies.length) return { liveId: null };
        const html = await fetch(
            `${proxies[index]}${encodeURIComponent(
                `https://www.youtube.com/${handle}/live`
            )}`
        ).then(async (v) => {
            const contentType = v.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const json = await v.json();
                return json.contents;
            } else {
                return v.text();
            }
        });

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const linkElement = doc.querySelector('link[rel="canonical"]');
        const url = linkElement.getAttribute("href");
        const videoIdMatch = url.match(/v=([^&]+)/);

        if (!videoIdMatch?.[1]) {
            throw new Error("No video id found");
        }

        return { liveId: videoIdMatch[1] };
    } catch (error) {
        return getLiveId(handle, index + 1);
    }
}

/**
 * Setup the chat iframe
 */
async function setupChat() {
    const { liveId } = await getLiveId(user);
    if (!liveId) return false;

    const url = `https://www.youtube.com/live_chat?v=${liveId}&is_popout=1`;
    window.location.href = url;
}

/**
 * Setup the no user template
 */
function setupNoUser() {
    const noUserTemplate = document.getElementById("no-user-template");
    if (!noUserTemplate) return;
    document.body.appendChild(noUserTemplate.content.cloneNode(true));
}

/**
 * Setup the no live template
 */
function setupNoLive() {
    const noLiveTemplate = document.getElementById("no-live-template");
    if (!noLiveTemplate) return;
    document.body.appendChild(noLiveTemplate.content.cloneNode(true));
}

async function setup() {
    if (!user) {
        setupNoUser();
        document.querySelector(".spinner").remove();
        return;
    }

    const success = await setupChat();
    if (!success) {
        setupNoLive();
        document.querySelector(".spinner").remove();
    }
}

setup();
