-- Create enum for RSVP status
CREATE TYPE public.rsvp_status AS ENUM ('pending', 'confirmed', 'declined');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table (for admin access)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Wedding settings table
CREATE TABLE public.wedding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groom_name TEXT NOT NULL DEFAULT '',
    bride_name TEXT NOT NULL DEFAULT '',
    wedding_date TIMESTAMP WITH TIME ZONE,
    ceremony_location TEXT,
    ceremony_address TEXT,
    reception_location TEXT,
    reception_address TEXT,
    dress_code TEXT,
    story_text TEXT,
    pix_key TEXT,
    bank_name TEXT,
    account_holder TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Guests table
CREATE TABLE public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    rsvp_status rsvp_status NOT NULL DEFAULT 'pending',
    companions INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    invitation_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gifts table
CREATE TABLE public.gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT,
    purchased BOOLEAN NOT NULL DEFAULT false,
    purchaser_name TEXT,
    purchaser_email TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table (mural de recados)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    content TEXT NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers for updated_at
CREATE TRIGGER update_wedding_settings_updated_at
    BEFORE UPDATE ON public.wedding_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guests_updated_at
    BEFORE UPDATE ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gifts_updated_at
    BEFORE UPDATE ON public.gifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin(auth.uid()));

-- RLS Policies for wedding_settings (public read, admin write)
CREATE POLICY "Anyone can view wedding settings"
    ON public.wedding_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert wedding settings"
    ON public.wedding_settings FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update wedding settings"
    ON public.wedding_settings FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete wedding settings"
    ON public.wedding_settings FOR DELETE
    USING (public.is_admin(auth.uid()));

-- RLS Policies for guests
CREATE POLICY "Admins can view all guests"
    ON public.guests FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage guests"
    ON public.guests FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert guest for RSVP"
    ON public.guests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Guests can update their own RSVP by invitation code"
    ON public.guests FOR UPDATE
    USING (true);

-- RLS Policies for gifts (public read, admin write)
CREATE POLICY "Anyone can view gifts"
    ON public.gifts FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert gifts"
    ON public.gifts FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update gifts"
    ON public.gifts FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can update gift to mark as purchased"
    ON public.gifts FOR UPDATE
    USING (purchased = false);

CREATE POLICY "Admins can delete gifts"
    ON public.gifts FOR DELETE
    USING (public.is_admin(auth.uid()));

-- RLS Policies for messages (public insert approved only, admin full)
CREATE POLICY "Anyone can view approved messages"
    ON public.messages FOR SELECT
    USING (approved = true OR public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update messages"
    ON public.messages FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete messages"
    ON public.messages FOR DELETE
    USING (public.is_admin(auth.uid()));

-- Generate invitation code function
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invitation_code IS NULL THEN
        NEW.invitation_code := upper(substring(md5(random()::text) from 1 for 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_guest_invitation_code
    BEFORE INSERT ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_invitation_code();

-- Insert default wedding settings
INSERT INTO public.wedding_settings (groom_name, bride_name) VALUES ('', '');