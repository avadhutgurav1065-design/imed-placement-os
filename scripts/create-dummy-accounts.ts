import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAccounts() {
  console.log("Generating dummy accounts...");

  // 1. Admin
  let adminUser = null;
  const { data: aData, error: aErr } = await supabase.auth.admin.createUser({
    email: "admin@imed.edu",
    password: "password123",
    email_confirm: true,
    user_metadata: { role: "admin" }
  });

  if (aErr) {
    if (aErr.message.includes("already been registered") || aErr.message.includes("already exists")) {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      adminUser = users.find(u => u.email === "admin@imed.edu");
    } else {
      console.error("Error creating Admin auth:", aErr.message);
    }
  } else {
    adminUser = aData.user;
  }

  if (adminUser) {
    await supabase.from("admin_profiles").upsert({
      id: adminUser.id,
      email: adminUser.email,
      full_name: "System Administrator",
      role: "admin"
    });
    console.log("✅ Admin account ready (admin@imed.edu / password123)");
  }

  // 2. Student
  let studentUser = null;
  const { data: sData, error: sErr } = await supabase.auth.admin.createUser({
    email: "student@imed.edu",
    password: "password123",
    email_confirm: true,
    user_metadata: { role: "student" }
  });

  if (sErr) {
    if (sErr.message.includes("already been registered") || sErr.message.includes("already exists")) {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      studentUser = users.find(u => u.email === "student@imed.edu");
    } else {
      console.error("Error creating Student auth:", sErr.message);
    }
  } else {
    studentUser = sData.user;
  }

  if (studentUser) {
    await supabase.from("student_profiles").upsert({
      id: studentUser.id,
      email: studentUser.email,
      full_name: "Demo Student",
      branch: "BCA",
      batch_year: "2025",
      role: "student"
    });
    console.log("✅ Student account ready (student@imed.edu / password123)");
  }

  // 3. Alumni
  let alumniUser = null;
  const { data: alData, error: alErr } = await supabase.auth.admin.createUser({
    email: "alumni@imed.edu",
    password: "password123",
    email_confirm: true,
    user_metadata: { role: "alumni" }
  });

  if (alErr) {
    if (alErr.message.includes("already been registered") || alErr.message.includes("already exists")) {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      alumniUser = users.find(u => u.email === "alumni@imed.edu");
    } else {
      console.error("Error creating Alumni auth:", alErr.message);
    }
  } else {
    alumniUser = alData.user;
  }

  if (alumniUser) {
    await supabase.from("alumni_profiles").upsert({
      id: alumniUser.id,
      email: alumniUser.email,
      full_name: "Demo Alumni",
      company: "Google",
      role: "alumni"
    });
    console.log("✅ Alumni account ready (alumni@imed.edu / password123)");
  }
}

createAccounts();
