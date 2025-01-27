-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE transaction_type AS ENUM ('recharge', 'achat');
CREATE TYPE transaction_status AS ENUM ('en_cours', 'reussi', 'echoue');
CREATE TYPE order_status AS ENUM ('en_cours', 'traite', 'non_traite');

-- Create profiles table (extending Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    phone_number TEXT,
    image TEXT,
    role user_role DEFAULT 'user',
    balance DECIMAL(10,2) DEFAULT 0.00,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_user
        FOREIGN KEY (id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    instructions TEXT,
    transaction_id_user TEXT,
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

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status transaction_status DEFAULT 'en_cours',
    description TEXT,
    order_id UUID,  -- Référence à la commande si type = 'achat'
    transaction_id_user TEXT,  -- ID de transaction fourni par l'utilisateur pour les recharges
    balance_after DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status order_status DEFAULT 'en_cours',
    total_amount DECIMAL(10,2) NOT NULL,
    transaction_id UUID REFERENCES public.transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint for transactions -> orders
ALTER TABLE public.transactions
ADD CONSTRAINT fk_order
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, service_id)
);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update user balance on successful transaction
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Mise à jour du solde uniquement si le statut passe à 'reussi'
    IF NEW.status = 'reussi' AND (OLD.status IS NULL OR OLD.status != 'reussi') THEN
        IF NEW.type = 'recharge' THEN
            UPDATE public.profiles 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.user_id;
        ELSIF NEW.type = 'achat' THEN
            UPDATE public.profiles 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.user_id;
        END IF;
        
        -- Mettre à jour balance_after
        NEW.balance_after := (
            SELECT balance 
            FROM public.profiles 
            WHERE id = NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create transaction on order creation
CREATE OR REPLACE FUNCTION create_order_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        status,
        description,
        order_id
    ) VALUES (
        NEW.user_id,
        'achat',
        NEW.total_amount,
        'en_cours',
        'Commande #' || NEW.id,
        NEW.id
    ) RETURNING id INTO NEW.transaction_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balance_on_transaction
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_balance();

CREATE TRIGGER create_transaction_on_order
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION create_order_transaction();

-- Create indexes for better performance
CREATE INDEX idx_services_category ON public.services(category_id);
CREATE INDEX idx_services_is_available ON public.services(is_available);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_order ON public.transactions(order_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Services are viewable by everyone" 
    ON public.services FOR SELECT 
    USING (true);

CREATE POLICY "Categories are viewable by everyone" 
    ON public.categories FOR SELECT 
    USING (true);

CREATE POLICY "Users can view their own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can create their own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" 
    ON public.transactions FOR SELECT 
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can manage their favorites" 
    ON public.favorites FOR ALL 
    USING (auth.uid() = user_id);
