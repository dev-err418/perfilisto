const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.perfilisto.com") {
      url.hostname = "perfilisto.com";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
