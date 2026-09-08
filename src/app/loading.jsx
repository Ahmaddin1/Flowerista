export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <h1 className="text-5xl text-text font-heading">
        Loading
      </h1>
      <div className="flex gap-2 mt-3">
        <div
          className="w-2 h-2 rounded-full bg-accent animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-accent animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-accent animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
