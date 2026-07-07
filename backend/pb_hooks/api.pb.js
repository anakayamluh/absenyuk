/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/absenlah/geofence-check", (c) => {
    const data = $apis.requestInfo(c).data;
    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);

    if (isNaN(lat) || isNaN(lon)) {
        return c.json(400, { error: "Invalid coordinates" });
    }

    const sites = $app.dao().findRecordsByFilter("sites", "is_active = true");
    let result = { is_within: false, site: null };

    // Use the same calculateDistance from attendance.pb.js
    // Since we can't easily share functions between hook files in PB JS VM easily without
    // defining them in a common place or duplicating, I'll duplicate for now or
    // put common utils in a separate file if PB supports it.
    // In PB hooks, each file is executed in its own scope usually, but global functions
    // might be shared if we are careful. Actually, they are NOT shared.

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * d;
    }

    for (const site of sites) {
        const dist = calculateDistance(lat, lon, site.get("latitude"), site.get("longitude"));
        if (dist <= site.get("radius")) {
            result.is_within = true;
            result.site = {
                id: site.id,
                name: site.get("name"),
                distance: dist
            };
            break;
        }
    }

    return c.json(200, result);
}, $apis.requireRecordAuth());

routerAdd("POST", "/api/absenlah/validate-liveness", (c) => {
    const data = $apis.requestInfo(c).data;
    const blinkDetected = data.blink_detected === true || data.blink_detected === "true";
    const smileDetected = data.smile_detected === true || data.smile_detected === "true";

    // Enterprise SOP: Mandatory anti-spoofing
    if (!blinkDetected || !smileDetected) {
        return c.json(400, {
            success: false,
            message: "Liveness verification failed. Ensure you blink and smile during selfie check-in."
        });
    }

    return c.json(200, {
        success: true,
        token: $tokens.recordAuthToken($app, c.get("authRecord")), // Optional security token
        message: "Liveness verified successfully."
    });
}, $apis.requireRecordAuth());

routerAdd("GET", "/api/absenlah/device-status", (c) => {
    const authRecord = c.get("authRecord");
    if (!authRecord) return c.json(401, { error: "Unauthorized" });

    const deviceId = authRecord.get("device_id");

    return c.json(200, {
        is_bound: !!deviceId,
        device_id: deviceId || null,
        message: deviceId ? "Device is bound to this account." : "No device bound. First login will trigger binding."
    });
}, $apis.requireRecordAuth());
