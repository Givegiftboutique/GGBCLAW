(function () {
function getPath(source, key) {
  return String(key).split(".").reduce((current, part) => current?.[part], source);
}

function t(key, fallback = key) {
  const value = getPath(window.OpenClawZhHantStrings || {}, key);
  return typeof value === "string" ? value : fallback;
}

window.OpenClawI18n = { t };
})();
