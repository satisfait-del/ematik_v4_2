-- Create subcategories table
CREATE TABLE subcategories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(name, category_id)
);

-- Create index for better performance
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
