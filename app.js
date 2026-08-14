const checkoutButtons = Array.from(document.querySelectorAll(".checkout-button"));
const priceElement = document.querySelector("#price");
const currencyNote = document.querySelector("#currency-note");
const discountValue = document.querySelector("#discount-value");
const codeCount = document.querySelector("#code-count");
const statusMessages = Array.from(document.querySelectorAll(".status-message"));
const yearElement = document.querySelector("#year");

const fallbackPrice = {
  amount: 10,
  currency: "USD",
  country: "unknown",
  discountPercent: 15,
  availableCodeCount: 1
};

function getApiBase() {
  return window.FLIX_CODE_CONFIG?.apiBase?.replace(/\/$/, "") || "";
}

function getCheckoutUrl() {
  return window.FLIX_CODE_CONFIG?.checkoutUrl || "";
}

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0
  }).format(price.amount);
}

function renderPrice(price) {
  if (!priceElement || !currencyNote) {
    return;
  }

  priceElement.textContent = formatPrice(price);
  if (discountValue) {
    discountValue.textContent = `${price.discountPercent || 15}% off`;
  }
  if (codeCount) {
    codeCount.textContent = String(price.availableCodeCount || 1);
  }
  currencyNote.textContent = "Final price appears before payment.";
}

function setStatus(message) {
  statusMessages.forEach((element) => {
    element.textContent = message;
  });
}

function setCheckoutDisabled(disabled) {
  checkoutButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

async function loadPrice() {
  if (!priceElement) {
    return;
  }

  const apiBase = getApiBase();

  if (!apiBase || apiBase.includes("your-worker")) {
    renderPrice(fallbackPrice);
    if (getCheckoutUrl()) {
      setCheckoutDisabled(false);
      setStatus("Checkout is enabled through the configured payment link.");
      return;
    }

    setCheckoutDisabled(true);
    setStatus("Checkout needs a Stripe Payment Link or Worker API URL before accepting orders.");
    return;
  }

  try {
    const response = await fetch(`${apiBase}/api/price`);

    if (!response.ok) {
      throw new Error("Price lookup failed");
    }

    renderPrice(await response.json());
  } catch (error) {
    renderPrice(fallbackPrice);
    setStatus("Could not load live pricing. Please try again.");
  }
}

async function startCheckout() {
  const apiBase = getApiBase();
  const checkoutUrl = getCheckoutUrl();

  if ((!apiBase || apiBase.includes("your-worker")) && checkoutUrl) {
    window.location.assign(checkoutUrl);
    return;
  }

  setCheckoutDisabled(true);
  setStatus("Creating secure checkout...");

  try {
    const response = await fetch(`${apiBase}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const payload = await response.json();

    if (!response.ok || !payload.url) {
      throw new Error(payload.error || "Checkout failed");
    }

    window.location.assign(payload.url);
  } catch (error) {
    setCheckoutDisabled(false);
    setStatus(error.message || "Checkout failed. Please try again.");
  }
}

checkoutButtons.forEach((button) => {
  button.addEventListener("click", startCheckout);
});

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

loadPrice();
