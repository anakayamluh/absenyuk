/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("app_config");

  const configs = [
    { key: "active_themes", value: ["Light", "Dark", "Enterprise Gold", "Matrix Green"], description: "Available application themes" },
    { key: "current_global_theme", value: "Light", description: "Default theme for new users" },
    { key: "shift_start", value: "10:00", description: "Standard shift start time" },
    { key: "shift_end", value: "20:00", description: "Standard shift end time" },
    { key: "lateness_grace_period", value: 10, description: "Grace period in minutes" },
    { key: "discipline_bonus", value: 20000, description: "Bonus for on-time arrival" },
    { key: "fines_schedule", value: {
        "10:11-10:30": 5000,
        "10:31-11:00": 10000,
        "11:01-11:30": 15000,
        "11:31-12:00": 20000,
        "12:01-12:30": 30000,
        "12:31-13:00": 40000,
        "13:01-13:30": 50000,
        "base_after_13:30": 50000,
        "increment_after_13:30": 10000
    }, description: "Lateness fines mapping" },
    { key: "ot_rates", value: {
        "30": 5000,
        "60": 10000,
        "90": 15000,
        "120": 20000,
        "150": 30000,
        "180": 30000,
        "210": 40000,
        "240": 50000,
        "increment": 10000
    }, description: "Overtime rates mapping" },
    { key: "early_departure_limit", value: 3, description: "Max early departures per month" }
  ];

  configs.forEach(cfg => {
    const record = new Record(collection);
    record.set("key", cfg.key);
    record.set("value", cfg.value);
    record.set("description", cfg.description);
    dao.saveRecord(record);
  });
})
