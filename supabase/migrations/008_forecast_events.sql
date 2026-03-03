-- 008_forecast_events.sql
-- Planned financial events for the cash flow forecast feature.
-- Users can add future expenses/income that get projected on the forecast chart.

CREATE TABLE public.planned_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,        -- Negative = expense, positive = income
  currency TEXT DEFAULT 'NOK',
  event_date DATE NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('once', 'weekly', 'monthly', 'quarterly', 'yearly')),
  category TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for forecast queries (only active events)
CREATE INDEX idx_planned_events_user_date
  ON public.planned_events(user_id, event_date)
  WHERE is_active = true;

-- Row Level Security
ALTER TABLE public.planned_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own planned events"
  ON public.planned_events FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at on row changes
CREATE TRIGGER planned_events_updated_at
  BEFORE UPDATE ON public.planned_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
