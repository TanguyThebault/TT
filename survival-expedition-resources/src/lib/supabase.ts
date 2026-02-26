import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://kmkcvalixffvodtzgkkg.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImVhMTI2NmRkLTZlODctNDc5Ny1iZWE0LWUzMWQ1ZTk3MDg2NiJ9.eyJwcm9qZWN0SWQiOiJrbWtjdmFsaXhmZnZvZHR6Z2trZyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzcyMDU1OTE1LCJleHAiOjIwODc0MTU5MTUsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.oXrv167-_jDFaBG1TvqhZx2D6k1M6NKBj8GoGng6p7o';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };