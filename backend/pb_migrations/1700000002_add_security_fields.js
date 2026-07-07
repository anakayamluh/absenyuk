/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("attendance_logs");

  collection.schema.addField({ name: "is_biometric_verified", type: "bool", default: false });
  collection.schema.addField({ name: "blink_detected", type: "bool", default: false });
  collection.schema.addField({ name: "smile_detected", type: "bool", default: false });

  dao.saveCollection(collection);
})
