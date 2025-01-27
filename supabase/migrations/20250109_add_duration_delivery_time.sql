-- Add subcategory_id to services table
ALTER TABLE services ADD COLUMN subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
