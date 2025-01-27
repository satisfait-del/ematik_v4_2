-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'en_cours', 'termine', 'annule');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'purchase', 'refund', 'transfer');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('order', 'payment', 'system', 'promotion');
    END IF;
END $$;

-- Create profiles table (extending Supabase auth.users)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            username TEXT UNIQUE,
            full_name TEXT,
            avatar_url TEXT,
            phone_number TEXT,
            role user_role DEFAULT 'user',
            balance DECIMAL(10,2) DEFAULT 0.00,
            email_verified BOOLEAN DEFAULT false,
            onboarding_completed BOOLEAN DEFAULT false,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- Create categories table with subcategories as array
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    subcategories TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'categories' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.categories
        FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'categories' 
        AND policyname = 'Enable insert for authenticated admin users only'
    ) THEN
        CREATE POLICY "Enable insert for authenticated admin users only" ON public.categories
        FOR INSERT 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'categories' 
        AND policyname = 'Enable update for authenticated admin users only'
    ) THEN
        CREATE POLICY "Enable update for authenticated admin users only" ON public.categories
        FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'categories' 
        AND policyname = 'Enable delete for authenticated admin users only'
    ) THEN
        CREATE POLICY "Enable delete for authenticated admin users only" ON public.categories
        FOR DELETE 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create services table with enhanced features
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT,
    gallery TEXT[], -- Array of image URLs
    features TEXT[], -- Array of feature descriptions
    is_featured BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT null,
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER DEFAULT null,
    tags TEXT[],
    average_rating DECIMAL(2,1),
    total_reviews INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create orders table with enhanced tracking
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    tracking_number TEXT,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_items table with enhanced details
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transactions table with enhanced tracking
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    reference_id TEXT,
    balance_after DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payments table with enhanced tracking
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending',
    payment_method TEXT,
    payment_provider TEXT,
    provider_transaction_id TEXT,
    payment_details JSONB,
    error_message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, service_id)
);

-- Create reviews table with enhanced features
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    reply TEXT,
    reply_at TIMESTAMP WITH TIME ZONE,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notifications table with enhanced features
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_devices table for push notifications
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, device_token)
);

-- Create service_views table for analytics
CREATE TABLE IF NOT EXISTS public.service_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT,
    device_type TEXT
);

-- RLS Policies

-- Profiles policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" 
        ON public.profiles FOR SELECT 
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END $$;

-- Services policies
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'services' 
        AND policyname = 'Everyone can view available services'
    ) THEN
        CREATE POLICY "Everyone can view available services" 
        ON public.services FOR SELECT 
        USING (is_available = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'services' 
        AND policyname = 'Admin users can manage services'
    ) THEN
        CREATE POLICY "Admin users can manage services" 
        ON public.services FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
    END IF;
END $$;

-- Orders policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND policyname = 'Users can view their own orders'
    ) THEN
        CREATE POLICY "Users can view their own orders" 
        ON public.orders FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND policyname = 'Users can create their own orders'
    ) THEN
        CREATE POLICY "Users can create their own orders" 
        ON public.orders FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Reviews policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reviews' 
        AND policyname = 'Everyone can view reviews'
    ) THEN
        CREATE POLICY "Everyone can view reviews" 
        ON public.reviews FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reviews' 
        AND policyname = 'Users can create reviews for their orders'
    ) THEN
        CREATE POLICY "Users can create reviews for their orders" 
        ON public.reviews FOR INSERT 
        WITH CHECK (
            auth.uid() = user_id AND
            EXISTS (
                SELECT 1 FROM public.orders
                WHERE orders.id = reviews.order_id
                AND orders.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Notifications policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications" 
        ON public.notifications FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Transactions policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND policyname = 'Users can view their own transactions'
    ) THEN
        CREATE POLICY "Users can view their own transactions" 
        ON public.transactions FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
        IF NEW.type IN ('deposit', 'refund') THEN
            UPDATE public.profiles 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.user_id;
        ELSIF NEW.type IN ('withdrawal', 'purchase') THEN
            UPDATE public.profiles 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ BEGIN
    -- Profiles updated_at trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Categories updated_at trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_categories_updated_at'
    ) THEN
        CREATE TRIGGER update_categories_updated_at
            BEFORE UPDATE ON public.categories
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Services updated_at trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_services_updated_at'
    ) THEN
        CREATE TRIGGER update_services_updated_at
            BEFORE UPDATE ON public.services
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Orders updated_at trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_orders_updated_at'
    ) THEN
        CREATE TRIGGER update_orders_updated_at
            BEFORE UPDATE ON public.orders
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Reviews updated_at trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_reviews_updated_at'
    ) THEN
        CREATE TRIGGER update_reviews_updated_at
            BEFORE UPDATE ON public.reviews
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Transactions updated_at trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_transactions_updated_at'
    ) THEN
        CREATE TRIGGER update_transactions_updated_at
            BEFORE UPDATE ON public.transactions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Notifications updated_at trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_notifications_updated_at'
    ) THEN
        CREATE TRIGGER update_notifications_updated_at
            BEFORE UPDATE ON public.notifications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Balance update trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_balance_on_transaction'
    ) THEN
        CREATE TRIGGER update_balance_on_transaction
            AFTER INSERT OR UPDATE ON public.transactions
            FOR EACH ROW
            EXECUTE FUNCTION update_user_balance();
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_category') THEN
        CREATE INDEX idx_services_category ON public.services(category_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_is_available') THEN
        CREATE INDEX idx_services_is_available ON public.services(is_available);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_order') THEN
        CREATE INDEX idx_order_items_order ON public.order_items(order_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transactions_user') THEN
        CREATE INDEX idx_transactions_user ON public.transactions(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user') THEN
        CREATE INDEX idx_orders_user ON public.orders(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status') THEN
        CREATE INDEX idx_orders_status ON public.orders(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_service') THEN
        CREATE INDEX idx_reviews_service ON public.reviews(service_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user') THEN
        CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
    END IF;
END $$;
