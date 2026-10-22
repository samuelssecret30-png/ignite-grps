if (navigator.userAgent.includes("Firefox")) {
	Object.defineProperty(globalThis, "crossOriginIsolated", {
		value: true,
		writable: false,
	});
}



importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

const CONFIG = {
	blocked: [
		"youtube.com/get_video_info?*adformat=*",
		.replace(/\*/g, "[^/]*")
		.replace(/{{DOUBLE_STAR}}/g, ".*");
	return new RegExp(`^${escaped}$`);
}

function isBlocked(hostname, pathname) {
	return CONFIG.blocked.some((pattern) => {
		if (pattern.startsWith("#")) {
			pattern = pattern.substring(1);
		}
		if (pattern.startsWith("*")) {
			pattern = pattern.substring(1);
		}

		if (pattern.includes("/")) {
			const [hostPattern, ...pathParts] = pattern.split("/");
			const pathPattern = pathParts.join("/");
			const hostRegex = toRegex(hostPattern);
			const pathRegex = toRegex(`/${pathPattern}`);
			return hostRegex.test(hostname) && pathRegex.test(pathname);
		}
		const hostRegex = toRegex(pattern);
		return hostRegex.test(hostname);
	});
}

async function handleRequest(event) {
	await scramjet.loadConfig();
	const requestUrl = new URL(event.request.url);
	if (
		requestUrl.hostname === "92.38.177.37" ||
		requestUrl.hostname === "cdn.jsdelivr.net"
	) {
		return fetch(event.request);
	}

	const forceScramjetRoute =
		requestUrl.origin === self.location.origin &&
		requestUrl.pathname.startsWith("/scramjet/");

	if (scramjet.route(event) || forceScramjetRoute) {
		const response = await scramjet.fetch(event);
		const contentType = response.headers.get("content-type") || "";

		if (contentType.includes("text/html")) {
			const originalText = await response.text();
			const encoder = new TextEncoder();
			const byteLength = encoder.encode(originalText).length;
			const newHeaders = new Headers(response.headers);
			newHeaders.set("content-length", byteLength.toString());

			return new Response(originalText, {
				status: response.status,
				statusText: response.statusText,
				headers: newHeaders,
			});
		}

		return response;
	}

	return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event));
});

self.addEventListener("message", ({ data }) => {
	if (data.type === "playgroundData") {
		playgroundData = data;
	}
});

scramjet.addEventListener("request", (e) => {
	if (isBlocked(e.url.hostname, e.url.pathname)) {
		e.response = new Response("Site Blocked", { status: 403 });
		return;
	}

	if (playgroundData && e.url.href.startsWith(playgroundData.origin)) {
		const routes = {
			"/": { content: playgroundData.html, type: "text/html" },
			"/style.css": { content: playgroundData.css, type: "text/css" },
			"/script.js": {
				content: playgroundData.js,
				type: "application/javascript",
			},
		};

		const route = routes[e.url.pathname];

		if (route) {
			let content = route.content;

			const headers = { "content-type": route.type };
			e.response = new Response(content, { headers });
			e.response.rawHeaders = headers;
			e.response.rawResponse = {
				body: e.response.body,
				headers: headers,
				status: e.response.status,
				statusText: e.response.statusText,
			};
			e.response.finalURL = e.url.toString();
		} else {
			e.response = new Response("empty response", { headers: {} });
		}
	}
});
