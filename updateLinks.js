async function updateDownloadLinksAndTimesByIndex() {
  const apiUrl =
    "https://api.github.com/repos/weekdaycare/immortalwrt-mt7981-cudy-tr3000/releases";
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("GitHub API error: " + response.status);
    const releases = await response.json();

    const keys = ["256M", "128M", "128M_Ubootmod"];
    const latestReleases = {
      "256M": null,
      "128M": null,
      "128M_Ubootmod": null,
    };

    for (const release of releases) {
      const name = release.name;
      for (const key of keys) {
        if (name === key || name.startsWith(key + "-")) {
          const currentTime = latestReleases[key]?.timestamp || null;
          const match = name.match(/\d{8}-\d{4}/);
          if (!match) continue;
          const timestamp = match[0];
          if (!currentTime || timestamp > currentTime) {
            latestReleases[key] = { release, timestamp };
          }
        }
      }
    }

    const linkElements = Array.from(
      document.querySelectorAll(".item.grid-6 > a"),
    );
    const timeIds = ["time-256M", "time-128M", "time-128M-ubootmod"];

    keys.forEach((key, index) => {
      const data = latestReleases[key];
      if (data && linkElements[index]) {
        const hrefElem = linkElements[index];
        const timeElem = document.getElementById(timeIds[index]);

        const asset = data.release.assets.find((a) =>
          a.browser_download_url.includes("sysupgrade.bin"),
        );
        if (asset) {
          hrefElem.href = asset.browser_download_url;
        } else {
          hrefElem.href = `https://github.com/weekdaycare/immortalwrt-mt7981-cudy-tr3000/releases/download/${data.release.name}/immortalwrt-mediatek-filogic-cudy_tr3000-v1${key === "256M" ? "-256mb" : key === "128M_Ubootmod" ? "-ubootmod" : ""}-squashfs-sysupgrade.bin`;
        }

        if (timeElem) {
          const timeStr = data.timestamp.replace(
            /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/,
            (_, year, month, day, hour, minute) =>
              `${year}年${month}月${day}日 ${hour}:${minute}`,
          );
          timeElem.textContent = timeStr;
        }
      }
    });
  } catch (err) {
    console.error("Failed to update links:", err);
  }
}

// 只在主页首次加载和用户切回主页时执行更新
function runUpdateOnHomepage() {
  if (
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html"
  ) {
    updateDownloadLinksAndTimesByIndex();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runUpdateOnHomepage);
} else {
  runUpdateOnHomepage();
}

window.addEventListener("popstate", runUpdateOnHomepage);

(function () {
  const pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(history, arguments);
    runUpdateOnHomepage();
  };
  const replaceState = history.replaceState;
  history.replaceState = function () {
    replaceState.apply(history, arguments);
    runUpdateOnHomepage();
  };
})();
