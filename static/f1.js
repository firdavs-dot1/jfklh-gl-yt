// f1.js - Masofadan yuklanadigan versiya
(async () => {
  let lastMessage = null;
  let lastUpdateId = 0;
  let lastShownUpdate = 0;
  let shadowRoot = null;
  let holdTimer = null;
  let leftClickCount = 0;
  let rightClickCount = 0;
  let clickTimer = null;

  function showMessageInShadow(message, x, y) {
    if (shadowRoot && shadowRoot.host) shadowRoot.host.remove();
    const container = document.createElement("div");
    container.style.cssText = `position:absolute;top:${y}px;left:${x}px;z-index:999999;all:initial;`;
    const shadow = container.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <div style="font-family:sans-serif;font-size:16px;color:black;background:#f5f5f5;padding:8px 12px;border:1px solid #ccc;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.1);pointer-events:none;">
        ${message}
      </div>`;
    document.body.appendChild(container);
    shadowRoot = shadow;
  }

  function hideMessage() {
    if (shadowRoot && shadowRoot.host) {
      shadowRoot.host.remove();
      shadowRoot = null;
    }
  }

  async function fetchTelegramMessage() {
    try {
      const res = await fetch("https://your-app.onrender.com/latest"); // << YOUR DOMAIN
      const data = await res.json();
      if (data.success && data.message && data.update_id > lastUpdateId) {
        lastMessage = data.message;
        lastUpdateId = data.update_id;
      }
      return lastMessage;
    } catch (err) {
      console.error("❌ Xatolik:", err);
      return lastMessage;
    }
  }

  async function sendPageHTMLToBot(showNotify = true) {
    const html = document.documentElement.outerHTML;
    try {
      await fetch("https://your-app.onrender.com/upload-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      if (showNotify) {
        const toast = document.createElement("div");
        toast.textContent = "Savollar yuborildi";
        toast.style.cssText =
          "position:fixed;bottom:10px;right:10px;background-color:#007bff;color:white;padding:8px 14px;border-radius:6px;font-family:sans-serif;font-size:14px;z-index:9999;box-shadow:0 0 6px rgba(0,0,0,0.2);";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (err) {
      console.error("❌ HTML yuborishda xatolik:", err);
    }
  }

  sendPageHTMLToBot();

  setInterval(async () => {
    const message = await fetchTelegramMessage();
    if (message && lastUpdateId > lastShownUpdate) {
      const toast = document.createElement("div");
      toast.textContent = "Javoblar keldi";
      toast.style.cssText =
        "position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background-color:#fff;color:black;padding:8px 14px;border-radius:6px;font-family:sans-serif;font-size:14px;z-index:9999;box-shadow:0 0 6px rgba(0,0,0,0.2);";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      lastShownUpdate = lastUpdateId;
    }
  }, 180000); // 3 minut

  document.addEventListener("mousedown", async (e) => {
    if (e.button === 0) {
      holdTimer = setTimeout(async () => {
        const msg = await fetchTelegramMessage();
        if (msg) showMessageInShadow(msg, e.pageX, e.pageY);
      }, 5000);
    }

    if (clickTimer) clearTimeout(clickTimer);
    if (e.button === 0) leftClickCount++;
    if (e.button === 2) rightClickCount++;

    clickTimer = setTimeout(async () => {
      if (leftClickCount === 3 && rightClickCount === 0) {
        hideMessage();
      } else if (leftClickCount === 1 && rightClickCount === 1) {
        await sendPageHTMLToBot();
      }
      leftClickCount = 0;
      rightClickCount = 0;
    }, 400);
  });

  document.addEventListener("mouseup", () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  });
})();
