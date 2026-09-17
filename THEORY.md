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

## Class 33: Middleware & Error Handling
