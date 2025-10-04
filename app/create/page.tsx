"use client";

export default function CreatePage() {
  async function startCheckout() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const { url } = await res.json();
    window.location.href = url; // Stripe checkout
  }

  return (
    <div className="create-container">
      <h1 className="create-title">Create a Memorial</h1>
      <p className="create-subtitle">
        Begin by paying a one-time fee of $10. After payment, you’ll be directed to add your loved one’s details.
      </p>

      <button onClick={startCheckout} className="submit-button">
        Pay & Continue
      </button>

      <div className="price-info">
        Memorial Entry Fee: $10.00 USD <br />
        Your memorial will be displayed every year on the anniversary date.
      </div>
    </div>
  );
}
