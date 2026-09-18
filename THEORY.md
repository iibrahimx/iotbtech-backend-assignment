# IOTBTECH 2026 Backend Assignment: THEORY

## Class 31: Node.js Runtime, Buffer, Streams & Bun

### Q1. Predict `process.argv` output

**My first guess:** Nothing would print, because `app.js` had no code, like function to console. I didn't know Node pre-populates `process.argv` before my code runs.

**The exact output from running `node app.js --port 8080 --host localhost`:**

```bash
[
'/home/ibrahim/.nvm/versions/node/v24.19.0/bin/node',
'/home/ibrahim/Documents/iotbtech/backend/be-assignment-scratch/app.js',
'--port',
'8080',
'--host',
'localhost'
]
[ '--port', '8080', '--host', 'localhost' ]
```

**What do indices 0, 1, and 2+ of process.argv represent?**
From my understanding, `process.argv` holds the full command as Node received it. Index `0` is the path to the Node executable, index `1` is the path to the script being run, and index `2` onward are the actual arguments I typed, so `.slice(2)` differs from the full array because it deliberately skips the first two context entries that belong to Node and the script rather than to my program's input.

### Q2. Why use `process.argv.slice(2)` in a real CLI tool?

Because the first two elements of `process.argv` don't belong to my program, they belong to whatever launched it. Index 0 is the runtime's own path (Node, Bun, or another launcher), and index 1 is the script's resolved path (app.js or whatever the file is being saved with). Using the full array would mean my code treats those two paths as its first inputs, which is meaningless. Those two entries also change depending on how the script is invoked: when run it with `node`, index 0 is Node's path; but when I ran it with `bun`, index 0 is Bun's path. So a CLI can't trust their values. `.slice(2)` is the standard filter that discards whatever the launcher adds to the output and keeps only what the user actually typed. So running from a different folder makes no difference, I tested this and Node resolves relative paths into absolute ones before filling `argv`, so the array shape and content stay the same. Running under a different runtime (I tested Bun) swaps what got printed at index 0, but keeps the same two-entry context shape. That's why `.slice(2)` is reliable for typical invocations.

### Q3. Buffer lengths vs string lengths

**My predictions:** 10, 5, 10.

**Actual output:**

```bash
10
5
5
```

My prediction was wrong on the third line because I assumed `"مرحبا".length` would equal the byte length. It doesn't. `String.prototype.length` does not count bytes; it counts UTF-16 code units, which is the encoding JavaScript uses internally for strings. Each Arabic character fits in one UTF-16 code unit, so the length is 5, not 10.

**Why the first two numbers differ from each other:**
`Buffer.from("مرحبا").length` is **10** because a Buffer stores UTF-8 bytes, and each Arabic letter takes 2 bytes in UTF-8 (5 letters × 2 = 10). `Buffer.from("hello").length` is **5** because English letters take 1 byte each in UTF-8 (5 × 1 = 5). So the difference between line 1 and line 2 is **UTF-8 byte sizes**: 2 bytes per Arabic letter vs 1 byte per English letter.

**Why the third number differs from the first:**
Both represent the same 5 Arabic characters, but they're counted in different units. Line 1 (`Buffer.from("مرحبا").length`) counts bytes, totalling 10 while line 3 (`"مرحبا".length`) counts UTF-16 code units, totalling 5.

### Q4. Why `readFileSync` crashes on a 5 GB file

`readFileSync` reads the entire 5 GB file into RAM in a single operation. The file doesn't go to disk, it's already on disk. It goes into Node's memory (specifically the V8 heap when the content is decoded as a JavaScript string). On an 8 GB machine, that 5 GB isn't the only thing in RAM, the OS, VS Code, the browser, and Node itself are already using several GB. On top of that, decoding the raw bytes into a UTF-8 string typically doubles the memory footprint, so the real cost is much higher than the 5GB file size and even the 8GB RAM size, maybe closer to 10 GB. That exceeds what the machine has, so Node crashes with a heap out-of-memory error.

`createReadStream` avoids this by reading the file in chunks and processing each chunk before the next arrives. Peak memory stays bound by chunk size, not file size, so a 5 GB file uses roughly the same peak memory as a 5 MB file. The chunk is discarded after processing, and the stream pulls the next one. Nothing bigger than a single chunk lives in memory at any moment and thus savng memory.

### Q5. `pipe()` vs `pipeline()`

According to my understanding, the practical difference is in how each they handle failure. Both connect a readable stream to a writable stream, but `pipe()` just connects them and steps back, with no safeguard or failsafe or the likes. If the destination stream errors midway, the source stream isn't destroyed, its file handle stays open because nothing told it to close. When that is done in a loop and file handles will be leaked until the process runs out and crashes. `pipeline()` on the other hand watches all the streams; if any of them errors, it destroys the rest and sends the error to a promise or callback so the code can react.

