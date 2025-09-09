-- Update goals with 'other' domain to proper categories based on their content

UPDATE goals 
SET domain = 'work' 
WHERE id = '28575429-9dd1-498f-bc97-25fa2cdbd9cc' 
AND title = 'Write Resume';

UPDATE goals 
SET domain = 'life' 
WHERE id = '541b1fec-fc06-44c0-b99f-bd26ef157cad' 
AND title = 'Make Bed';

UPDATE goals 
SET domain = 'health' 
WHERE id = '3340c21d-b3e9-4657-8dcd-79c51ffbcbfb' 
AND title = 'Drink Water';

UPDATE goals 
SET domain = 'school' 
WHERE id = 'b1e7a3f0-0c53-4329-bcc4-5a4e46e90464' 
AND title = 'Plan Week';

UPDATE goals 
SET domain = 'school' 
WHERE id = '5cc0916a-d67f-4538-88a8-2b5284fd84b7' 
AND title = 'Plan My Week';