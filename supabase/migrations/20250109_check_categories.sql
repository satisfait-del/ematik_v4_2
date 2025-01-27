-- Afficher toutes les catégories
SELECT * FROM categories;

-- Afficher toutes les sous-catégories
SELECT s.*, c.name as category_name 
FROM subcategories s 
JOIN categories c ON s.category_id = c.id;
