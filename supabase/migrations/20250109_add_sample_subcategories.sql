-- Insert sample subcategories for each category
INSERT INTO subcategories (name, category_id)
SELECT 'Premium', id FROM categories WHERE name = 'Développement Web';

INSERT INTO subcategories (name, category_id)
SELECT 'Standard', id FROM categories WHERE name = 'Développement Web';

INSERT INTO subcategories (name, category_id)
SELECT 'Basic', id FROM categories WHERE name = 'Développement Web';

INSERT INTO subcategories (name, category_id)
SELECT 'Premium', id FROM categories WHERE name = 'Design Graphique';

INSERT INTO subcategories (name, category_id)
SELECT 'Standard', id FROM categories WHERE name = 'Design Graphique';

INSERT INTO subcategories (name, category_id)
SELECT 'Basic', id FROM categories WHERE name = 'Design Graphique';

INSERT INTO subcategories (name, category_id)
SELECT 'Premium', id FROM categories WHERE name = 'Marketing Digital';

INSERT INTO subcategories (name, category_id)
SELECT 'Standard', id FROM categories WHERE name = 'Marketing Digital';

INSERT INTO subcategories (name, category_id)
SELECT 'Basic', id FROM categories WHERE name = 'Marketing Digital';
