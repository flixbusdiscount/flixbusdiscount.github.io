const redeemStatus = document.querySelector("#redeem-status");
const codePanel = document.querySelector("#code-panel");
const discountCode = document.querySelector("#discount-code");
const copyButton = document.querySelector("#copy-button");
const sessionNote = document.querySelector("#session-note");
const yearElement = document.querySelector("#year");

function getApiBase() {
  return window.FLIX_CODE_CONFIG?.apiBase?.replace(/\/$/, "") || "";
}

function getSessionId() {
  return new URLSearchParams(window.location.search).get("session_id");
}

async function redeemCode() {
  const apiBase = getApiBase();
  const sessionId = getSessionId();

  if (!sessionId) {
    redeemStatus.textContent = "Missing checkout session. Please contact support with your receipt.";
    return;
  }

  sessionNote.textContent = `Support reference: ${sessionId}`;

  if (!apiBase || apiBase.includes("your-worker")) {
    redeemStatus.textContent = "The redemption API is not configured yet.";
    return;
  }

  try {
    const response = await fetch(
      `${apiBase}/api/redeem?session_id=${encodeURIComponent(sessionId)}`
    );
    const payload = await response.json();

    if (!response.ok || !payload.code) {
      throw new Error(payload.error || "Unable to reveal code");
    }

    discountCode.textContent = payload.code;
    codePanel.classList.remove("hidden");
    redeemStatus.textContent = "Your payment is confirmed. Save this code now.";
  } catch (error) {
    redeemStatus.textContent = error.message || "Unable to reveal your code. Please contact support.";
  }
}

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(discountCode.textContent);
    copyButton.textContent = "Copied";
  } catch (error) {
    copyButton.textContent = "Select and copy manually";
  }
});

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

redeemCode();
