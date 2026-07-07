/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    const record = e.record;
    const userId = record.get("user");
    const startDate = new Date(record.get("start_date").toString());
    const endDate = new Date(record.get("end_date").toString());

    // 1. Submission Time Rule (>= 2 hours before shift)
    // Assuming shift starts at 10:00 AM on the start_date
    const shiftStart = new Date(startDate);
    shiftStart.setHours(10, 0, 0, 0);

    const now = new Date();
    const diffMs = shiftStart - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2) {
        throw new BadRequestError("Leave requests must be submitted at least 2 hours before the shift starts.");
    }

    // 2. Division & Position Lock Rule
    // "Auto-reject if another worker in the same position/division is already on leave."
    const user = $app.dao().findRecordById("users", userId);
    const division = user.get("division");
    const position = user.get("position");

    // Check for approved leaves in same division and position for overlapping dates
    // Simplified: checking if any approved leave exists for the same start date
    const overlaps = $app.dao().findRecordsByFilter("leave_requests",
        `status = "approved" && division = "${division}" && position = "${position}" && start_date <= "${record.get("end_date")}" && end_date >= "${record.get("start_date")}"`
    );

    if (overlaps.length > 0) {
        throw new BadRequestError("Another worker in your division and position is already on leave for these dates.");
    }

    // Set cached fields for easier filtering later
    record.set("division", division);
    record.set("position", position);
}, "leave_requests")

onRecordBeforeUpdateRequest((e) => {
    const record = e.record;
    const originalRecord = e.record.original();

    // 3. Cancellation Rule (H-1)
    if (record.get("status") === "cancelled" && originalRecord.get("status") !== "cancelled") {
        const startDate = new Date(record.get("start_date").toString());
        const now = new Date();

        // H-1 Check
        const h1 = new Date(startDate);
        h1.setDate(h1.getDate() - 1);
        h1.setHours(0, 0, 0, 0);

        if (now >= h1) {
            throw new BadRequestError("Leave can only be cancelled until H-1.");
        }
    }
}, "leave_requests")

onRecordAfterUpdateRequest((e) => {
    // 4. Push Notification Trigger (Placeholder)
    // In a real app, you would integrate with Expo Notifications here
    if (e.record.get("status") === "cancelled") {
        // Send notification to manager
    }
}, "leave_requests")
