import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email: env.ALLOWED_USER_EMAIL,
});

if (error) {
  console.error("ERROR", error);
  process.exit(1);
}

console.log(data.properties.hashed_token);
