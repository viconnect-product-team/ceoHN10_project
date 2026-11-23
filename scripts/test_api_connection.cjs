async function test() {
  try {
    const res = await fetch("http://127.0.0.1:4003/api/events");
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Events count:", Array.isArray(json) ? json.length : json);
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}
test();
