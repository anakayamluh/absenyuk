# Absenlah - Database Schema & Config Engine Design (Phase 1)

## Backend: Pocketbase
Pocketbase will serve as the primary backend for the Absenlah application. Below are the collection definitions and business logic rules.

---

## Collections

### 1. `users` (System)
Extended system collection for worker and administrative accounts.
- `username`: Text (unique)
- `email`: Email (unique)
- `name`: Text
- `role`: Select (`pekerja`, `supervisor`, `admin`)
- `division`: Relation (`divisions.id`, single)
- `position`: Text
- `device_id`: Text (Hardware ID captured on first login for Device Binding)
- `avatar`: File (Image)
- `is_active`: Bool (Default: true)
- `last_login`: DateTime

### 2. `divisions`
Organizational units for leave-locking logic.
- `name`: Text (e.g., "Logistics", "IT", "Sales")
- `description`: Text

### 3. `sites`
Geofencing locations for clock-in/out.
- `name`: Text
- `latitude`: Float
- `longitude`: Float
- `radius`: Float (Radius in meters)
- `is_active`: Bool

### 4. `attendance_logs`
Primary record for all attendance actions.
- `user`: Relation (`users.id`)
- `type`: Select (`clock_in`, `clock_out`)
- `timestamp`: DateTime
- `latitude`: Float
- `longitude`: Float
- `is_within_geofence`: Bool
- `liveness_score`: Float (From ML Kit Liveness Detection)
- `site`: Relation (`sites.id`)
- `status`: Select (`on_time`, `late`, `early_departure`, `overtime`)
- `approval_status`: Select (`none`, `pending`, `approved`, `rejected`) - Used for Courier/Manual approval
- `supervisor`: Relation (`users.id`) - Supervisor who approved/rejected
- `metadata`: JSON (Snapshot of fines/bonuses applied at this specific time)

### 5. `leave_requests`
- `user`: Relation (`users.id`)
- `start_date`: DateTime
- `end_date`: DateTime
- `reason`: Text
- `status`: Select (`pending`, `approved`, `rejected`, `cancelled`)
- `approved_by`: Relation (`users.id`)
- `division`: Relation (`divisions.id`) - Cached for division-locked auto-rejection logic
- `position`: Text - Cached for auto-rejection logic

### 6. `user_stats`
Aggregated monthly stats for ESS dashboard.
- `user`: Relation (`users.id`)
- `month`: Text (Format: `YYYY-MM`)
- `leave_quota`: Int (Current remaining leave days)
- `lateness_count`: Int (Used for the 3rd lateness rule)
- `early_departure_count`: Int (Max 3/month)
- `total_fines`: Float
- `total_bonus`: Float

### 7. `app_config` (Dynamic Rule Engine)
Central configuration for the application behavior.
- `key`: Text (Unique)
- `value`: JSON
- `description`: Text

---

## Dynamic Rule Engine Config (Default Values)

| Key | Value (JSON/Type) | Description |
|-----|-------------------|-------------|
| `active_themes` | `["Light", "Dark", "Enterprise Gold", "Matrix Green"]` | Available themes |
| `current_global_theme` | `"Light"` | Default theme for new users |
| `shift_start` | `"10:00"` | Standard shift start time |
| `shift_end` | `"20:00"` | Standard shift end time |
| `lateness_grace_period` | `10` | Grace period in minutes (10:11 AM is late) |
| `discipline_bonus` | `20000` | Bonus for on-time arrival |
| `fines_schedule` | `{ "10:11-10:30": 5000, "10:31-11:00": 10000, ... }` | Lateness fines mapping |
| `ot_rates` | `{ "30": 5000, "60": 10000, ... }` | Overtime rates mapping |
| `early_departure_limit` | `3` | Max early departures per month |

---

## Business Logic & SOPs

### 1. Lateness & The "3rd Rule"
- **Threshold**: Lateness starts at 10:11 AM.
- **Bonus Disiplin**: Workers get Rp20,000 for on-time arrival. Late arrivals get Rp0.
- **Fines**: Calculated based on the `fines_schedule`.
- **3rd Lateness Rule**:
    - 1st and 2nd late: Standard fine applied.
    - 3rd late: **Potong Jatah Libur** (Leave Quota - 1). No fine applied if quota exists.
    - 4th+ late: Revert to standard fines.

### 2. Dynamic Shift Duration
- If `clock_in` < 10:00 AM: The shift duration is locked to exactly **10 hours** from that `clock_in` time.
- Example: Clock in at 09:30 AM -> Clock out expected at 07:30 PM.

### 3. Leave Request Logic
- **Submission**: Must be submitted >= 2 hours before shift start.
- **Auto-Rejection**: If another worker in the same `division` AND `position` already has an `approved` leave for the same date, the request is automatically rejected.
- **Cancellation**: Workers can cancel until H-1.
- **Visibility**: `Leave Information Center` is strictly scoped to the user's `division`.

### 4. Overtime & Early Departure
- **Overtime**: Starts 1 minute after the 10-hour duration. Requires Supervisor approval.
- **Early Departure**: Cannot leave before 05:00 PM. Max 3 instances/month. Violations result in loss of `Bonus Disiplin` and `Leave Quota` deduction.

### 5. Geofencing (Haversine)
Both frontend and backend will implement the Haversine formula to validate distance:
`d = 2R * asin(sqrt(sin²((lat₂ - lat₁)/2) + cos(lat₁) * cos(lat₂) * sin²((lon₂ - lon₁)/2)))`
Validation occurs against the `sites` collection.
