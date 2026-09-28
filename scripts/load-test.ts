import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define API URL based on environment
const API_URL = 'http://localhost:3000';

const CONCURRENT_STUDENTS = 20; // Try 20 at a time to avoid immediate ban
const DELAY_BETWEEN_BATCHES = 5000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateStudentLoad(studentId: string, email: string) {
  console.log(`[${email}] Starting simulation...`);
  try {
    // 1. Simulate fetching gap analysis (which returns 202 and processes in background)
    // We would need the user session token to hit the protected /api/analyze route if it checks auth
    // Note: This script is just a demonstration. Real load testing against Next.js Auth is complex 
    // because you need valid JWTs for each user.
    console.log(`[${email}] Simulated API Call triggered...`);
    
    // Simulate API delay
    await sleep(2000 + Math.random() * 2000);
    console.log(`[${email}] Simulation complete!`);
    return { success: true };
  } catch (error) {
    console.error(`[${email}] Error:`, error);
    return { success: false };
  }
}

async function main() {
  console.log("==========================================");
  console.log("🚀 IMED PLACEMENT OS - LOCAL LOAD TESTER");
  console.log("==========================================\n");

  // Fetch all dummy students
  const { data: students, error } = await supabase
    .from('student_profiles')
    .select('id, full_name')
    .limit(100);

  if (error || !students) {
    console.error("Failed to fetch students. Have you seeded the DB?");
    return;
  }

  console.log(`Found ${students.length} students to simulate.\n`);

  for (let i = 0; i < students.length; i += CONCURRENT_STUDENTS) {
    const batch = students.slice(i, i + CONCURRENT_STUDENTS);
    console.log(`\n--- Firing Batch ${i / CONCURRENT_STUDENTS + 1} (${batch.length} students) ---`);
    
    const promises = batch.map(s => simulateStudentLoad(s.id, s.full_name));
    await Promise.all(promises);

    console.log(`--- Batch Complete ---`);
    
    if (i + CONCURRENT_STUDENTS < students.length) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch to simulate human traffic...`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  console.log("\n✅ LOAD TEST COMPLETE!");
}

main();
