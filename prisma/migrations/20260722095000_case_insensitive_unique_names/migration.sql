-- Defense-in-depth: unik case-insensitive untuk nama master data
-- (docs/03-erd-dan-skema-database.md). Melengkapi pengecykan application-layer
-- agar race condition (dua create nama sama beda kapital) tetap gagal di DB.
CREATE UNIQUE INDEX "departments_name_lower_idx" ON "departments" (LOWER("name"));
CREATE UNIQUE INDEX "institutions_name_lower_idx" ON "institutions" (LOWER("name"));
CREATE UNIQUE INDEX "purposes_name_lower_idx" ON "purposes" (LOWER("name"));
