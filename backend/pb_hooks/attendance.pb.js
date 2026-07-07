/// <reference path="../pb_data/types.d.ts" />

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

function getConfig(key) {
    try {
        const record = $app.dao().findFirstRecordByData("app_config", "key", key);
        return record.get("value");
    } catch (e) {
        return null;
    }
}

onRecordBeforeCreateRequest((e) => {
    const record = e.record;
    const type = record.get("type");
    const timestamp = new Date(record.get("timestamp").toString());
    const lat = record.get("latitude");
    const lon = record.get("longitude");
    const userId = record.get("user");

    // 1. Geofencing check (Haversine)
    const sites = $app.dao().findRecordsByFilter("sites", "is_active = true");
    let isWithinAnyGeofence = false;
    let nearestSite = null;

    for (const site of sites) {
        const dist = calculateDistance(lat, lon, site.get("latitude"), site.get("longitude"));
        if (dist <= site.get("radius")) {
            isWithinAnyGeofence = true;
            nearestSite = site.id;
            break;
        }
    }

    record.set("is_within_geofence", isWithinAnyGeofence);
    if (nearestSite) record.set("site", nearestSite);

    // 2. Attendance Status Logic
    if (type === "clock_in") {
        handleClockIn(record, timestamp, userId);
    } else {
        handleClockOut(record, timestamp, userId);
    }
}, "attendance_logs")

function handleClockIn(record, timestamp, userId) {
    const shiftStartStr = getConfig("shift_start"); // "10:00"
    const graceMinutes = getConfig("lateness_grace_period"); // 10
    const disciplineBonus = getConfig("discipline_bonus"); // 20000

    const [startH, startM] = shiftStartStr.split(":").map(Number);
    const shiftStartTime = new Date(timestamp);
    shiftStartTime.setHours(startH, startM, 0, 0);

    const graceStartTime = new Date(shiftStartTime);
    graceStartTime.setMinutes(graceStartTime.getMinutes() + graceMinutes);

    let status = "on_time";
    let fine = 0;
    let bonus = 0;

    if (timestamp > graceStartTime) {
        status = "late";
        fine = calculateLatenessFine(timestamp, shiftStartTime);
    } else {
        bonus = disciplineBonus;
    }

    record.set("status", status);
    record.set("metadata", JSON.stringify({ fine, bonus }));

    // 3. User Stats & 3rd Lateness Rule
    const monthStr = timestamp.toISOString().slice(0, 7); // YYYY-MM
    let stats;
    try {
        stats = $app.dao().findFirstRecordByFilter("user_stats", `user = "${userId}" && month = "${monthStr}"`);
    } catch (e) {
        // Create stats if not exists
        const collection = $app.dao().findCollectionByNameOrId("user_stats");
        stats = new Record(collection);
        stats.set("user", userId);
        stats.set("month", monthStr);
        stats.set("leave_quota", 12);
        stats.set("lateness_count", 0);
    }

    if (status === "late") {
        let latenessCount = stats.get("lateness_count") + 1;
        stats.set("lateness_count", latenessCount);

        if (latenessCount === 3) {
            // 3rd Lateness Rule: Deduct leave quota instead of fine
            const currentQuota = stats.get("leave_quota");
            if (currentQuota > 0) {
                stats.set("leave_quota", currentQuota - 1);
                // Reset fine in metadata because it's replaced by quota deduction
                record.set("metadata", JSON.stringify({ fine: 0, bonus: 0, rule_applied: "3rd_lateness_quota_deduction" }));
            } else {
                // If no quota, fine still applies
                stats.set("total_fines", stats.get("total_fines") + fine);
            }
        } else {
            stats.set("total_fines", stats.get("total_fines") + fine);
        }
    } else {
        stats.set("total_bonus", stats.get("total_bonus") + bonus);
    }

    $app.dao().saveRecord(stats);
}

