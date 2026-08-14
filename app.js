const checkoutButtons = Array.from(document.querySelectorAll(".checkout-button"));
const priceElement = document.querySelector("#price");
const currencyNote = document.querySelector("#currency-note");
const statusMessages = Array.from(document.querySelectorAll(".status-message"));
const yearElement = document.querySelector("#year");

const fallbackPrice = {
  amount: 10,
  currency: "USD",
  country: "unknown"
};

function getApiBase() {
  return window.FLIX_CODE_CONFIG?.apiBase?.replace(/\/$/, "") || "";
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
  currencyNote.textContent =
    price.country && price.country !== "unknown"
      ? `Currency selected from your IP country: ${price.country}.`
      : "Fallback price shown until the payment API is configured.";
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
    setCheckoutDisabled(true);
    setStatus("Configure config.js with your Worker URL before accepting orders.");
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
