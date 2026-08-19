import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAdmin() {
  let adminUser = null;
  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@imed.edu",
    password: "password123",
    email_confirm: true,
    user_metadata: { role: "admin" }
  });

  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already exists')) {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      adminUser = users.find(u => u.email === "admin@imed.edu");
    } else {
      console.error("Error creating admin auth user:", error.message);
      return;
    }
  } else {
    adminUser = data?.user;
  }

  if (adminUser) {
    const { error: profileError } = await supabase
      .from("admin_profiles")
      .upsert({
        id: adminUser.id,
        email: adminUser.email,
        full_name: "System Administrator",
        role: "admin"
      });
      
    if (profileError) {
      console.error("Error creating admin profile:", profileError.message);
    } else {
      console.log("Admin user created/updated successfully:", adminUser.email);
    }
  }
}

createAdmin();