**A Failure Scenario:**
Copying say a file `huge.log` to `backup-huge.log` where the backup disk fills up halfway through. With `pipe()`, the write fails, but the read stream for `huge.log` stays open, its file descriptor is never released. When this operation is ran repeatedly, the process accumulates leaked file handles until it can't open anything else. With `pipeline()`, the moment the write fails, both streams are destroyed, the file handle is released, and the error is delivered to a `try/catch` well, specifically `.catch()`, so the program can log it and move on cleanly.

### Q6. Buffer to hex and base64

**My predictions:** I predicted hex as 2 characters per byte (so 14 characters total for 7 bytes), but I had no idea what base64 would look like.

**Actual output:**

```bash
4e6f64652e6a73
Tm9kZS5qcw==
```

**What I got wrong:**
Nothing on hex, my initial assumption was right. Base64 confused me, so I didn't guess. After reading, I understand why it looks the way it does.

**For Hex:** `"Node.js"` has 7 characters, each 1 byte in ASCII, so 7 bytes total. Each byte becomes 2 hex characters (0–9, a–f), so 14 characters. The first pair `4e` is the ASCII code for `N` (78 in decimal = 4e in hex), `6f` is `o`, and so on.

**For Base64:** Base64 takes 3 bytes at a time and turns them into 4 text characters, so 7 bytes become 12 characters with an extra 1 character because of the overall 7. The `==` at the end is padding, it means "the last group didn't have a full 3 bytes, so the missing slots are filled with `=`."

### Q7. Streams keep memory flat

"Flat" simply means memory usage stays the same no matter how large the input gets, it doesn't grow with the file. The `pipe` approach is flat: it reads the file in chunks, processes each chunk, discards it, and moves to the next. Peak memory is bound by chunk size, not by file size. The `bucket` approach on the other hand is "linear", that is, it reads the entire file into memory at once, so doubling the file doubles the memory used. That's why a 10,000-row file and a 10,000,000-row file both fit in the same small footprint under the pipe approach, but the bucket approach would use roughly 1000× more memory on the larger file. The flat approach stays flat because each chunk is the same size regardless of how big the parent file is, the stream never holds more than one chunk at a time.

### Q8. Bun vs Node.js

**Three things Bun does out of the box:**

1. **Runs TypeScript directly** — `bun script.ts` works, no build step or `tsx` runner needed.
2. **Built-in test runner** — `bun test` runs tests without installing Jest or Vitest as a dependency.
3. **Much faster installs and runs** — `bun install` is often several times faster than `npm install` as well as its runs.

**My pick: Node.js.**

Node has been around far longer and has been tested across countless production environments and edge cases. That track record means bugs are well-known and fixes exist. Bun looks perfect on the surface but is still fairly new, and there are reports of performance and compatibility issues from heavy users. For a real team project today, betting on the proven runtime is safer than betting on the newer all-in-one tool until it has more strength testing. But I'd still use Bun for quick scripts and local experiments where speed matters more than long-term stability.

## Class 32: Express & TypeScript

### Q9. Route order and first-match-wins

**Predictions:**

- `GET /api/products/featured` returns the JSON `{ "hit": "by-id", "id": "featured" }`
- `GET /api/products/42` returns the JSON `{ "hit": "by-id", "id": "42" }`
- `GET /api/products` returns the JSON `{ "hit": "fallback" }`

**Why:**

Express checks routes top-to-bottom and stops at the first one that matches, which is its "first matching route wins" rule. The dynamic route `/api/products/:id` is registered before the static route `/api/products/featured`, so when `/featured` is requested, `:id` matches first and treats `"featured"` as the id, instead of the extra endpoint it is. Express never reaches the static route.

The `/:id` handler doesn't validate whether the id exists, it just echoes it back as a string. So the response is a successful-looking JSON with `id: "featured"`, not an error.

`GET /api/products` with no trailing or extra nested endpoint doesn't match `/:id` (which needs something after the slash), so Express falls through to the `app.use("/api/products", ...)` fallback, which returns `{ "hit": "fallback" }`. The `?category=toys` is not part of the path or a param but rather a query string, so it doesn't affect matching.

**What I learned:**

Always register static routes (like `/featured`) before dynamic ones (like `/:id`). Otherwise the dynamic route swallows everything and the static route becomes unreachable.

### Q10. Type of `req.params.id`

`req.params.id` is always a string. Even if the URL contains `/api/products/42`, Express hands `"42"` back, with quotes meaning we get the number 42 in string form.

**Conversion expression:** `Number(req.params.id)`

**Why Express doesn't convert it for me:**

A URL path segment is just text sent over the network. Express doesn't know whether `:id` is meant to be a number, a name, a UUID, or anything else, that's decided by me, the developer, when I named the parameter. So Express hands it to me as-is (a string) and leaves the interpretation to my code.

### Q11. Routes vs Controllers vs Services

**Route:** decides which URL pattern maps to which controller function, it's the matching rule between incoming paths and handlers, and it doesn't know anything about data.

**Controller:** handles one HTTP request/response cycle, reads inputs from `req` (params, body, query), calls the service, and sends a response with `res`. It's the only layer that touches `req` and `res`.

**Service:** holds the business logic and data access, it's the only layer that knows how data is stored (be it array, CSV, database etc.) and retrieved, and it never touches `req` or `res`.

