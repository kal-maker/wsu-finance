import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "bg-white/10 backdrop-blur-md border border-cyan-500/20 shadow-xl",
          headerTitle: "text-cyan-100",
          headerSubtitle: "text-gray-300",
          socialButtonsBlockButton: "bg-white/10 hover:bg-white/20 border border-cyan-500/30 text-cyan-100",
          socialButtonsBlockButtonText: "text-cyan-100",
          formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-aqua-600 hover:from-cyan-600 hover:to-aqua-700 text-white",
          formFieldLabel: "text-cyan-100",
          formFieldInput: "bg-white/10 border-cyan-500/30 text-white placeholder:text-gray-400",
          footerActionLink: "text-cyan-400 hover:text-cyan-300",
          formFieldSuccessText: "text-cyan-400",
          formFieldErrorText: "text-red-400",
          identityPreviewText: "text-cyan-100",
          identityPreviewEditButton: "text-cyan-400",
          dividerLine: "bg-cyan-500/30",
          dividerText: "text-gray-300",
          formResendCodeLink: "text-cyan-400 hover:text-cyan-300",
        },
        layout: {
          socialButtonsPlacement: "top",
        },
      }}
    />
  );
}
