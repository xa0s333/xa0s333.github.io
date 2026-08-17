``Cyberlandslagets juleCTF — SANTAS WORKSHOP (BONUS)``


This was a bonus challenge built on top of a much simpler task.

The original task was pretty straightforward, and one thing that was completely irrelevant to its solution was the elf ID generated whenever a user registered.

```js
function generateElfId() {
    return Math.floor(Math.random() * 1e11).toString();
}
```

For the first task, this value didn't matter at all, which in turn made it interesting and a point of interest in this bonus task.

Eventually, while searching around for information about JS's ``Math.random()``, I found that it is backed by a deterministic PRNG and that future output can be predicted if enough information about its state is leaked, which immediately made the elf IDs a lot more interesting.

Every registration was effectively giving me another observable output from ``Math.random()``.

-- Predicting the elf IDs --

While looking into ways of predicting V8's ``Math.random()``, I found existing predictors that use the Z3 solver to recover the PRNG state from observed outputs.

I wasn't trying to derive the state myself from scratch. The interesting part for the challenge was figuring out whether the elf IDs exposed enough information to make one of these existing techniques work.

So I registered a bunch of users in a row and collected their IDs:

```
2571518639     forsen
13349071036    forsen2
45637909342    forsen3
34597528651    forsen4
5765821157     forsen5
15380816955    forsen6
20428444344    forsen7
30847458444    forsen8
5153041682     forsen9
8670155237     forsenx
81531569908    forsenxi
51620379215    forsenxii
```

I fed the first ten into the predictor:

```js
const vals = [
    "2571518639",
    "13349071036",
    "45637909342",
    "34597528651",
    "5765821157",
    "15380816955",
    "20428444344",
    "30847458444",
    "5153041682",
    "8670155237",
];

const next = predict(vals);
```

The predicted next value was:

```
Predicted: 81531569908
Actual:    81531569908
```
The next prediction matched as well:
```
Predicted: 51620379215
Actual:    51620379215
```

I created one more user just to make sure the predictor hadn't gone out of sync:

forsenxiii -> 99106176624

and got:

Predicted: 99106176624
Actual:    99106176624

So the idea worked. The application was leaking enough information through the elf IDs for me to predict future PRNG output. The problem was that I still had no idea what that was useful for.

-- Finding the Undici connection --

Once I knew I could predict future ``Math.random()`` output, I started looking for somewhere else in the application where randomness might actually matter.

That eventually led me to Undici, which is used by Node's ``fetch()`` implementation. I checked the version inside the challenge container:

```sh
docker exec -it 091ba4467b78 node -p "process.versions.undici"
```

which returned:

``6.21.0``

While researching that version I found ``CVE-2025-22150``.

Affected Undici versions used ``Math.random()`` when generating boundaries for ``multipart/form-data`` requests.

The application was giving me observable outputs from its PRNG through the elf IDs, while Undici was later consuming output from that same PRNG when generating a multipart boundary.

While reading PoCs for this kind of attack, I also came across an example leak that looked like this:

```js
app.get("/example", (req, res) => {
    res.header(
        "x-request-id",
        `${Math.floor(Math.random() * 1e11)}`.padStart(11, "0")
    );


    res.send("Example");
});
```

Which looked extremely similar to how the id's in our task were being generated:

```js
function generateElfId() {
    return Math.floor(Math.random() * 1e11).toString();
}
```

At that point the connection was clear. By registering users I could collect elf IDs that exposed output from the application's ``Math.random()`` state. Those values could be used to predict future PRNG output, and Undici was using that same source of randomness to generate the next multipart boundary. If the attacker could predict that boundary in advance, they could place it inside `presentname` and make the downstream parser treat part of their input as a new multipart field.

-- Why the boundary matters --

A multipart request separates its fields using a boundary. Simplified, it looks something like this:

```html
------formdata-undici-123456789012
Content-Disposition: form-data; name="presentname"


some-present
------formdata-undici-123456789012
Content-Disposition: form-data; name="roles"


elf
------formdata-undici-123456789012--
```

Normally the user only controls the contents of presentname.

The boundary is generated separately by Undici, so user input shouldn't be able to create new multipart sections.

But if I know the exact boundary before the request is generated, I can include it inside presentname myself.

The important part of the payload was:

```js
const presentname =
    `flag\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="roles"\r\n\r\n` +
    `santa\r\n`;
```

Instead of the whole value remaining inside presentname, the predicted boundary causes the downstream multipart parser to treat part of my input as a new field:

``roles=santa``

So predicting the PRNG wasn't the end goal by itself, but it was the thing what allowed me to predict a value that normally separates attacker-controlled data from the structure of the multipart request.

-- Keeping the PRNG state synchronized --

The annoying part was keeping the predictor synchronized with the running Node process. The observed values had to be consecutive, and any extra call to ``Math.random()`` would advance the state and make the next prediction wrong.

For a clean attempt I started with a fresh container, collected the required elf IDs, predicted the next value and then sent the exploit without making unnecessary requests in between.

The predicted value was converted into the Undici boundary format with:

```js
function makeBoundary(suffix) {
    return `----formdata-undici-${String(suffix).padStart(12, "0")}`;
}
```

That boundary was then inserted into the presentname payload.
Once everything was lined up correctly, the request worked, and we retrieved the fake flag. So I immediately edited the payload to target the remote server, and retrieved the real flag.


``JUL{w0w_prng_1s_r3411y_uns4f3}``

full payload:
<a href="/payloads/santas-workshop.js" class="payload-link" data-payload="/payloads/santas-workshop.js">[open santas-workshop.js]</a>
