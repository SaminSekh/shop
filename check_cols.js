
const { createClient } = require(" @supabase/supabase-js\);
const supabase = createClient(\https://uzpujtaqzuzjtqecbzto.supabase.co\, \sb_publishable_-AG7Cn5lImdpWk6yS62tVw_WZax4Yas\);
async function check() {
 const { error } = await supabase.from(\sale_items\).select(\product_name product_image sku\).limit(1);
 if (error) console.log(error.message);
 else console.log(\Columns exist\);
}
check();

