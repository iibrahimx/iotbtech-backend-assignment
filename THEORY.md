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

## Class 32: Express & TypeScript

## Class 33: Middleware & Error Handling
