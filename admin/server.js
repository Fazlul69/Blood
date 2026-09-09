// Tiny production static server for the built SPA. Deliberately not the `serve`
// CLI — its shell-based `-l $PORT` port argument doesn't expand consistently
// across platforms/shells (breaks on Windows, and in some Linux `sh` contexts).
// Reading process.env.PORT directly in JS works identically everywhere.
import { createServer } from "http";
import handler from "serve-handler";

const port = process.env.PORT || 4173;

createServer((request, response) =>
  handler(request, response, {
    public: "dist",
    rewrites: [{ source: "**", destination: "/index.html" }], // SPA client-side routing
  })
).listen(port, () => {
  console.log(`Admin dashboard serving on port ${port}`);
});