function handleClockOut(record, timestamp, userId) {
    // Need to find corresponding clock_in for dynamic shift and overtime
    // This is simplified; in production, you'd find the latest clock_in for today
    const clockInLogs = $app.dao().findRecordsByFilter("attendance_logs", `user = "${userId}" && type = "clock_in"`, "-timestamp", 1);

    if (clockInLogs.length === 0) return;
    const clockIn = clockInLogs[0];
    const clockInTime = new Date(clockIn.get("timestamp").toString());

    const shiftStartStr = getConfig("shift_start");
    const [startH, startM] = shiftStartStr.split(":").map(Number);
    const standardStartTime = new Date(clockInTime);
    standardStartTime.setHours(startH, startM, 0, 0);

    let expectedDurationMs = 10 * 60 * 60 * 1000; // 10 hours in ms
    let shiftDurationStart = standardStartTime;

    if (clockInTime < standardStartTime) {
        // Dynamic Shift: locks to 10 hours from actual clock-in
        shiftDurationStart = clockInTime;
    }

    const expectedClockOutTime = new Date(shiftDurationStart.getTime() + expectedDurationMs);

    let status = "on_time";
    let otPay = 0;

    if (timestamp < expectedClockOutTime) {
        const earlyLimit = new Date(shiftDurationStart);
        earlyLimit.setHours(17, 0, 0, 0); // 05:00 PM

        if (timestamp < earlyLimit) {
            // Violation: cannot leave before 5 PM
            status = "early_departure";
            handleEarlyDepartureViolation(userId, timestamp);
        } else {
            status = "early_departure"; // Still early but after 5 PM
            handleEarlyDepartureViolation(userId, timestamp);
        }
    } else if (timestamp > new Date(expectedClockOutTime.getTime() + 60000)) {
        status = "overtime";
        otPay = calculateOvertimePay(timestamp, expectedClockOutTime);
    }

    record.set("status", status);
    record.set("metadata", JSON.stringify({ overtime_pay: otPay }));
}

function calculateLatenessFine(actual, expected) {
    const diffMs = actual - expected;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const fines = getConfig("fines_schedule");

    if (diffMins <= 30) return fines["10:11-10:30"];
    if (diffMins <= 60) return fines["10:31-11:00"];
    if (diffMins <= 90) return fines["11:01-11:30"];
    if (diffMins <= 120) return fines["11:31-12:00"];
    if (diffMins <= 150) return fines["12:01-12:30"];
    if (diffMins <= 180) return fines["12:31-13:00"];
    if (diffMins <= 210) return fines["13:01-13:30"];

    const extraBlocks = Math.ceil((diffMins - 210) / 30);
    return fines["base_after_13:30"] + (extraBlocks * fines["increment_after_13:30"]);
}

function calculateOvertimePay(actual, expected) {
    const diffMs = actual - expected;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const rates = getConfig("ot_rates");

    if (diffMins < 30) return 0;
    if (diffMins < 60) return rates["30"];
    if (diffMins < 90) return rates["60"];
    if (diffMins < 120) return rates["90"];
    if (diffMins < 150) return rates["120"];
    if (diffMins < 180) return rates["150"]; // Note: requirements say 150m (30k), 180m (30k)
    if (diffMins < 210) return rates["180"];
    if (diffMins < 240) return rates["210"];
    if (diffMins < 270) return rates["240"];

    const extraBlocks = Math.ceil((diffMins - 240) / 30);
    return rates["240"] + (extraBlocks * rates["increment"]);
}

function handleEarlyDepartureViolation(userId, timestamp) {
    const monthStr = timestamp.toISOString().slice(0, 7);
    try {
        const stats = $app.dao().findFirstRecordByFilter("user_stats", `user = "${userId}" && month = "${monthStr}"`);
        stats.set("early_departure_count", stats.get("early_departure_count") + 1);

        // Deduction logic: loss of bonus and quota
        stats.set("leave_quota", Math.max(0, stats.get("leave_quota") - 1));
        // We can't easily retroactively remove the bonus from the clock_in log here without more complexity,
        // but we can adjust total_bonus in stats.
        const currentBonus = stats.get("total_bonus");
        const disciplineBonus = getConfig("discipline_bonus");
        stats.set("total_bonus", Math.max(0, currentBonus - disciplineBonus));

        $app.dao().saveRecord(stats);
    } catch (e) {}
}
