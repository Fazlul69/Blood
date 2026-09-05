import { useState } from "react";
import { sendOtp, verifyOtp } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const [phone, setPhone] = useState("+1");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  async function handleSendOtp() {
    setError(null);
    setLoading(true);
    try {
      const result = await sendOtp(phone);
      setDemoOtp(result.otp);
      setCode(result.otp);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(phone, code);
      if (result.isNewUser) {
        setError("No account found for this number. Register through the mobile app first, then have an existing admin promote your account.");
        return;
      }
      if (result.user.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }
      signIn(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <h2 style={{ margin: 0 }}>Blood Admin</h2>
        {step === "phone" ? (
          <>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+14155551234" />
            <button className="btn" onClick={handleSendOtp} disabled={loading}>
              Send code
            </button>
          </>
        ) : (
          <>
            <div className="demo-banner">Demo mode — no SMS is actually sent. Your code is {demoOtp}</div>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
            <button className="btn" onClick={handleVerify} disabled={loading}>
              Verify &amp; sign in
            </button>
          </>
        )}
        {error && <div className="error-text">{error}</div>}
      </div>
    </div>
  );
}