If we switch from an in-memory array to reading products from a CSV at boot, I edit only one file: `product.service.ts`. That's because the service is the only layer that knows where data lives. Routes and controllers don't care or know about storage, they call service functions and trust the result. So a storage change stays isolated to the service, and nothing else needs to change.

### Q12. Why `req.body` is undefined without `express.json()`

**The missing line:**

```typescript
app.use(express.json());
```

**Where it must go**

Near the top of the app, before any route that reads req.body (POST, PUT/PATCH). If it's registered after the routes, the request reaches the handler before the body has been parsed.

**Why the handler sees undefined**

The request body arrives as raw bytes. Express doesn't parse it automatically. express.json() is the middleware that reads those bytes, checks that the Content-Type is application/json, parses the JSON, and attaches the resulting object to `req.body`. Without it, no middleware ever sets `req.body`, so the property doesn't exist and reads as undefined. A subtle detail I observed was that it's undefined and not {}. The property is completely absent, not empty. Middleware creates the property; without middleware, there's nothing to read to begin with.

### Q13. Router prefix behavior

`app.use("/api/products", productRouter)` mounts the router at the prefix `/api/products`. Inside the router, every path is relative to that prefix.

**Full URLs the two routes respond to:**

- `router.get("/", ...)` → `GET /api/products`
- `router.get("/:id", ...)` → `GET /api/products/:id`

A `router.get("/top", ...)` would respond to: `GET /api/products/top` because the router itself doesn't know where it's mounted. It only defines relative paths. The `app.use` supplies the prefix, and Express concatenates them when matching requests. This means the same router could be mounted at different prefixes (like `/v1/products` or `/v2/products`) without changing its internal code.

### Q14. Status codes for common actions

a. Successful POST creating a product → `201 Created`: Because the request resulted in a new resource being created.
b. Request for a product id that doesn't exist → `404 Not Found`: Because the resource requested does not exist on the server.
c. POST missing a required `name` field → `400 Bad Request`: Because the client sent malformed data, the endpoint exists, but the payload is incomplete.
d. Unexpected crash inside a route handler → `500 Internal Server Error`: Because the server hit an unexpected problem it couldn't recover from.
e. Successful GET returning a list → `200 OK`: Because the request succeeded and just returns data, no resource is being created.

## Class 33: Middleware & Error Handling

### Q15. Middleware execution order with `next()`

**Predicted output, in exact order:**

```bash
ibrahim@ibrahim:~/Documents/iotbtech/backend/express-practice$ npm run dev

> express-practice@1.0.0 dev
> tsx watch app.js

Server running at http://localhost:3005
M1 in
M2 GET /
handler starts
handler ends
M1 out
```

**When `M1 out` runs and why:**

It runs after the handler finishes, not immediately after `next()`. `next()` hands control to the next middleware (or the route handler) in the chain. The code after `next()` in M1 only runs when that downstream chain completes and control "unwinds" back up. So the sequence is: M1 logs "M1 in" → calls `next()` → M2 runs → handler runs (both "handler starts" and "handler ends" print, because `res.send()` doesn't stop the handler) → control returns to M1 → M1 logs "M1 out". It was noted that `handler ends` prints **before** `M1 out`. That's because the code after `res.send()` in the handler still runs, `res.send()` sends the response but doesn't stop execution. Only when the handler function returns does control travel back up to M1.

### Q16. Middleware that forgets both `next()` and `res.send()`

**What the client sees**

The request hangs. The browser or curl or any API testing tools spins indefinitely until the client-side timeout kicks in. No response is ever sent.

**What the terminal sees**

Only whatever the middleware logged before it stopped, then silence. No error, no crash, no warning. The server keeps running and can serve other requests; the stuck request just never progresses.

**Why Express can't auto-guess**

Because a middleware is allowed to not call `next()` on purpose. Auth middlewares and rate limiters deliberately end the request with a 401 or 429 without calling `next()`, that's their job. Express can't tell the difference between a deliberate stop and a forgotten `next()`. So it waits for an explicit signal: either `next()` (continue) or the response being ended (finish).

### Q17. How Express identifies an error handler

Express decides by inspecting the number of parameters the function declares, it does so by calling `function.length` internally. Fewer than 4 parameters means normal "middleware". Exactly 4 means "error handler".

**Why 4 specifically**

Normal middleware takes `(req, res, next)` exactly 3 parameters. An error handler on the other hand needs one extra piece of information: the "error" itself. So it takes `(err, req, res, next)` which equates to 4 parameters. That extra first parameter is the signal.

**What happens if you trim to 3 params (`(err, req, res)`)**

Express reclassifies the function as normal middleware. Now it's broken on both fronts, it isn't called during the error path (Express only invokes 4-param handlers when an error occurs), and it isn't meaningfully useful on the normal path either because its body expects an error that isn't there. Errors then fall through to Express's default handler, which returns an HTML stack trace and leaks internal details to the client. Silent failure with no warning, no error, which is why this bug is so common.
