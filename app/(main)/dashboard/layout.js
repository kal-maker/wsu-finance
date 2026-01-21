import { BarLoader } from "react-spinners";
import { Suspense } from "react";

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen w-full">
      {/* Full-page fixed background */}
      <div className="fixed inset-0 bg-[#f0fbff] -z-10" />

      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight gradient-title">
            Dashboard
          </h1>
        </div>
        <Suspense
          fallback={<BarLoader className="mt-4" width={"100%"} color="#06b6d4" />}
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
