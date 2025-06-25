import { Suspense } from "react";
import ResetPasswordPage from "./ResetPasswordInner";

export default function ResetPasswordWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
