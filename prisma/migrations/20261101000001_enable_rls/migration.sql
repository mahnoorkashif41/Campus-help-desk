-- Row Level Security with NO policies: Supabase's public API (anon/authenticated roles)
-- can read or write nothing. Our server connects as the database owner, which bypasses RLS.
ALTER TABLE "Complaint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplaintImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
