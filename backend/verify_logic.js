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

const fines_schedule = {
    "10:11-10:30": 5000,
    "10:31-11:00": 10000,
    "11:01-11:30": 15000,
    "11:31-12:00": 20000,
    "12:01-12:30": 30000,
    "12:31-13:00": 40000,
    "13:01-13:30": 50000,
    "base_after_13:30": 50000,
    "increment_after_13:30": 10000
};

function calculateLatenessFine(actual, expected) {
    const diffMs = actual - expected;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const fines = fines_schedule;

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

// Tests
console.log("--- Haversine Test ---");
const d = calculateDistance(-6.2000, 106.8166, -6.2001, 106.8167);
console.log(`Distance: ${d.toFixed(2)}m (Expected: ~15-20m)`);

console.log("\n--- Lateness Fine Test ---");
const expected = new Date("2024-01-01T10:00:00Z");
const late1 = new Date("2024-01-01T10:25:00Z"); // 25 mins late
const late2 = new Date("2024-01-01T13:45:00Z"); // 225 mins late
console.log(`Fine for 25m late: Rp${calculateLatenessFine(late1, expected)} (Expected: 5000)`);
console.log(`Fine for 225m late: Rp${calculateLatenessFine(late2, expected)} (Expected: 60000)`);
