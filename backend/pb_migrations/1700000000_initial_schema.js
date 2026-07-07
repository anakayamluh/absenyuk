/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. Divisions
  const divisions = new Collection({
    name: "divisions",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" }
    ]
  });
  dao.saveCollection(divisions);

  // 2. Sites
  const sites = new Collection({
    name: "sites",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "latitude", type: "number", required: true },
      { name: "longitude", type: "number", required: true },
      { name: "radius", type: "number", required: true }, // in meters
      { name: "is_active", type: "bool", default: true }
    ]
  });
  dao.saveCollection(sites);

  // 3. App Config
  const app_config = new Collection({
    name: "app_config",
    type: "base",
    schema: [
      { name: "key", type: "text", required: true, unique: true },
      { name: "value", type: "json" },
      { name: "description", type: "text" }
    ]
  });
  dao.saveCollection(app_config);

  // 4. Update Users
  const users = dao.findCollectionByNameOrId("users");
  users.schema.addField({ name: "role", type: "select", values: ["pekerja", "supervisor", "admin"], required: true });
  users.schema.addField({ name: "division", type: "relation", collectionId: divisions.id, maxSelect: 1 });
  users.schema.addField({ name: "position", type: "text" });
  users.schema.addField({ name: "device_id", type: "text" });
  users.schema.addField({ name: "is_active", type: "bool", default: true });
  dao.saveCollection(users);

  // 5. User Stats
  const user_stats = new Collection({
    name: "user_stats",
    type: "base",
    schema: [
      { name: "user", type: "relation", collectionId: users.id, required: true, maxSelect: 1 },
      { name: "month", type: "text", required: true }, // YYYY-MM
      { name: "leave_quota", type: "number", default: 12 },
      { name: "lateness_count", type: "number", default: 0 },
      { name: "early_departure_count", type: "number", default: 0 },
      { name: "total_fines", type: "number", default: 0 },
      { name: "total_bonus", type: "number", default: 0 }
    ]
  });
  dao.saveCollection(user_stats);

  // 6. Attendance Logs
  const attendance_logs = new Collection({
    name: "attendance_logs",
    type: "base",
    schema: [
      { name: "user", type: "relation", collectionId: users.id, required: true, maxSelect: 1 },
      { name: "type", type: "select", values: ["clock_in", "clock_out"], required: true },
      { name: "timestamp", type: "date", required: true },
      { name: "latitude", type: "number", required: true },
      { name: "longitude", type: "number", required: true },
      { name: "is_within_geofence", type: "bool" },
      { name: "liveness_score", type: "number" },
      { name: "site", type: "relation", collectionId: sites.id, maxSelect: 1 },
      { name: "status", type: "select", values: ["on_time", "late", "early_departure", "overtime"] },
      { name: "approval_status", type: "select", values: ["none", "pending", "approved", "rejected"], default: "none" },
      { name: "supervisor", type: "relation", collectionId: users.id, maxSelect: 1 },
      { name: "metadata", type: "json" }
    ]
  });
  dao.saveCollection(attendance_logs);

  // 7. Leave Requests
  const leave_requests = new Collection({
    name: "leave_requests",
    type: "base",
    schema: [
      { name: "user", type: "relation", collectionId: users.id, required: true, maxSelect: 1 },
      { name: "start_date", type: "date", required: true },
      { name: "end_date", type: "date", required: true },
      { name: "reason", type: "text" },
      { name: "status", type: "select", values: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
      { name: "approved_by", type: "relation", collectionId: users.id, maxSelect: 1 },
      { name: "division", type: "relation", collectionId: divisions.id, maxSelect: 1 },
      { name: "position", type: "text" }
    ]
  });
  dao.saveCollection(leave_requests);

}, (db) => {
  const dao = new Dao(db);
  // Rollback logic
  const collections = ["leave_requests", "attendance_logs", "user_stats", "app_config", "sites", "divisions"];
  collections.forEach(name => {
    try {
      const collection = dao.findCollectionByNameOrId(name);
      dao.deleteCollection(collection);
    } catch (e) {}
  });
})
