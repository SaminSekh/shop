
const { createClient } = require(" @supabase/supabase-js\);
const supabase = createClient(\YOUR_URL\, \YOUR_KEY\);
async function test() {
 const { data } = await supabase.from(\sale_items\).select(\*\).limit(1);
 console.log(Object.keys(data[0] || {}));
}
test();

