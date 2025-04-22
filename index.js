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
 * Get the live ID of the user
 * @param {string} handle - The YouTube handle of the user
 * @param {number} index - The index of the proxy to use
 * @return {Promise<string|null>} - The live ID of the user (or null if not found)
 */
const getLiveId = async (handle, index = 0) => {
    try {
        if (index >= proxies.length) return null;
        const response = await fetch(
            `${proxies[index]}${encodeURIComponent(
                `https://www.youtube.com/${handle}/live`
            )}`
        );

        const contentType = response.headers.get("content-type");
        let html;

        if (contentType && contentType.includes("application/json")) {
            const json = await response.json();
            html = json.contents;
        } else {
            html = await response.text();
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const linkElement = doc.querySelector('link[rel="canonical"]');
        const url = linkElement.getAttribute("href");
        const videoIdMatch = url.match(/v=([^&]+)/);

        if (!videoIdMatch?.[1]) {
            throw new Error(`No video ID found for ${handle}`);
        }

        return videoIdMatch[1];
    } catch (error) {
        return getLiveId(handle, index + 1);
    }
};

/**
 * Setup the chat iframe
 */
const setupChat = async () => {
    const liveId = await getLiveId(user);
    if (!liveId) return false;

    const url = `https://www.youtube.com/live_chat?v=${liveId}&is_popout=1`;
    window.location.href = url;
};

const userMessage = (templateName) => {
    const template = document.getElementById(templateName);
    const templateContent = template.content.cloneNode(true);
    document.body.appendChild(templateContent);

    document.querySelector(".spinner").remove();
};

const main = async () => {
    if (!user) {
        userMessage("no-user-template");
        return;
    }

    const success = await setupChat();
    if (!success) {
        userMessage("no-live-template");
    }
};

main();
