import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = "5e528f14-ab9e-44dd-befe-eb059a0fc475";

  // First check if user exists in auth.users
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) {
    console.error("Auth User Error:", userError.message);
    return;
  }
  
  console.log("Found auth user:", user.user.email);

  // Upsert into student_profiles
  const { error: profileError } = await supabase.from("student_profiles").upsert({
    id: userId,
    email: user.user.email,
    full_name: user.user.user_metadata?.full_name || "Student User",
    role: "student",
    branch: "Computer Science",
    batch_year: "2027"
  });

  if (profileError) {
    console.error("Profile Upsert Error:", profileError.message);
  } else {
    console.log("Successfully created student_profile for user!");
  }
}

run();
