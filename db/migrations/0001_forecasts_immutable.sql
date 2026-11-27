-- Forecasts are immutable once written (PRD "Data model"), so the record can't be quietly revised.
-- Rejects DELETE, TRUNCATE and any UPDATE that changes a forecast column. Columns added later
-- (for example resolution and Brier score, feat-014) stay updatable unless listed here.
CREATE FUNCTION public.forecasts_reject_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (NEW.id, NEW.run_id, NEW.outcome, NEW.probability, NEW.baseline_probability,
          NEW.override_reason, NEW.created_at)
         IS NOT DISTINCT FROM
         (OLD.id, OLD.run_id, OLD.outcome, OLD.probability, OLD.baseline_probability,
          OLD.override_reason, OLD.created_at) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'forecasts are immutable: % rejected', TG_OP
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER forecasts_immutable_row
BEFORE UPDATE OR DELETE ON public.forecasts
FOR EACH ROW EXECUTE FUNCTION public.forecasts_reject_change();
--> statement-breakpoint
CREATE TRIGGER forecasts_immutable_truncate
BEFORE TRUNCATE ON public.forecasts
FOR EACH STATEMENT EXECUTE FUNCTION public.forecasts_reject_change();
