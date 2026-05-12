import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2.5">
          {/* Llama icon */}
          <span className="text-2xl">🦙</span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            Ollama Chat
          </span>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
