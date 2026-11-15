-- Consortium levels follow the all-time science points (thresholds in backend/consortia.mjs, LEVELS).
-- Brings existing consortia up to date; levels never go down. Repeatable.
UPDATE consortia SET level = GREATEST(level, CASE
  WHEN science >= 6000 THEN 5 WHEN science >= 3000 THEN 4 WHEN science >= 1200 THEN 3 WHEN science >= 400 THEN 2 ELSE 1 END);
