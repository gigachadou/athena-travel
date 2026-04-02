-- TICKETS TABLE WITH PAYMENT INTEGRATION
-- This table handles travel tickets and their payment status

-- Drop existing table if needed (Careful with production data!)
-- DROP TABLE IF EXISTS public.tickets;

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id TEXT UNIQUE NOT NULL, -- Human readable ID e.g., AF-123456
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    place_id TEXT NOT NULL,
    place_title TEXT NOT NULL,
    place_location TEXT NOT NULL,
    
    -- Passenger Details
    passenger_name TEXT NOT NULL,
    passenger_phone TEXT NOT NULL,
    passenger_email TEXT,
    passport_number TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    
    -- Travel Details
    ticket_type TEXT NOT NULL DEFAULT 'Standart',
    ticket_class TEXT NOT NULL DEFAULT 'Economy',
    guests INTEGER NOT NULL DEFAULT 1,
    date DATE NOT NULL,
    depart_time TIME DEFAULT '08:00',
    arrival_time TIME DEFAULT '12:30',
    train TEXT, -- Train or Flight Number
    coach TEXT, -- Carriage/Coach number
    seat TEXT,
    platform TEXT,
    
    -- Payment Details
    total_price NUMERIC(15, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, refunded, cancelled
    payment_method TEXT DEFAULT 'card',
    card_last4 TEXT, -- Store only last 4 digits for security
    transaction_id TEXT UNIQUE,
    payment_at TIMESTAMPTZ,
    
    -- System Details
    status TEXT NOT NULL DEFAULT 'checking', -- checking, confirmed, completed, cancelled
    qr_code_data TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Users can see their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create their own tickets"
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- (Optional) Admin can see all tickets (if service_role or specific admin check exists)
-- CREATE POLICY "Admins can view all tickets" ...

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON public.tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_status ON public.tickets(payment_status);

-- TRIGGER for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
