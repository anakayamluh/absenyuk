/// <reference path="../pb_data/types.d.ts" />

onRecordAfterAuthWithPasswordRequest((e) => {
    const user = e.record;
    const authData = e.authData; // This might contain custom info from client

    // Device Binding Logic
    // Expecting 'device_id' to be passed in the request body/context
    const requestData = $apis.requestInfo(e.httpContext).data;
    const providedDeviceId = requestData.device_id;

    if (!providedDeviceId) {
        // For existing users or first time, we might need to handle this gracefully
        // depending on whether we want to force device_id on login.
        // For this SOP, we capture on first login.
        return;
    }

    const currentDeviceId = user.get("device_id");

    if (!currentDeviceId) {
        // First time login - Bind device
        user.set("device_id", providedDeviceId);
        $app.dao().saveRecord(user);
    } else if (currentDeviceId !== providedDeviceId) {
        // Device mismatch
        throw new BadRequestError("This account is restricted to another device. Please contact admin to unbind.");
    }
}, "users")
