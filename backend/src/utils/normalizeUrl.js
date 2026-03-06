function normalizeUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = "";
  const paramsToRemove = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "ref",
    "fbclid"
  ];
  paramsToRemove.forEach(param => {
    url.searchParams.delete(param);
  });
  return url.toString();
}

module.exports = normalizeUrl;
