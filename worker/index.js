const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.perfilisto.com") {
      url.hostname = "perfilisto.com";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    const response = await env.ASSETS.fetch(request);
    if (
      url.pathname ===
        "/.well-known/apple-developer-merchantid-domain-association" &&
      response.ok
    ) {
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "application/octet-stream");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};

export default worker;
