"use client";

export default function EditEntryPage() {
  return (
    <div className="create-container">
      <h1 className="create-title">Resume Your Memorial</h1>
      <p className="create-subtitle">Enter your edit code to continue editing.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const input = form.elements.namedItem('code') as HTMLInputElement | null;
          const code = input?.value?.trim().toUpperCase();
          if (!code) return;
          window.location.href = `/edit/${code}`;
        }}
        className="memorial-form"
      >
        <div className="form-group">
          <label htmlFor="code">Edit Code</label>
          <input id="code" name="code" type="text" placeholder="e.g. RJXPKV" required />
        </div>
        <button type="submit" className="submit-button">Continue</button>
      </form>
    </div>
  );
}
