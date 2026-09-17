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

## Class 32: Express & TypeScript

## Class 33: Middleware & Error Handling
