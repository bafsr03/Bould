import fetch from 'node-fetch';

async function main() {
    const garmentsApiUrl = "http://localhost:8001";
    const path = "api_runs/c83c8d47-820a-4c69-b39b-82c182f2911c/size_scale.json";

    console.log("Getting token...");
    const tokenRes = await fetch(`${garmentsApiUrl}/v1/auth/token`, { method: "POST" });
    if (!tokenRes.ok) {
        console.error("Failed to get token:", tokenRes.status);
        return;
    }
    const tokenJson = await tokenRes.json();
    const token = tokenJson.token;
    console.log("Got token.");

    console.log(`Fetching file: ${path}`);
    const fileRes = await fetch(`${garmentsApiUrl}/v1/files?path=${encodeURIComponent(path)}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!fileRes.ok) {
        console.error("Failed to fetch file:", fileRes.status);
        const text = await fileRes.text();
        console.error(text);
        return;
    }

    const json = await fileRes.json();
    console.log("Size Chart Content:");
    console.log(JSON.stringify(json, null, 2));
}

main();
