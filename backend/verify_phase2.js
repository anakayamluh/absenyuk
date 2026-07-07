// Verification script for Phase 2 updates
const securityChecks = (type, biometric, blink, smile) => {
    if (type === "clock_in") {
        if (!biometric) return "FAILED: Biometric mandatory";
        if (!blink || !smile) return "FAILED: Liveness mandatory";
    }
    return "PASSED";
};

console.log("--- Security Validation Test ---");
console.log(`Clock-in (no biometric): ${securityChecks("clock_in", false, true, true)}`);
console.log(`Clock-in (no liveness): ${securityChecks("clock_in", true, false, true)}`);
console.log(`Clock-in (complete): ${securityChecks("clock_in", true, true, true)}`);

const livenessCheck = (blink, smile) => {
    if (!blink || !smile) return "FAILED: Must blink and smile";
    return "PASSED: Liveness verified";
};

console.log("\n--- Liveness API Logic Test ---");
console.log(`Liveness (blink only): ${livenessCheck(true, false)}`);
console.log(`Liveness (both): ${livenessCheck(true, true)}`);
